import { describe, expect, test } from 'vitest';

import { ENV_VARIABLES, readEnvOptions } from './env.js';

describe('readEnvOptions', () => {
  test('no variables, no options', () => {
    expect(readEnvOptions({})).toEqual({});
  });

  test('empty and blank variables are unset', () => {
    expect(
      readEnvOptions({
        [ENV_VARIABLES.logLevel]: '',
        [ENV_VARIABLES.abortScope]: '  ',
      })
    ).toEqual({});
  });

  test('every variable', () => {
    expect(
      readEnvOptions({
        PICTURE_ASSETS_RESIZE_STRATEGY_HINT: 'upsample',
        PICTURE_ASSETS_SUFFIX: '_{w}x{h}',
        PICTURE_ASSETS_FORMAT_OPTIONS:
          '{"jpg":{"quality":80,"progressive":true,"chromaSubsampling":"4:4:4"},"png":{"compressionLevel":6}}',
        PICTURE_ASSETS_ABORT_SCOPE: ' source ',
        PICTURE_ASSETS_LOG_LEVEL: 'silent',
        PICTURE_ASSETS_CONCURRENCY: ' 6 ',
      })
    ).toEqual({
      resizeStrategyHint: 'upsample',
      suffix: '_{w}x{h}',
      formatOptions: {
        jpg: { quality: 80, progressive: true, chromaSubsampling: '4:4:4' },
        png: { compressionLevel: 6 },
      },
      abortScope: 'source',
      logger: 'silent',
      concurrency: 6,
    });
  });

  test('concurrency: a number, auto or max', () => {
    for (const [value, concurrency] of [
      ['12', 12],
      ['auto', 'auto'],
      ['max', 'max'],
    ] as const)
      expect(readEnvOptions({ PICTURE_ASSETS_CONCURRENCY: value })).toEqual({
        concurrency,
      });
  });

  test('an empty suffix is a suffix', () => {
    expect(readEnvOptions({ PICTURE_ASSETS_SUFFIX: '' })).toEqual({
      suffix: '',
    });
  });

  test('resize strategy hints: multiplier and x1 size as JSON', () => {
    expect(
      readEnvOptions({ PICTURE_ASSETS_RESIZE_STRATEGY_HINT: 'x3.5' })
    ).toEqual({ resizeStrategyHint: 'x3.5' });
    expect(
      readEnvOptions({
        PICTURE_ASSETS_RESIZE_STRATEGY_HINT:
          '{"width":100, "height":200, "abc":123}',
      })
    ).toEqual({ resizeStrategyHint: { width: 100, height: 200 } });
  });

  test.each([
    ['PICTURE_ASSETS_LOG_LEVEL', 'warn', RangeError],
    ['PICTURE_ASSETS_ABORT_SCOPE', 'format', RangeError],
    ['PICTURE_ASSETS_RESIZE_STRATEGY_HINT', '{"width":100}', TypeError],
    ['PICTURE_ASSETS_RESIZE_STRATEGY_HINT', 'sideways', TypeError],
    ['PICTURE_ASSETS_RESIZE_STRATEGY_HINT', '{width:100}', SyntaxError],
    ['PICTURE_ASSETS_FORMAT_OPTIONS', '123', TypeError],
    ['PICTURE_ASSETS_FORMAT_OPTIONS', '{noQuotes:123}', SyntaxError],
    ['PICTURE_ASSETS_FORMAT_OPTIONS', '{"bmp":{}}', RangeError],
    ['PICTURE_ASSETS_SUFFIX', '@{sm}x', RangeError],
    ['PICTURE_ASSETS_CONCURRENCY', '0', RangeError],
    ['PICTURE_ASSETS_CONCURRENCY', '1.5', RangeError],
    ['PICTURE_ASSETS_CONCURRENCY', 'max_threads', RangeError],
  ])('%s=%s throws, naming the variable', (name, value, ErrorClass) => {
    expect(() => readEnvOptions({ [name]: value })).toThrow(ErrorClass);
    expect(() => readEnvOptions({ [name]: value })).toThrow(name);
  });
});
