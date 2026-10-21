import { Logger } from '@mmutils/logger';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { createRecordingLogger } from '../test-utils/logger.js';
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
        IMAGE_RESIZE_SUFFIX: '-{w}',
        IMAGE_RESIZE_ABORT_SCOPE: 'batch',
        IMAGE_RESIZE_LOG_LEVEL: 'error',
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
        IMAGE_RESIZE_SUFFIX: '-{w}',
        IMAGE_RESIZE_ABORT_SCOPE: 'batch',
        IMAGE_RESIZE_RESIZE_STRATEGY_HINT: 'upsample',
        IMAGE_RESIZE_LOG_LEVEL: 'error',
      }
    );
    expect(resolved).toEqual({
      suffix: '',
      abortScope: 'source',
      resizeStrategyHint: 'x2',
      formatOptions: {},
      logger,
    });
  });

  test('format options are merged per field, the call last', () => {
    expect(
      resolveOptions(
        { formatOptions: { jpeg: { mozjpeg: false }, avif: { quality: 40 } } },
        {
          IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS:
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
    vi.stubEnv('IMAGE_RESIZE_SUFFIX', '_env');
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
  });

  test('an invalid variable throws even when the call sets the option', () => {
    expect(() =>
      resolveOptions({ logger: 'silent' }, { IMAGE_RESIZE_LOG_LEVEL: 'warn' })
    ).toThrow('IMAGE_RESIZE_LOG_LEVEL');
  });
});

describe('resolveConcurrency', () => {
  test('auto by default', () => {
    expect(resolveConcurrency(undefined)).toBe('auto');
    expect(resolveConcurrency(2)).toBe(2);
    expect(() => resolveConcurrency('max_threads')).toThrow(RangeError);
  });
});
