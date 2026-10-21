import { describe, expect, test } from 'vitest';

import { findUnknownWildcard, parseSuffix } from './suffix.js';

describe('parseSuffix', () => {
  test('without wildcards', () => {
    expect(parseSuffix('@SomeSuffix')).toBe('@SomeSuffix');
  });

  test('with every wildcard', () => {
    expect(
      parseSuffix('@SomeSuffix_{w}_{h}_{wx}_{hx}_{x}', {
        width: 1024,
        height: 768,
        widthMultiplier: 1,
        heightMultiplier: 2,
        sizeMultiplier: 1.5,
      })
    ).toBe('@SomeSuffix_1024_768_1_2_1.5');
  });

  test('missing values are blanks', () => {
    expect(parseSuffix('@SomeSuffix_1{w}_2{h}_3{wx}_4{hx}_5{x}')).toBe(
      '@SomeSuffix_1_2_3_4_5'
    );
  });

  test('unknown wildcards are kept', () => {
    expect(parseSuffix('@SomeSuffix_{sm}', { width: 1024 })).toBe(
      '@SomeSuffix_{sm}'
    );
  });

  test('wildcards named like Object.prototype keys are kept', () => {
    expect(parseSuffix('{toString}{constructor}')).toBe(
      '{toString}{constructor}'
    );
  });

  test('path separators are removed and the result trimmed', () => {
    expect(
      parseSuffix('\\ @SomeSuffix_{w}_{h}/ \n', { width: 1024, height: 768 })
    ).toBe('@SomeSuffix_1024_768');
    expect(parseSuffix('/../../{w}', { width: 10 })).toBe('....10');
  });

  test('characters Windows does not allow in file names are removed', () => {
    expect(parseSuffix('a<b>c:d"e|f?g*h\x01i', {})).toBe('abcdefghi');
  });
});

describe('findUnknownWildcard', () => {
  test('the first name in braces that is not a wildcard', () => {
    expect(findUnknownWildcard('@{w}w_{x}x_{wx}_{hx}_{h}')).toBeUndefined();
    expect(findUnknownWildcard('@2x')).toBeUndefined();
    expect(findUnknownWildcard('@{w}w_{sm}_{wm}')).toBe('{sm}');
    expect(findUnknownWildcard('{toString}')).toBe('{toString}');
  });

  test('braces without a name are not wildcards', () => {
    expect(findUnknownWildcard('{}-{a b}')).toBeUndefined();
  });
});
