import fs from 'node:fs/promises';
import path from 'node:path';

import sharp, { type Sharp } from 'sharp';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import type { SizesInput } from '../config/presets.js';
import {
  createTempDir,
  listFiles,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import { ResultBatchError } from '../errors/result-errors.js';
import type { ResultBatch } from '../types/output.js';
import { displayPath } from '../utils/helpers.js';
import { generateAssets, planAssets } from './generate-assets.js';
import { readManifest } from './manifest.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());

const outDir = () => path.join(dir, 'out', `${++testIndex}`);
const silent = { logger: 'silent' } as const;
const statuses = (batch: ResultBatch) =>
  batch.sources.map(({ source, status }) => [path.basename(source), status]);

/** A copy of tree/, so tests can change its files. */
const copyTree = async () => {
  const root = path.join(dir, `tree-${++testIndex}`);
  await fs.cp(file('tree'), root, { recursive: true });
  return root;
};

describe('generateAssets: defaults', () => {
  test('responsive sizes, never enlarged; AVIF, WebP and a fallback', async () => {
    const output = outDir();
    const batch = await generateAssets({
      input: [file('landscape.jpg'), file('transparent.png')],
      output,
      ...silent,
    });

    expect(batch.status).toBe('succeed');
    // 2560 made at the source's size, 1920 to 960 larger than 800: skipped
    expect(
      batch.sources[0]?.outputsBySetting.map(({ size, status }) => [
        size,
        status,
      ])
    ).toEqual([
      ['800x600', 'succeed'],
      ['1920x1440', 'skipped'],
      ['1280x960', 'skipped'],
      ['960x720', 'skipped'],
      ['640x480', 'succeed'],
      ['320x240', 'succeed'],
    ]);
    expect(batch.sources[0]).toMatchObject({ width: 800, height: 600 });
    // the fallback is JPEG, or PNG for the transparent source
    expect(await listFiles(output)).toEqual([
      'landscape@320w.avif',
      'landscape@320w.jpg',
      'landscape@320w.webp',
      'landscape@640w.avif',
      'landscape@640w.jpg',
      'landscape@640w.webp',
      'landscape@800w.avif',
      'landscape@800w.jpg',
      'landscape@800w.webp',
      'transparent@320w.avif',
      'transparent@320w.png',
      'transparent@320w.webp',
      'transparent@400w.avif',
      'transparent@400w.png',
      'transparent@400w.webp',
    ]);
  });

  test('explicit sizes are enlarged, unless upscale is false', async () => {
    const output = outDir();
    const enlarged = await generateAssets({
      input: file('small.webp'),
      output,
      sizes: [400],
      formats: ['webp'],
      ...silent,
    });
    expect(enlarged.sources[0]?.outputsBySetting[0]?.size).toBe('400x200');

    const kept = await generateAssets({
      input: file('small.webp'),
      output: outDir(),
      sizes: [400, 100],
      formats: ['webp'],
      upscale: false,
      ...silent,
    });
    expect(kept.sources[0]?.outputsBySetting.map(({ size }) => size)).toEqual([
      '200x100',
      '100x50',
    ]);
  });

  test('several inputs, each file once, each tree mirrored', async () => {
    const output = outDir();
    const batch = await generateAssets({
      input: [file('tree'), file('tree/a.jpg'), file('small.webp')],
      output,
      sizes: [50],
      formats: ['png'],
      ...silent,
    });
    expect(statuses(batch)).toEqual([
      ['a.jpg', 'succeed'],
      ['b.png', 'succeed'],
      ['c.webp', 'succeed'],
      ['small.webp', 'succeed'],
    ]);
    expect(await listFiles(output)).toEqual([
      'a@50w.png',
      'small@50w.png',
      'sub/b@50w.png',
      'sub/deeper/c@50w.png',
    ]);
  });

  test('invalid configs throw before any work', async () => {
    const output = outDir();
    await expect(
      generateAssets({ input: 'a', outptu: 'b' } as never)
    ).rejects.toThrow(/^Unknown option 'outptu': expected input, output,/);
    await expect(generateAssets({ input: [], output })).rejects.toThrow(
      /at least one/
    );
    await expect(
      generateAssets({ input: file('tree'), output, sizes: 'huge' as never })
    ).rejects.toThrow(/Unknown sizes preset/);
    await expect(
      generateAssets({ input: file('tree'), output, formats: ['bmp'] as never })
    ).rejects.toThrow(/Unknown output format 'bmp'/);
    await expect(
      generateAssets({ input: file('tree'), output, signal: 1 as never })
    ).rejects.toThrow(/AbortSignal/);
    await expect(fs.access(output)).rejects.toThrow();
  });

  test('the whole config is checked before any source is searched', async () => {
    const glob = vi.spyOn(fs, 'glob');
    const output = outDir();
    for (const invalid of [
      { concurrency: 0 },
      { force: 'yes' },
      { manifest: '' },
      { signal: 1 },
    ])
      await expect(
        generateAssets({ input: file('tree'), output, ...invalid } as never)
      ).rejects.toThrow();
    expect(glob).not.toHaveBeenCalled();
    glob.mockRestore();
  });

  test('an aborted signal stops the run', async () => {
    const output = outDir();
    const batch = await generateAssets({
      input: file('tree'),
      output,
      sizes: [50],
      formats: ['png'],
      signal: AbortSignal.abort(),
      ...silent,
    });
    expect(batch.status).toBe('aborted');
    expect(batch.sources.every(({ status }) => status === 'aborted')).toBe(
      true
    );
    await expect(fs.access(output)).rejects.toThrow();
  });
});

describe('generateAssets: paths', () => {
  test('logs and messages show / paths; results keep native ones', async () => {
    const { logger, logs } = createRecordingLogger('verbose');
    const output = outDir();
    const manifest = path.join(output, 'assets.json');
    const batch = await generateAssets({
      input: [file('tree'), file('corrupt.jpg')],
      output,
      sizes: [50],
      formats: ['webp'],
      manifest,
      logger,
      hooks: [{ name: 'mark', beforeFormat: () => undefined }],
    });

    // every text a log shows: messages, and string values of object logs
    const texts = logs.flatMap(({ data }) =>
      typeof data === 'string' ?
        [data]
      : Object.values(data).filter(
          (value): value is string => typeof value === 'string'
        )
    );
    expect(texts.length).toBeGreaterThan(20);
    expect(texts.filter((text) => text.includes('\\'))).toEqual([]);
    expect(texts).toContainEqual(
      expect.stringMatching(
        /^Hook mark start: beforeFormat of .*\/a@50w\.webp$/
      )
    );
    expect(texts).toContainEqual(
      expect.stringMatching(
        /^Manifest written: .*\/assets\.json, 3 source\(s\)$/
      )
    );

    // results: native paths, for path and fs
    expect(batch.sources.map(({ source }) => source)).toEqual([
      path.join(file('tree'), 'a.jpg'),
      path.join(file('tree'), 'sub', 'b.png'),
      path.join(file('tree'), 'sub', 'deeper', 'c.webp'),
      file('corrupt.jpg'),
    ]);
  });
});

describe('generateAssets: manifest and incremental runs', () => {
  const run = (root: string, output: string, extra = {}) =>
    generateAssets({
      input: root,
      output,
      sizes: [100, 50],
      formats: ['webp'],
      manifest: path.join(output, 'assets.json'),
      ...silent,
      ...extra,
    });

  test('hooks: an edit of a hook without a key remakes the sources', async () => {
    const root = await copyTree();
    const output = outDir();
    const only = (batch: ResultBatch) =>
      batch.sources.map(({ status }) => status);
    await run(root, output, {
      hooks: [
        { name: 'grade', afterSourceLoad: (image: Sharp) => image.negate() },
      ],
    });
    // the same code: unchanged
    expect(
      only(
        await run(root, output, {
          hooks: [
            {
              name: 'grade',
              afterSourceLoad: (image: Sharp) => image.negate(),
            },
          ],
        })
      )
    ).toEqual(['skipped', 'skipped', 'skipped']);
    // other code under the same name: remade
    expect(
      only(
        await run(root, output, {
          hooks: [
            { name: 'grade', afterSourceLoad: (image: Sharp) => image.flop() },
          ],
        })
      )
    ).toEqual(['succeed', 'succeed', 'succeed']);
  });

  test('the manifest lists every file', async () => {
    const root = await copyTree();
    const output = outDir();
    await run(root, output);
    const { manifest } = await readManifest(path.join(output, 'assets.json'));
    const source = path
      .relative(output, path.join(root, 'sub/b.png'))
      .replaceAll('\\', '/');
    expect(manifest?.version).toBe(1);
    expect(manifest?.sources[source]).toMatchObject({
      width: 400,
      height: 300,
      hash: expect.stringMatching(/^[0-9a-f]{16}$/) as unknown,
      outputs: [
        { file: 'sub/b@100w.webp', format: 'webp', width: 100, height: 75 },
        { file: 'sub/b@50w.webp', format: 'webp', width: 50, height: 38 },
      ],
    });
  });

  test('unchanged sources are skipped; changes are processed again', async () => {
    const root = await copyTree();
    const output = outDir();
    expect(
      statuses(await run(root, output)).map(([, status]) => status)
    ).toEqual(['succeed', 'succeed', 'succeed']);
    const { logger, messages } = createRecordingLogger('info');
    const again = await run(root, output, { logger });
    expect(again.status).toBe('succeed');
    expect(statuses(again).map(([, status]) => status)).toEqual([
      'skipped',
      'skipped',
      'skipped',
    ]);
    expect(messages('info').slice(-2)).toEqual([
      expect.stringMatching(/0 of 3 sources \(3 unchanged\), 0 files/),
      expect.stringMatching(
        /^Manifest written: .*assets\.json, 3 source\(s\)$/
      ),
    ]);

    // a newer source, a missing output
    const later = new Date(Date.now() + 60_000);
    await fs.utimes(path.join(root, 'a.jpg'), later, later);
    await fs.rm(path.join(output, 'sub/deeper/c@50w.webp'));
    expect(statuses(await run(root, output))).toEqual([
      ['a.jpg', 'succeed'],
      ['b.png', 'skipped'],
      ['c.webp', 'succeed'],
    ]);

    // other options change every file
    expect(
      statuses(await run(root, output, { suffix: '-{w}' })).map(
        ([, status]) => status
      )
    ).toEqual(['succeed', 'succeed', 'succeed']);
    // force processes everything
    expect(
      statuses(await run(root, output, { suffix: '-{w}', force: true })).map(
        ([, status]) => status
      )
    ).toEqual(['succeed', 'succeed', 'succeed']);
  });

  test('a misspelled input fails with a warning; once corrected, the next run makes only it', async () => {
    const root = await copyTree();
    const output = outDir();
    const inputs = (second: string) => ({
      input: [path.join(root, 'a.jpg'), path.join(root, second)],
    });
    const { logger, logs } = createRecordingLogger('info');
    const first = await run(root, output, { ...inputs('sub/b.pgn'), logger });
    expect(first.status).toBe('failed');
    expect(statuses(first)).toEqual([
      ['a.jpg', 'succeed'],
      ['b.pgn', 'failed'],
    ]);
    const missing = `Not found: ${displayPath(path.join(root, 'sub/b.pgn'))}. A misspelled name?`;
    expect(String(first.sources[1]?.error)).toBe(`Error: ${missing}`);
    expect(logs).toContainEqual({ type: 'warning', data: missing });
    expect(logs).toContainEqual({
      type: 'info',
      data: expect.stringMatching(
        /^Found 1 source image\(s\) \(1 not found\) in /
      ) as unknown,
    });
    expect(logs.filter(({ type }) => type === 'error')).toEqual([]);

    const corrected = await run(root, output, inputs('sub/b.png'));
    expect(statuses(corrected)).toEqual([
      ['a.jpg', 'skipped'],
      ['b.png', 'succeed'],
    ]);

    // with abortScope 'batch', it stops the run
    await expect(
      run(root, outDir(), { ...inputs('sub/b.pgn'), abortScope: 'batch' })
    ).rejects.toThrow(ResultBatchError);
  });

  test('overwriteSource with a manifest: the source written over is unchanged for the next run', async () => {
    const root = await copyTree();
    const source = path.join(root, 'a.jpg');
    const inPlace = {
      input: source,
      output: root,
      sizes: [{ width: 200, suffix: '' }],
      formats: ['jpg'] as const,
      overwriteSource: true,
      manifest: path.join(root, 'assets.json'),
      ...silent,
    };
    expect(statuses(await generateAssets(inPlace))).toEqual([
      ['a.jpg', 'succeed'],
    ]);
    expect((await sharp(await fs.readFile(source)).metadata()).width).toBe(200);
    // not made again from its own 200 pixels
    expect(statuses(await generateAssets(inPlace))).toEqual([
      ['a.jpg', 'skipped'],
    ]);
  });

  test('a glob that matches nothing, among other inputs: a warning', async () => {
    const { logger, messages } = createRecordingLogger('info');
    const batch = await generateAssets({
      input: [file('tree'), `${dir.replaceAll('\\', '/')}/tree/*.jgp`],
      output: outDir(),
      sizes: [50],
      formats: ['webp'],
      logger,
    });
    expect(batch.status).toBe('succeed');
    expect(messages('warning')).toEqual([
      expect.stringMatching(/^No source images found in .*\/tree\/\*\.jgp\.$/),
    ]);
  });

  test('an unusable manifest is ignored, with a warning', async () => {
    const root = await copyTree();
    const output = outDir();
    await fs.mkdir(output, { recursive: true });
    await fs.writeFile(path.join(output, 'assets.json'), '{ broken');
    const { logger, messages } = createRecordingLogger('warning');
    const batch = await run(root, output, { logger });
    expect(batch.status).toBe('succeed');
    expect(messages('warning')[0]).toMatch(
      /Ignoring the manifest .*assets\.json: not valid JSON/
    );
    // and replaced
    expect(
      (await readManifest(path.join(output, 'assets.json'))).manifest
    ).toBeDefined();
  });
});

describe('planAssets', () => {
  test('sizes in pixels and files, nothing written', async () => {
    const output = outDir();
    const plan = await planAssets({
      input: [file('landscape.jpg'), file('corrupt.jpg')],
      output,
      sizes: [1600, 400, 200],
      formats: ['avif', 'fallback'],
      upscale: false,
      ...silent,
    });
    expect(plan.files).toBe(6);
    expect(plan.hooksNotRun).toEqual([]);
    expect(plan.sources[0]).toEqual({
      source: file('landscape.jpg'),
      status: 'planned',
      width: 800,
      height: 600,
      sizes: [
        {
          size: '800x600',
          status: 'planned',
          files: [
            path.join(output, 'landscape@800w.avif'),
            path.join(output, 'landscape@800w.jpg'),
          ],
        },
        {
          size: '400x300',
          status: 'planned',
          files: [
            path.join(output, 'landscape@400w.avif'),
            path.join(output, 'landscape@400w.jpg'),
          ],
        },
        {
          size: '200x150',
          status: 'planned',
          files: [
            path.join(output, 'landscape@200w.avif'),
            path.join(output, 'landscape@200w.jpg'),
          ],
        },
      ],
    });
    expect(plan.sources[1]).toMatchObject({
      status: 'failed',
      error: expect.objectContaining({
        message: expect.stringMatching(/unsupported image format/) as unknown,
      }) as unknown,
    });
    await expect(fs.access(output)).rejects.toThrow();
  });

  test('limitInputPixels: a larger source fails in the plan too', async () => {
    const plan = await planAssets({
      input: [file('landscape.jpg'), file('small.webp')],
      output: outDir(),
      sizes: [100],
      limitInputPixels: 100_000,
      ...silent,
    });
    expect(plan.sources.map(({ status }) => status)).toEqual([
      'failed',
      'planned',
    ]);
    expect(String(plan.sources[0]?.error)).toMatch(
      /has 800x600 pixels, more than limitInputPixels \(100000\)/
    );
  });

  test("one suffix for every size: a shorthand takes the run's, as widths and settings do", async () => {
    const names = async (sizes: SizesInput, suffix?: string) => {
      const plan = await planAssets({
        input: file('landscape.jpg'),
        output: outDir(),
        sizes,
        formats: ['webp'],
        ...(suffix !== undefined && { suffix }),
        ...silent,
      });
      return plan.sources[0]?.sizes.flatMap(({ files }) =>
        files.map((name) => path.basename(name))
      );
    };
    // 200 is x1, so x2 is 400 wide
    const byWidth = ['landscape@400w.webp', 'landscape@200w.webp'];
    expect(await names(['x2', 200])).toEqual(byWidth);
    expect(await names([{ width: 'x2' }, { width: 200 }])).toEqual(byWidth);
    expect(await names(['x2', 200], '-{w}')).toEqual([
      'landscape-400.webp',
      'landscape-200.webp',
    ]);
    expect(
      await names([{ width: 'x2', suffix: '@{x}x' }, 200], '-{w}')
    ).toEqual(['landscape@2x.webp', 'landscape-200.webp']);
  });

  test('hooks are not run: listed in the plan, with a warning', async () => {
    const { logger, messages } = createRecordingLogger('warning');
    const source = vi.fn(() => undefined);
    const plan = await planAssets({
      input: file('landscape.jpg'),
      output: outDir(),
      sizes: [200],
      formats: ['webp'],
      logger,
      hooks: [{ name: 'upscale', afterSourceLoad: source }],
    });
    expect(source).not.toHaveBeenCalled();
    expect(plan.hooksNotRun).toEqual(['upscale']);
    expect(plan.sources[0]?.sizes[0]?.size).toBe('200x150');
    expect(messages('warning')).toEqual([
      expect.stringMatching(/^The plan doesn't run the hooks \(upscale\)/),
    ]);
  });

  test('unchanged sources, from the manifest', async () => {
    const root = await copyTree();
    const output = outDir();
    const config = {
      input: root,
      output,
      sizes: [50],
      formats: ['webp'],
      manifest: path.join(output, 'assets.json'),
      ...silent,
    } as const;
    await generateAssets(config);
    const plan = await planAssets(config);
    expect(plan.sources.map(({ status }) => status)).toEqual([
      'unchanged',
      'unchanged',
      'unchanged',
    ]);
    expect(plan.files).toBe(0);
    const forced = await planAssets({ ...config, force: true });
    expect(forced.files).toBe(3);
  });
});
