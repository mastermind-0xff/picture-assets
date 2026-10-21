import { isSharpFormatEnum } from './type-guards';

describe('check isSharpFormatEnum', () => {
  test('with existing format [jpg]', () => {
    expect(isSharpFormatEnum('jpg')).toBe(true);
  });
  test('with existing format [png]', () => {
    expect(isSharpFormatEnum('png')).toBe(true);
  });
  test('with NON existing format [xml]', () => {
    expect(isSharpFormatEnum('xml')).toBe(false);
  });
});
