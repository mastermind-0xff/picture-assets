import sharp from 'sharp';
import { describe, expect, test } from 'vitest';

import {
  canWriteFormat,
  DEFAULT_FORMAT_OPTIONS,
  INPUT_EXTENSIONS,
  isInputFile,
  isOutputFormat,
  OUTPUT_FORMATS,
  resolveFormatOptions,
  supportsAlpha,
  toSharpFormat,
} from './formats.js';

describe('isOutputFormat', () => {
  test('output formats and aliases', () => {
    for (const format of ['avif', 'webp', 'jpg', 'jpeg', 'png', 'tif', 'gif'])
      expect(isOutputFormat(format), format).toBe(true);
  });

  test('input only formats, junk aliases and other values', () => {
    // the old alias map registered 'pg', 'pe', 'if' and 'vif'
    for (const value of ['svg', 'pdf', 'raw', 'pg', 'pe', 'if', 'vif', 'v'])
      expect(isOutputFormat(value), value).toBe(false);
    for (const value of [undefined, 1, {}, 'toString', 'JPG'])
      expect(isOutputFormat(value), JSON.stringify(value)).toBe(false);
  });
});

describe('canWriteFormat', () => {
  test('web formats are always available', () => {
    for (const format of ['avif', 'webp', 'jpeg', 'jpg', 'png', 'gif'] as const)
      expect(canWriteFormat(format), format).toBe(true);
  });

  test('follows the installed sharp for optional encoders', () => {
    expect(canWriteFormat('jxl')).toBe(sharp.format.jxl.output.file);
    expect(canWriteFormat('jp2')).toBe(sharp.format.jp2.output.file);
  });
});

describe('toSharpFormat', () => {
  test('maps the aliases sharp types do not list', () => {
    expect(toSharpFormat('jpg')).toBe('jpeg');
    expect(toSharpFormat('tif')).toBe('tiff');
    expect(toSharpFormat('avif')).toBe('avif');
    expect(toSharpFormat('webp')).toBe('webp');
  });
});

describe('supportsAlpha', () => {
  test('only JPEG has no alpha', () => {
    expect(OUTPUT_FORMATS.filter((format) => !supportsAlpha(format))).toEqual([
      'jpeg',
      'jpg',
    ]);
  });
});

describe('resolveFormatOptions', () => {
  test('defaults', () => {
    expect(resolveFormatOptions('webp', {})).toEqual(
      DEFAULT_FORMAT_OPTIONS.webp
    );
    expect(resolveFormatOptions('jpeg', {})).toEqual({
      quality: 80,
      progressive: true,
    });
  });

  test('png never gets a quality: it would turn on a lossy palette', () => {
    expect(resolveFormatOptions('png', {})).not.toHaveProperty('quality');
  });

  test('aliases share the options of their format', () => {
    expect(resolveFormatOptions('jpg', {})).toEqual(
      resolveFormatOptions('jpeg', {})
    );
    expect(resolveFormatOptions('jpg', { jpeg: { quality: 60 } })).toEqual({
      quality: 60,
      progressive: true,
    });
    expect(
      resolveFormatOptions('jpg', {
        jpeg: { quality: 60 },
        jpg: { progressive: false },
      })
    ).toEqual({ quality: 60, progressive: false });
  });

  test('call options win over format options, which win over defaults', () => {
    expect(
      resolveFormatOptions(
        'webp',
        { webp: { quality: 70, effort: 6 } },
        { quality: 50 }
      )
    ).toEqual({ quality: 50, effort: 6 });
  });

  test('avif and heif: quality, effort and chroma each change alone', () => {
    const { avif, heif } = DEFAULT_FORMAT_OPTIONS;
    expect(resolveFormatOptions('avif', { avif: { effort: 4 } })).toEqual({
      ...avif,
      effort: 4,
    });
    expect(resolveFormatOptions('avif', {}, { quality: 50 })).toEqual({
      ...avif,
      quality: 50,
    });
    expect(
      resolveFormatOptions('heif', { heif: { chromaSubsampling: '4:2:0' } })
    ).toEqual({ ...heif, chromaSubsampling: '4:2:0' });
    // the defaults are valid sharp options
    expect(() => sharp().avif(avif)).not.toThrow();
    expect(() => sharp().heif(heif)).not.toThrow();
  });
});

describe('input files', () => {
  test('extensions sharp can read', () => {
    for (const extension of ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tif'])
      expect(INPUT_EXTENSIONS.has(extension), extension).toBe(true);
  });

  test('not those sharp reads from files only: sources are read into a buffer', () => {
    // libvips' own format: `sharp(file)` reads it, `sharp(buffer)` fails
    // with "unsupported image format"
    expect(sharp.format.vips.input).toMatchObject({
      file: true,
      buffer: false,
    });
    expect(INPUT_EXTENSIONS.has('v')).toBe(false);
    expect(INPUT_EXTENSIONS.has('vips')).toBe(false);
    expect(isInputFile('image.v')).toBe(false);
  });

  test('isInputFile, case-insensitive', () => {
    expect(isInputFile('photo.JPG')).toBe(true);
    expect(isInputFile('logo.svg')).toBe(true);
    expect(isInputFile('archive.svg.gz')).toBe(true);
    expect(isInputFile('notes.txt')).toBe(false);
    expect(isInputFile('jpg')).toBe(false);
    expect(isInputFile('.DS_Store')).toBe(false);
  });
});
