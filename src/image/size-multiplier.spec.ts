import { isSizeMultiplier, extractSizeMultiplier } from './size-multiplier';

describe('check isMultiplier', () => {
  test('with proper values', () => {
    expect(isSizeMultiplier('x1')).toStrictEqual(true);
    expect(isSizeMultiplier('x1.1')).toStrictEqual(true);
    expect(isSizeMultiplier('x2.5')).toStrictEqual(true);
    expect(isSizeMultiplier('x3')).toStrictEqual(true);
    expect(isSizeMultiplier('x33')).toStrictEqual(true);
  });
  test('with wrong values', () => {
    expect(isSizeMultiplier(undefined)).toStrictEqual(false);
    expect(isSizeMultiplier('x0')).toStrictEqual(false);
    expect(isSizeMultiplier('x1x')).toStrictEqual(false);
    expect(isSizeMultiplier('ax1.1')).toStrictEqual(false);
    expect(isSizeMultiplier('2.5')).toStrictEqual(false);
    expect(isSizeMultiplier(3)).toStrictEqual(false);
    expect(isSizeMultiplier(3.3)).toStrictEqual(false);
  });
});

describe('check extractSizeMultiplier', () => {
  test('with integer multipliers', () => {
    expect(extractSizeMultiplier('x2')).toStrictEqual(2);
    expect(extractSizeMultiplier('x3')).toStrictEqual(3);
    expect(extractSizeMultiplier('x999')).toStrictEqual(999);
  });
  test('with float multipliers', () => {
    expect(extractSizeMultiplier('x0.5')).toStrictEqual(0.5);
    expect(extractSizeMultiplier('x2.5')).toStrictEqual(2.5);
    expect(extractSizeMultiplier('x999.5')).toStrictEqual(999.5);
  });
});
