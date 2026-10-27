import { describe, expect, test } from 'vitest';

import {
  HELP,
  parseCliArgs,
  parseQualityFlag,
  parseSizesFlag,
  UsageError,
} from './args.js';

describe('parseCliArgs', () => {
  test('inputs and output only', () => {
    expect(parseCliArgs(['photos', 'logo.png', '-o', 'public/img'])).toEqual({
      help: false,
      version: false,
      dryRun: false,
      json: false,
      config: { input: ['photos', 'logo.png'], output: 'public/img' },
    });
  });

  test('every flag', () => {
    const args = parseCliArgs([
      'photos',
      '--output=out',
      '-s',
      '1920,1280',
      '-f',
      'avif,webp,fallback',
      '-q',
      'avif=55',
      // values starting with a dash need the = form
      '--suffix=-{w}',
      '--strategy',
      '1024x768',
      '--on-error',
      'source',
      '-j',
      '6',
      '-c',
      'build.config.json',
      '--hooks',
      'build.hooks.js',
      '--manifest',
      'out/assets.json',
      '--force',
      '--no-upscale',
      '--dry-run',
      '--json',
      '-v',
    ]);
    expect(args).toEqual({
      help: false,
      version: false,
      configFile: 'build.config.json',
      hooksFile: 'build.hooks.js',
      dryRun: true,
      json: true,
      config: {
        input: ['photos'],
        output: 'out',
        sizes: [1920, 1280],
        formats: ['avif', 'webp', 'fallback'],
        formatOptions: { avif: { quality: 55 } },
        suffix: '-{w}',
        resizeStrategyHint: { width: 1024, height: 768 },
        abortScope: 'source',
        concurrency: 6,
        manifest: 'out/assets.json',
        force: true,
        upscale: false,
        logger: 'debug',
      },
    });
  });

  test('presets and keywords pass as they are', () => {
    expect(
      parseCliArgs([
        '-s',
        'responsive',
        '-f',
        'modern',
        '--strategy',
        'x2',
        '-j',
        'max',
        '--silent',
      ]).config
    ).toEqual({
      sizes: 'responsive',
      formats: 'modern',
      resizeStrategyHint: 'x2',
      concurrency: 'max',
      logger: 'silent',
    });
  });

  test('help and version', () => {
    expect(parseCliArgs(['-h']).help).toBe(true);
    expect(parseCliArgs(['--version']).version).toBe(true);
    expect(HELP).toMatch(/^Usage: picture-assets <input\.\.\.> --output <dir>/);
  });

  test.each([
    [['--outptu', 'x'], /Unknown option '--outptu'/],
    [['-o'], /argument missing/],
    [['-v', '--silent'], /can't be used together/],
    [['-s', 'big'], /Unknown size 'big' in --sizes/],
    [['-s', ','], /--sizes is empty/],
    [['-f', ' , '], /--formats is empty/],
    [['-q', '120'], /Invalid quality '120'/],
    [['-q', 'webp:80'], /Invalid 'webp:80' in --quality/],
    [['-q', 'bmp=80'], /Invalid 'bmp=80' in --quality/],
  ])('%j is a usage error', (argv, message) => {
    expect(() => parseCliArgs(argv)).toThrow(UsageError);
    expect(() => parseCliArgs(argv)).toThrow(message);
  });
});

describe('flag values', () => {
  test('sizes: widths and multipliers', () => {
    expect(parseSizesFlag(' 1920, x2 ,640 ')).toEqual([1920, 'x2', 640]);
  });

  test('quality: one for every lossy format, or per format', () => {
    expect(parseQualityFlag('75')).toEqual({
      avif: { quality: 75 },
      heif: { quality: 75 },
      jpeg: { quality: 75 },
      webp: { quality: 75 },
      tiff: { quality: 75 },
    });
    expect(parseQualityFlag('avif=55, jpg=82')).toEqual({
      avif: { quality: 55 },
      jpg: { quality: 82 },
    });
  });
});
