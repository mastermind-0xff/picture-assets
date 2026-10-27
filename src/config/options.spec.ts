import { Logger } from '@mmutils/logger';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NO_HOOKS } from '../image/hooks.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import type { Hook } from '../types/hooks.js';
import {
  DEFAULT_OPTIONS,
  resolveConcurrency,
  resolveOptions,
} from './options.js';

describe('resolveOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('defaults', () => {
    const resolved = resolveOptions({}, {});
    expect(resolved).toMatchObject({
      resizeStrategyHint: 'downsample',
      suffix: '@{w}w',
      formatOptions: {},
      abortScope: 'none',
    });
    expect(resolved.logger).toBeInstanceOf(Logger);
    expect(resolved.logger.level).toBe(DEFAULT_OPTIONS.logger);
  });

  test('environment variables over defaults', () => {
    const resolved = resolveOptions(
      {},
      {
        PICTURE_ASSETS_SUFFIX: '-{w}',
        PICTURE_ASSETS_ABORT_SCOPE: 'batch',
        PICTURE_ASSETS_LOG_LEVEL: 'error',
      }
    );
    expect(resolved).toMatchObject({ suffix: '-{w}', abortScope: 'batch' });
    expect(resolved.logger.level).toBe('error');
  });

  test('call options over environment variables', () => {
    const { logger } = createRecordingLogger();
    const resolved = resolveOptions(
      { suffix: '', abortScope: 'source', resizeStrategyHint: 'x2', logger },
      {
        PICTURE_ASSETS_SUFFIX: '-{w}',
        PICTURE_ASSETS_ABORT_SCOPE: 'batch',
        PICTURE_ASSETS_RESIZE_STRATEGY_HINT: 'upsample',
        PICTURE_ASSETS_LOG_LEVEL: 'error',
      }
    );
    expect(resolved).toEqual({
      suffix: '',
      abortScope: 'source',
      resizeStrategyHint: 'x2',
      formatOptions: {},
      logger,
      upscale: true,
      limitInputPixels: 268_402_689,
      overwriteSource: false,
      recordLimit: 64_000,
      hooks: NO_HOOKS,
    });
  });

  test('recordLimit: the call, then the variable, then 64 kB', () => {
    expect(resolveOptions({}, {}).recordLimit).toBe(64_000);
    const env = { PICTURE_ASSETS_RECORD_LIMIT: '1000' };
    expect(resolveOptions({}, env).recordLimit).toBe(1000);
    expect(resolveOptions({ recordLimit: false }, env).recordLimit).toBe(false);
    expect(() => resolveOptions({ recordLimit: 1.5 }, {})).toThrow(
      'Invalid recordLimit 1.5: expected a whole number of bytes from 1, or false for no limit.'
    );
  });

  test("limitInputPixels: the call, then the variable, then sharp's default", () => {
    expect(resolveOptions({}, {}).limitInputPixels).toBe(268_402_689);
    const env = { PICTURE_ASSETS_LIMIT_INPUT_PIXELS: '1000000' };
    expect(resolveOptions({}, env).limitInputPixels).toBe(1_000_000);
    expect(
      resolveOptions({ limitInputPixels: false }, env).limitInputPixels
    ).toBe(false);
    expect(() => resolveOptions({ limitInputPixels: 0 }, {})).toThrow(
      'Invalid limitInputPixels 0: expected a whole number of pixels from 1, or false for no limit.'
    );
    expect(() =>
      resolveOptions({ limitInputPixels: true as never }, {})
    ).toThrow(RangeError);
  });

  test('hooks: grouped by point, in the given order', () => {
    const grade: Hook = { name: 'grade', afterSourceLoad: () => undefined };
    const crop: Hook = {
      name: 'crop',
      beforeResize: () => undefined,
      beforeFormat: () => undefined,
    };
    const mark: Hook = { name: 'mark', beforeFormat: () => undefined };
    const { hooks } = resolveOptions({ hooks: [grade, crop, mark] }, {});
    expect(hooks).toEqual({
      all: [grade, crop, mark],
      afterSourceLoad: [grade],
      beforeResize: [crop],
      afterResize: [],
      beforeEncode: [],
      beforeFormat: [crop, mark],
      beforeFileWrite: [],
    });
    expect(resolveOptions({}, {}).hooks).toBe(NO_HOOKS);
    expect(resolveOptions({ hooks: [] }, {}).hooks).toBe(NO_HOOKS);
  });

  test('format options are merged per field, the call last', () => {
    expect(
      resolveOptions(
        { formatOptions: { jpeg: { mozjpeg: false }, avif: { quality: 40 } } },
        {
          PICTURE_ASSETS_FORMAT_OPTIONS:
            '{"jpeg":{"quality":70,"mozjpeg":true},"webp":{"quality":60}}',
        }
      ).formatOptions
    ).toEqual({
      jpeg: { quality: 70, mozjpeg: false },
      webp: { quality: 60 },
      avif: { quality: 40 },
    });
  });

  test('reads process.env by default', () => {
    vi.stubEnv('PICTURE_ASSETS_SUFFIX', '_env');
    expect(resolveOptions().suffix).toBe('_env');
  });

  test('invalid options throw', () => {
    expect(() => resolveOptions(null as never, {})).toThrow(
      'Options must be an object, got null.'
    );
    expect(() => resolveOptions({ abortScope: 'all' as never }, {})).toThrow(
      RangeError
    );
    expect(() => resolveOptions({ suffix: 5 as never }, {})).toThrow(TypeError);
    expect(() =>
      resolveOptions({ formatOptions: { webp: 'fast' as never } }, {})
    ).toThrow(TypeError);
    expect(() => resolveOptions({ hooks: {} as never }, {})).toThrow(
      'Hooks must be a list'
    );
  });

  test('unknown options throw, naming the expected ones', () => {
    const options = { sufix: '-{w}', logger: 'error' as const };
    expect(() => resolveOptions(options, {})).toThrow(
      "Unknown option 'sufix': expected resizeStrategyHint, suffix, formatOptions, upscale, abortScope, logger, limitInputPixels, overwriteSource, hooks, recordLimit."
    );
    expect(() =>
      resolveOptions({ sufix: '', concurrency: 2 } as never, {})
    ).toThrow(/^Unknown options 'sufix', 'concurrency': expected/);
    expect(() =>
      resolveOptions(
        {
          resizeStrategyHint: 'x2',
          suffix: '',
          formatOptions: {},
          upscale: false,
          abortScope: 'source',
          logger: 'error',
          hooks: [],
        },
        {}
      )
    ).not.toThrow();
  });

  test('an invalid variable throws even when the call sets the option', () => {
    expect(() =>
      resolveOptions({ logger: 'silent' }, { PICTURE_ASSETS_LOG_LEVEL: 'warn' })
    ).toThrow('PICTURE_ASSETS_LOG_LEVEL');
  });
});

describe('resolveConcurrency', () => {
  test('auto by default', () => {
    expect(resolveConcurrency(undefined, {})).toBe('auto');
    expect(resolveConcurrency(2, {})).toBe(2);
    expect(() => resolveConcurrency('max_threads', {})).toThrow(RangeError);
  });

  test('the call, then PICTURE_ASSETS_CONCURRENCY', () => {
    const env = { PICTURE_ASSETS_CONCURRENCY: '6' };
    expect(resolveConcurrency(undefined, env)).toBe(6);
    expect(resolveConcurrency('max', env)).toBe('max');
  });
});
