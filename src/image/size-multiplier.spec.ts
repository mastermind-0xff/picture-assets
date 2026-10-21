import { describe, expect, test } from 'vitest';

import { extractSizeMultiplier, isSizeMultiplier } from './size-multiplier.js';

describe('isSizeMultiplier', () => {
  test('with proper values', () => {
    for (const value of ['x1', 'x1.1', 'x2.5', 'x3', 'x33', 'x.5', 'x2.'])
      expect(isSizeMultiplier(value), value).toBe(true);
  });

  test('with wrong values', () => {
    for (const value of [
      undefined,
      null,
      3,
      3.3,
      'x0',
      'x0.0',
      'x',
      'x1x',
      'ax1.1',
      '2.5',
      'X2',
      'x-1',
    ])
      expect(isSizeMultiplier(value), String(value)).toBe(false);
  });

  test('only plain decimals: no spaces, hex or exponents', () => {
    for (const value of ['x 2', 'x2 ', 'x0x10', 'x1e2', 'xInfinity', 'x+2'])
      expect(isSizeMultiplier(value), value).toBe(false);
  });
});

describe('extractSizeMultiplier', () => {
  test('with integer multipliers', () => {
    expect(extractSizeMultiplier('x2')).toBe(2);
    expect(extractSizeMultiplier('x3')).toBe(3);
    expect(extractSizeMultiplier('x999')).toBe(999);
  });

  test('with float multipliers', () => {
    expect(extractSizeMultiplier('x0.5')).toBe(0.5);
    expect(extractSizeMultiplier('x2.5')).toBe(2.5);
    expect(extractSizeMultiplier('x.5')).toBe(0.5);
  });
});
