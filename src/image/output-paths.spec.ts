import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { parseFormats } from '../config/validate.js';
import { resolvePathsAndFormats } from './output-paths.js';

const src = path.join('photos', 'house-01.jpg');
const dest = (...parts: string[]) => path.join('out', ...parts);
const resolve = (srcPath: string, destPath: string, formats?: unknown) => {
  const { outputPath, formats: resolved } = resolvePathsAndFormats(
    srcPath,
    destPath,
    parseFormats(formats)
  );
  return { outputPath, formats: Object.fromEntries(resolved) };
};

describe('resolvePathsAndFormats', () => {
  test('destination directory: named after the source', () => {
    expect(resolve(src, dest('dir') + path.sep, ['webp'])).toEqual({
      outputPath: dest('dir', 'house-01'),
      formats: { webp: undefined },
    });
    expect(resolve(src, 'out/', ['webp']).outputPath).toBe(
      path.join('out', 'house-01')
    );
  });

  test('destination file with a format: its name, its format added', () => {
    expect(resolve(src, dest('hero.webp'), ['png', 'tiff'])).toEqual({
      outputPath: dest('hero'),
      formats: { png: undefined, tiff: undefined, webp: undefined },
    });
    expect(resolve(src, dest('hero.AVIF'), ['avif']).formats).toEqual({
      avif: undefined,
    });
  });

  test('destination identifier: its name', () => {
    expect(resolve(src, dest('hero'), ['png', 'tiff'])).toEqual({
      outputPath: dest('hero'),
      formats: { png: undefined, tiff: undefined },
    });
  });

  test('an extension that is not a format is part of the name', () => {
    // it was dropped: out/hero@1024w.jpg instead of out/hero.v2@1024w.jpg
    expect(resolve(src, dest('hero.v2'))).toEqual({
      outputPath: dest('hero.v2'),
      formats: { jpg: undefined },
    });
  });

  test("without formats: the source's format", () => {
    expect(resolve(src, dest('hero'))).toEqual({
      outputPath: dest('hero'),
      formats: { jpg: undefined },
    });
    expect(resolve('photo.JPEG', dest('x')).formats).toEqual({
      jpeg: undefined,
    });
  });

  test('object formats keep their options', () => {
    expect(
      resolve(src, dest('hero'), { webp: { quality: 50 }, jpeg: {} })
    ).toEqual({
      outputPath: dest('hero'),
      formats: { webp: { quality: 50 }, jpeg: {} },
    });
  });

  test('formats are never modified', () => {
    const formats = parseFormats({});
    resolvePathsAndFormats(src, dest('hero.webp'), formats);
    resolvePathsAndFormats(src, dest('dir') + path.sep, formats);
    expect(formats.size).toBe(0);
  });

  test("sources whose format can't be written need formats", () => {
    expect(() => resolve('logo.svg', dest('logo'))).toThrow(
      "No output format for logo.svg: pass formats, or a destination with a format extension. The source's own format ('svg') can't be written."
    );
    expect(() => resolve('house', dest('x'))).toThrow(/no extension/);
    expect(resolve('logo.svg', dest('logo'), ['png']).formats).toEqual({
      png: undefined,
    });
  });
});
