import fs from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { groupHooks, NO_HOOKS } from '../image/hooks.js';
import { createTempDir } from '../test-utils/fixtures.js';
import type { Hook } from '../types/hooks.js';
import type { SourceTarget } from './generate-single-source-assets.js';
import {
  isUnchanged,
  manifestPath,
  readManifest,
  targetHash,
  writeManifest,
  type ManifestEntry,
} from './manifest.js';

let dir: string;
let remove: () => Promise<void>;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
});
afterAll(() => remove());

const target: SourceTarget = {
  outputPath: path.join('out', 'house'),
  encoders: [{ format: 'webp', options: { quality: 80, effort: 4 } }],
};
const options = {
  suffix: '@{w}w',
  resizeStrategyHint: 'downsample',
  upscale: true,
  hooks: NO_HOOKS,
} as const;

describe('manifestPath', () => {
  test("relative to the manifest's directory, with /", () => {
    expect(
      manifestPath(
        path.join('out', 'assets.json'),
        path.join('out', 'a', 'b.webp')
      )
    ).toBe('a/b.webp');
    expect(
      manifestPath(path.join('out', 'assets.json'), path.join('src', 'b.jpg'))
    ).toBe('../src/b.jpg');
  });
});

describe('targetHash', () => {
  const manifest = path.join('out', 'assets.json');

  test('the same for the same options, whatever their key order', () => {
    const reordered: SourceTarget = {
      encoders: [{ format: 'webp', options: { effort: 4, quality: 80 } }],
      outputPath: target.outputPath,
    };
    expect(targetHash(manifest, target, [{ width: 100 }], options)).toBe(
      targetHash(manifest, reordered, [{ width: 100 }], options)
    );
  });

  test('another for any option that changes the files', () => {
    const hash = targetHash(manifest, target, [{ width: 100 }], options);
    expect(targetHash(manifest, target, [{ width: 101 }], options)).not.toBe(
      hash
    );
    expect(
      targetHash(manifest, target, [{ width: 100 }], {
        ...options,
        suffix: '-{w}',
      })
    ).not.toBe(hash);
    expect(
      targetHash(manifest, target, [{ width: 100 }], {
        ...options,
        upscale: false,
      })
    ).not.toBe(hash);
    expect(
      targetHash(
        manifest,
        { ...target, encoders: [{ format: 'webp', options: { quality: 81 } }] },
        [{ width: 100 }],
        options
      )
    ).not.toBe(hash);
  });

  test('hooks: their names and keys, not their functions', () => {
    const withHooks = (...hooks: Hook[]) =>
      targetHash(manifest, target, [{ width: 100 }], {
        ...options,
        hooks: groupHooks(hooks),
      });
    const grade: Hook = { name: 'grade', source: () => undefined };
    const hash = targetHash(manifest, target, [{ width: 100 }], options);

    expect(withHooks()).toBe(hash);
    expect(withHooks(grade)).not.toBe(hash);
    expect(withHooks({ ...grade, key: '2' })).not.toBe(withHooks(grade));
    expect(withHooks({ ...grade, name: 'grade2' })).not.toBe(withHooks(grade));
    // a function's changes can't be told: that's what the key is for
    expect(withHooks({ ...grade, source: (image) => image })).toBe(
      withHooks(grade)
    );
  });
});

describe('readManifest and writeManifest', () => {
  test('a written manifest reads back', async () => {
    const file = path.join(dir, 'written', 'assets.json');
    const manifest = { version: 1, sources: {} } as const;
    await writeManifest(file, manifest);
    expect(await readManifest(file)).toEqual({ manifest });
    // no temporary file left
    expect(await fs.readdir(path.dirname(file))).toEqual(['assets.json']);
  });

  test('none, or a problem', async () => {
    expect(await readManifest(path.join(dir, 'missing.json'))).toEqual({});
    const write = async (name: string, text: string) => {
      const file = path.join(dir, name);
      await fs.writeFile(file, text);
      return file;
    };
    expect(await readManifest(await write('broken.json', '{'))).toEqual({
      problem: 'not valid JSON',
    });
    expect(
      await readManifest(await write('v2.json', '{"version":2,"sources":{}}'))
    ).toEqual({ problem: 'not a version 1 manifest' });
    await expect(readManifest(dir)).rejects.toThrow();
  });
});

describe('isUnchanged', () => {
  test('the same file, the same hash, every output there', async () => {
    const manifest = path.join(dir, 'unchanged', 'assets.json');
    await fs.mkdir(path.dirname(manifest), { recursive: true });
    await fs.writeFile(path.join(dir, 'unchanged', 'a@100w.webp'), '');
    const entry: ManifestEntry = {
      bytes: 10,
      mtimeMs: 1000,
      hash: 'abc',
      outputs: [
        {
          file: 'a@100w.webp',
          format: 'webp',
          width: 100,
          height: 75,
          bytes: 0,
        },
      ],
    };
    const stats = { size: 10, mtimeMs: 1000 };
    expect(await isUnchanged(manifest, entry, stats, 'abc')).toBe(true);
    expect(await isUnchanged(manifest, undefined, stats, 'abc')).toBe(false);
    expect(
      await isUnchanged(manifest, entry, { ...stats, size: 11 }, 'abc')
    ).toBe(false);
    expect(
      await isUnchanged(manifest, entry, { ...stats, mtimeMs: 1001 }, 'abc')
    ).toBe(false);
    expect(await isUnchanged(manifest, entry, stats, 'abd')).toBe(false);
    expect(
      await isUnchanged(
        manifest,
        {
          ...entry,
          outputs: [
            ...entry.outputs,
            {
              file: 'gone.webp',
              format: 'webp',
              width: 1,
              height: 1,
              bytes: 0,
            },
          ],
        },
        stats,
        'abc'
      )
    ).toBe(false);
  });
});
