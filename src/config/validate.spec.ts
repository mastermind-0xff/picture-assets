import { describe, expect, test } from 'vitest';

import { createRecordingLogger } from '../test-utils/logger.js';
import {
  assertSettings,
  createEncoders,
  describe as describeValue,
  parseAbortScope,
  parseBoolean,
  parseConcurrency,
  parseFormatOptions,
  parseFormats,
  parseLogger,
  parseResizeStrategyHint,
  parseSuffixOption,
  selectEncoders,
} from './validate.js';

describe('describe', () => {
  test('values for error messages', () => {
    expect(describeValue('x')).toBe("'x'");
    expect(describeValue({ a: 1 })).toBe('{"a":1}');
    expect(describeValue(undefined)).toBe('undefined');
    expect(describeValue(() => 1)).toContain('=>');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(describeValue(circular)).toBe('[object Object]');
  });
});

describe('assertSettings', () => {
  test('valid settings', () => {
    expect(() => {
      assertSettings([
        { width: 100 },
        { height: 'x2' },
        { width: 'x1.5', height: 300, suffix: '', resizeOptions: {} },
        {
          width: 10,
          extractRegion: { left: 0, top: 0, width: 5, height: 5 },
          generateFromSource: true,
          useAsNextResizeIteration: false,
        },
      ]);
    }).not.toThrow();
  });

  test.each([
    [undefined, /non-empty list/],
    [[], /non-empty list/],
    [{ width: 100 }, /non-empty list/],
    [[null], /Setting 0 null: must be an object/],
    [[{ width: 100 }, {}], /Setting 1 \{\}: needs a width or a height/],
    [[{ width: 0 }], /width must be a positive number/],
    [[{ width: -5 }], /width must be a positive number/],
    [[{ width: Infinity }], /width must be a positive number/],
    [[{ height: '100' }], /height must be a positive number .* got '100'/],
    [[{ width: '2x' }], /multiplier like 'x2'/],
    [[{ width: 1, resizeOptions: 'cover' }], /resizeOptions must be an object/],
    [
      [{ width: 1, extractRegion: { left: 0, top: 0, width: 0, height: 5 } }],
      /extractRegion/,
    ],
    [
      [{ width: 1, extractRegion: { left: 0.5, top: 0, width: 1, height: 5 } }],
      /extractRegion/,
    ],
    [[{ width: 1, extractRegion: [0, 0, 1, 1] }], /extractRegion/],
    [[{ width: 1, suffix: 2 }], /suffix must be a string/],
    [
      [{ width: 'x2', suffix: '@{sm}x' }],
      /suffix has an unknown wildcard \{sm\} in '@\{sm\}x': the wildcards are \{w\}, \{h\}, \{x\}, \{wx\} and \{hx\}\./,
    ],
    [[{ width: 1, generateFromSource: 'yes' }], /generateFromSource/],
  ])('%j throws', (settings, message) => {
    expect(() => {
      assertSettings(settings);
    }).toThrow(message);
  });
});

describe('parseFormats', () => {
  test('lists and objects keep their order, once per format', () => {
    expect([...parseFormats(['webp', 'jpg', 'webp'])]).toEqual([
      ['webp', undefined],
      ['jpg', undefined],
    ]);
    expect([...parseFormats({ avif: { quality: 40 }, png: {} })]).toEqual([
      ['avif', { quality: 40 }],
      ['png', {}],
    ]);
    expect(parseFormats(undefined).size).toBe(0);
    expect(parseFormats([]).size).toBe(0);
  });

  test('invalid formats', () => {
    expect(() => parseFormats('webp')).toThrow(TypeError);
    expect(() => parseFormats(['webp', 'svg'])).toThrow(
      /Unknown output format 'svg'/
    );
    expect(() => parseFormats({ webp: 80 })).toThrow(
      /Options of format 'webp' must be an object/
    );
  });
});

describe('createEncoders', () => {
  test('complete options per format, checked by sharp', () => {
    const encoders = createEncoders(
      parseFormats({ webp: { quality: 60 }, jpg: {} }),
      { jpeg: { quality: 70 } }
    );
    expect(encoders).toEqual([
      { format: 'webp', options: { quality: 60 } },
      { format: 'jpg', options: { quality: 70, progressive: true } },
    ]);
  });

  test('options sharp rejects fail before any image', () => {
    expect(() =>
      createEncoders(parseFormats({ webp: { quality: 500 } }), {})
    ).toThrow(
      /Invalid webp options \{"quality":500\}: Expected integer between 1 and 100/
    );
    expect(() =>
      createEncoders(parseFormats(['avif']), {
        avif: { effort: 'max' } as never,
      })
    ).toThrow(TypeError);
  });

  test.runIf(!createEncodersCanWrite('jxl'))(
    'formats the installed sharp cannot write',
    () => {
      expect(() => createEncoders(parseFormats(['jxl']), {})).toThrow(
        /can't write jxl files/
      );
    }
  );
});

function createEncodersCanWrite(format: 'jxl') {
  try {
    createEncoders(parseFormats([format]), {});
    return true;
  } catch {
    return false;
  }
}

describe('option parsers', () => {
  test('parseAbortScope', () => {
    expect(parseAbortScope('none')).toBe('none');
    expect(parseAbortScope('batch')).toBe('batch');
    // the old scopes
    expect(() => parseAbortScope('format')).toThrow(
      "Unknown abort scope 'format': expected 'none', 'source', 'batch'."
    );
  });

  test('parseResizeStrategyHint', () => {
    expect(parseResizeStrategyHint('downsample')).toBe('downsample');
    expect(parseResizeStrategyHint('x2.5')).toBe('x2.5');
    expect(
      parseResizeStrategyHint({ width: 10, height: 20, extra: 1 })
    ).toEqual({ width: 10, height: 20 });
    expect(() => parseResizeStrategyHint({ width: 10 })).toThrow(TypeError);
    expect(() => parseResizeStrategyHint('auto')).toThrow(/'auto'/);
  });

  test('parseFormatOptions', () => {
    expect(parseFormatOptions({ webp: { quality: 1 } })).toEqual({
      webp: { quality: 1 },
    });
    expect(() => parseFormatOptions([])).toThrow(TypeError);
    expect(() => parseFormatOptions({ bmp: {} })).toThrow(RangeError);
    expect(() => parseFormatOptions({ webp: null })).toThrow(TypeError);
  });

  test('parseSuffixOption', () => {
    expect(parseSuffixOption('')).toBe('');
    expect(parseSuffixOption('@{x}x_{w}x{h}')).toBe('@{x}x_{w}x{h}');
    expect(() => parseSuffixOption(1)).toThrow(TypeError);
    expect(() => parseSuffixOption('_{wm}')).toThrow(
      new RangeError(
        "Suffix: unknown wildcard {wm} in '_{wm}': the wildcards are {w}, {h}, {x}, {wx} and {hx}."
      )
    );
  });

  test('parseConcurrency', () => {
    expect(parseConcurrency('auto')).toBe('auto');
    expect(parseConcurrency('max')).toBe('max');
    expect(parseConcurrency(3)).toBe(3);
    for (const value of [0, 1.5, -1, '4', 'max_threads'])
      expect(() => parseConcurrency(value), String(value)).toThrow(RangeError);
  });

  test('parseLogger', () => {
    expect(parseLogger('debug')).toBe('debug');
    const { logger } = createRecordingLogger();
    expect(parseLogger(logger)).toBe(logger);
    // a typo must not silently turn the logs off
    expect(() => parseLogger('warn')).toThrow(RangeError);
    expect(() => parseLogger({ info: () => undefined })).toThrow(
      'Logger is missing the methods error, warning, debug, verbose.'
    );
    expect(() => parseLogger(true)).toThrow(TypeError);
  });
});

describe("the 'fallback' format", () => {
  test('in lists only', () => {
    expect([...parseFormats(['avif', 'fallback'])]).toEqual([
      ['avif', undefined],
      ['fallback', undefined],
    ]);
    expect(() => parseFormats({ fallback: {} })).toThrow(
      "'fallback' takes no options: put it in a list, and set the options of jpg and png."
    );
  });

  test('both encoders, with the options of jpg and png', () => {
    expect(
      createEncoders(parseFormats(['fallback']), { png: { effort: 3 } })
    ).toEqual([
      {
        format: 'fallback',
        opaque: { format: 'jpg', options: { quality: 80, progressive: true } },
        transparent: {
          format: 'png',
          options: { compressionLevel: 9, effort: 3 },
        },
      },
    ]);
  });

  test('selectEncoders: JPEG, or PNG for transparent sources, each once', () => {
    const encoders = createEncoders(
      parseFormats(['png', 'fallback', 'jpg']),
      {}
    );
    expect(selectEncoders(encoders, false).map(({ format }) => format)).toEqual(
      ['png', 'jpg']
    );
    expect(selectEncoders(encoders, true).map(({ format }) => format)).toEqual([
      'png',
      'jpg',
    ]);
    expect(
      selectEncoders(createEncoders(parseFormats(['fallback']), {}), true).map(
        ({ format }) => format
      )
    ).toEqual(['png']);
  });
});

describe('parseBoolean', () => {
  test('booleans only', () => {
    expect(parseBoolean('upscale', false)).toBe(false);
    expect(() => parseBoolean('upscale', 'no')).toThrow(
      "upscale must be true or false, got 'no'."
    );
  });
});
