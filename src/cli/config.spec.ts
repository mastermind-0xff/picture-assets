import fs from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createTempDir } from '../test-utils/fixtures.js';
import {
  findConfigFile,
  loadConfigFile,
  mergeConfig,
  resolveConfigPaths,
} from './config.js';

let dir: string;
let remove: () => Promise<void>;

/** A path as the config gives it: relative to the current directory. */
const fromCwd = (...parts: string[]) =>
  path.relative(process.cwd(), path.join(...parts));

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
});
afterAll(() => remove());

const write = async (name: string, text: string) => {
  const file = path.join(dir, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text);
  return file;
};

describe('findConfigFile', () => {
  test('JSON first, then JS', async () => {
    const folder = path.join(dir, 'find');
    await write('find/image-assets.config.mjs', 'export default {};');
    expect(await findConfigFile(folder)).toBe(
      path.join(folder, 'image-assets.config.mjs')
    );
    await write('find/image-assets.config.json', '{}');
    expect(await findConfigFile(folder)).toBe(
      path.join(folder, 'image-assets.config.json')
    );
    expect(
      await findConfigFile(path.join(dir, 'nothing-here'))
    ).toBeUndefined();
  });
});

describe('loadConfigFile', () => {
  test('JSON, paths relative to the file', async () => {
    const file = await write(
      'site/image-assets.config.json',
      JSON.stringify({
        input: ['src/images', 'src/icons/*.png'],
        output: 'public/img',
        manifest: 'public/img/assets.json',
        sizes: [640],
      })
    );
    const site = path.dirname(file);
    expect(await loadConfigFile(file)).toEqual({
      input: [fromCwd(site, 'src/images'), fromCwd(site, 'src/icons/*.png')],
      output: fromCwd(site, 'public/img'),
      manifest: fromCwd(site, 'public/img/assets.json'),
      sizes: [640],
    });
  });

  test('a JS module: its default export, or the function returning it', async () => {
    const object = await write(
      'js/object.mjs',
      "export default { input: 'a', output: 'b' };"
    );
    expect(await loadConfigFile(object)).toEqual({
      input: fromCwd(dir, 'js', 'a'),
      output: fromCwd(dir, 'js', 'b'),
    });
    const factory = await write(
      'js/factory.mjs',
      "export default async () => ({ output: 'out', suffix: '-{w}' });"
    );
    expect(await loadConfigFile(factory)).toEqual({
      output: fromCwd(dir, 'js', 'out'),
      suffix: '-{w}',
    });
  });

  test('invalid files', async () => {
    const broken = await write('bad/broken.json', '{ input: "a" }');
    await expect(loadConfigFile(broken)).rejects.toThrow(
      /broken\.json is not valid JSON/
    );
    const list = await write('bad/list.json', '["a"]');
    await expect(loadConfigFile(list)).rejects.toThrow(
      /must hold a config object/
    );
    const none = await write('bad/none.mjs', 'export const input = 1;');
    await expect(loadConfigFile(none)).rejects.toThrow(TypeError);
  });
});

describe('mergeConfig', () => {
  test('flags over the file, format options per format', () => {
    expect(
      mergeConfig(
        {
          output: 'a',
          suffix: '-{w}',
          formatOptions: { avif: { quality: 50, effort: 6 }, png: {} },
        },
        { output: 'b', formatOptions: { avif: { quality: 70 } } }
      )
    ).toEqual({
      output: 'b',
      suffix: '-{w}',
      formatOptions: { avif: { quality: 70, effort: 6 }, png: {} },
    });
  });

  test('resolveConfigPaths leaves other values alone', () => {
    expect(resolveConfigPaths({ input: [1], sizes: 'x' }, dir)).toEqual({
      input: [1],
      sizes: 'x',
    });
  });
});
