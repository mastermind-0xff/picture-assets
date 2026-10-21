import { describe, expect, test } from 'vitest';

import {
  expandFormats,
  expandSizes,
  FORMAT_PRESETS,
  isFormatPreset,
  isSizePreset,
} from './presets.js';

describe('expandSizes', () => {
  test('presets', () => {
    expect(expandSizes('responsive')).toEqual(
      [2560, 1920, 1280, 960, 640, 320].map((width) => ({ width }))
    );
    expect(expandSizes('retina')).toEqual([
      { width: 'x3', suffix: '@3x' },
      { width: 'x2', suffix: '@2x' },
      { width: 'x1', suffix: '@1x' },
    ]);
  });

  test('widths, multipliers and settings mixed', () => {
    expect(
      expandSizes([1280, 'x1.5', { height: 300, suffix: '-short' }])
    ).toEqual([
      { width: 1280 },
      { width: 'x1.5', suffix: '@1.5x' },
      { height: 300, suffix: '-short' },
    ]);
  });

  test('invalid sizes', () => {
    expect(() => expandSizes('huge')).toThrow(
      "Unknown sizes preset 'huge': expected 'responsive', 'retina', or a list of sizes."
    );
    expect(() => expandSizes(1280)).toThrow(TypeError);
    expect(() => expandSizes([0])).toThrow(/width must be a positive number/);
    expect(() => expandSizes([])).toThrow(/non-empty list/);
  });
});

describe('expandFormats', () => {
  test('presets, the rest as is', () => {
    expect(expandFormats('web')).toEqual(['avif', 'webp', 'fallback']);
    expect(expandFormats('lossless')).toBe(FORMAT_PRESETS.lossless);
    const formats = ['png'];
    expect(expandFormats(formats)).toBe(formats);
    expect(expandFormats(undefined)).toBeUndefined();
  });

  test('unknown presets', () => {
    expect(() => expandFormats('png')).toThrow(
      "Unknown formats preset 'png': expected 'web', 'modern', 'lossless', or a list of formats."
    );
  });
});

describe('preset guards', () => {
  test('own keys only', () => {
    expect(isSizePreset('retina')).toBe(true);
    expect(isSizePreset('toString')).toBe(false);
    expect(isFormatPreset('modern')).toBe(true);
    expect(isFormatPreset('constructor')).toBe(false);
  });
});
