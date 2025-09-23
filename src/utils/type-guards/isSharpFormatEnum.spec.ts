import { isSharpFormatEnum } from "./isSharpFormatEnum";

describe('check isSharpFormatEnum', () => {
  test('test with existing format [jpg]', () => {
    expect(isSharpFormatEnum('jpg')).toBe(true);
  });
  test('test with existing format [png]', () => {
    expect(isSharpFormatEnum('png')).toBe(true);
  });
  test('test with NON existing format [xml]', () => {
    expect(isSharpFormatEnum('xml')).toBe(false);
  });
});
