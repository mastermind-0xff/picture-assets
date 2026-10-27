import fs from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createTempDir, writeFixtures } from '../test-utils/fixtures.js';
import { CASE_INSENSITIVE_FS, displayPath } from '../utils/helpers.js';
import { assertBatchSource, findSources, splitGlob } from './sources.js';

describe('splitGlob', () => {
  test.each([
    ['photos/**/*.jpg', 'photos', '**/*.jpg'],
    ['photos/trips/*.{jpg,png}', 'photos/trips', '*.{jpg,png}'],
    ['*.jpg', '.', '*.jpg'],
    ['./a/b/[ab].png', './a/b', '[ab].png'],
    ['/abs/**', '/abs', '**'],
    ['/**/*.png', '/', '**/*.png'],
    ['photos/house.jpg', 'photos', 'house.jpg'],
  ])('%s', (glob, root, pattern) => {
    expect(splitGlob(glob)).toEqual({ root, pattern });
  });

  test.runIf(process.platform === 'win32')(
    'backslashes and drives on Windows',
    () => {
      expect(splitGlob('C:\\photos\\**\\*.jpg')).toEqual({
        root: 'C:/photos',
        pattern: '**/*.jpg',
      });
      expect(splitGlob('C:\\*.jpg')).toEqual({ root: 'C:/', pattern: '*.jpg' });
    }
  );
});

describe('assertBatchSource', () => {
  test('strings and roots with patterns', () => {
    expect(assertBatchSource('photos/')).toBe('photos/');
    expect(assertBatchSource({ root: '', pattern: '*.jpg', extra: 1 })).toEqual(
      {
        root: '',
        pattern: '*.jpg',
      }
    );
  });

  test.each([
    [''],
    [5],
    [{ root: 'a' }],
    [{ root: 'a', pattern: ' ' }],
    [null],
  ])('%j throws', (value) => {
    expect(() => assertBatchSource(value)).toThrow(TypeError);
  });
});

describe('findSources', () => {
  let dir: string;
  let remove: () => Promise<void>;
  let file: (name: string) => string;
  const relative = (sources: { path: string; relativeDir: string }[]) =>
    sources.map((source) => ({
      path: path.relative(dir, source.path).replaceAll('\\', '/'),
      relativeDir: source.relativeDir.replaceAll('\\', '/'),
    }));

  beforeAll(async () => {
    ({ dir, remove } = await createTempDir());
    file = await writeFixtures(dir);
  });
  afterAll(() => remove());

  test('a directory: every image below it, sorted, other files left out', async () => {
    const { root, sources } = await findSources(file('tree'));
    expect(root).toBe(file('tree'));
    expect(relative(sources)).toEqual([
      { path: 'tree/a.jpg', relativeDir: '' },
      { path: 'tree/sub/b.png', relativeDir: 'sub' },
      { path: 'tree/sub/deeper/c.webp', relativeDir: 'sub/deeper' },
    ]);
  });

  test('a glob: rooted at its static part', async () => {
    const glob = `${dir.replaceAll('\\', '/')}/tree/**/*.{png,webp}`;
    const { root, sources } = await findSources(glob);
    expect(path.resolve(root)).toBe(path.resolve(file('tree')));
    expect(relative(sources)).toEqual([
      { path: 'tree/sub/b.png', relativeDir: 'sub' },
      { path: 'tree/sub/deeper/c.webp', relativeDir: 'sub/deeper' },
    ]);
  });

  test('a root and a pattern', async () => {
    const { sources } = await findSources({
      root: file('tree'),
      pattern: 'sub/*',
    });
    expect(relative(sources)).toEqual([
      { path: 'tree/sub/b.png', relativeDir: 'sub' },
    ]);
  });

  test('a file: as is, even with an unusual name', async () => {
    const odd = file('odd[1].jpg');
    await fs.copyFile(file('landscape.jpg'), odd);
    expect(await findSources(odd)).toEqual({
      root: dir,
      sources: [{ path: odd, relativeDir: '' }],
    });
  });

  test('the excluded directory is left out', async () => {
    const { sources } = await findSources(file('tree'), file('tree/sub'));
    expect(relative(sources)).toEqual([
      { path: 'tree/a.jpg', relativeDir: '' },
    ]);
  });

  test.runIf(CASE_INSENSITIVE_FS)(
    'the excluded directory in another case: left out too, where the file system ignores case',
    async () => {
      const { sources } = await findSources(
        file('tree'),
        file('tree/sub').toUpperCase()
      );
      expect(relative(sources)).toEqual([
        { path: 'tree/a.jpg', relativeDir: '' },
      ]);
    }
  );

  test('a path without wildcards that is not there: a missing source, a misspelled name?', async () => {
    for (const name of ['lanscape.jpg', 'tre/sub'])
      expect(await findSources(file(name))).toEqual({
        root: path.dirname(file(name)),
        sources: [
          {
            path: file(name),
            relativeDir: '',
            missing: new Error(
              `Not found: ${displayPath(file(name))}. A misspelled name?`
            ),
          },
        ],
      });
  });

  test('nothing found', async () => {
    expect((await findSources(file('tree/*.gif'))).sources).toEqual([]);
    expect((await findSources(file('missing/**/*'))).sources).toEqual([]);
  });
});
