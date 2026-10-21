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
        IMAGE_RESIZE_RESIZE_STRATEGY_HINT: 'upsample',
        IMAGE_RESIZE_SUFFIX: '_{w}x{h}',
        IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS:
          '{"jpg":{"quality":80,"progressive":true,"chromaSubsampling":"4:4:4"},"png":{"compressionLevel":6}}',
        IMAGE_RESIZE_ABORT_SCOPE: ' source ',
        IMAGE_RESIZE_LOG_LEVEL: 'silent',
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
    });
  });

  test('an empty suffix is a suffix', () => {
    expect(readEnvOptions({ IMAGE_RESIZE_SUFFIX: '' })).toEqual({ suffix: '' });
  });

  test('resize strategy hints: multiplier and x1 size as JSON', () => {
    expect(
      readEnvOptions({ IMAGE_RESIZE_RESIZE_STRATEGY_HINT: 'x3.5' })
    ).toEqual({ resizeStrategyHint: 'x3.5' });
    expect(
      readEnvOptions({
        IMAGE_RESIZE_RESIZE_STRATEGY_HINT:
          '{"width":100, "height":200, "abc":123}',
      })
    ).toEqual({ resizeStrategyHint: { width: 100, height: 200 } });
  });

  test.each([
    ['IMAGE_RESIZE_LOG_LEVEL', 'warn', RangeError],
    ['IMAGE_RESIZE_ABORT_SCOPE', 'format', RangeError],
    ['IMAGE_RESIZE_RESIZE_STRATEGY_HINT', '{"width":100}', TypeError],
    ['IMAGE_RESIZE_RESIZE_STRATEGY_HINT', 'sideways', TypeError],
    ['IMAGE_RESIZE_RESIZE_STRATEGY_HINT', '{width:100}', SyntaxError],
    ['IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS', '123', TypeError],
    ['IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS', '{noQuotes:123}', SyntaxError],
    ['IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS', '{"bmp":{}}', RangeError],
  ])('%s=%s throws, naming the variable', (name, value, ErrorClass) => {
    expect(() => readEnvOptions({ [name]: value })).toThrow(ErrorClass);
    expect(() => readEnvOptions({ [name]: value })).toThrow(name);
  });
});
