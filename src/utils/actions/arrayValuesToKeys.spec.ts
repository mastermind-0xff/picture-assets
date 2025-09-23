import { arrayValuesToKeys } from './arrayValuesToKeys';

describe('arrayValuesToKeys', () => {
  it('should map array values to keys with a single fill value', () => {
    const result = arrayValuesToKeys(['a', 'b', 'c'], 1);
    expect(result).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('should map array values to keys with an array of fill values', () => {
    const result = arrayValuesToKeys(['a', 'b', 'c'], [1, 2, 3]);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should repeat fill values if fill array is shorter than input array', () => {
    const result = arrayValuesToKeys(['a', 'b', 'c', 'd', 'e'], [1, 2]);
    expect(result).toEqual({ a: 1, b: 2, c: 1, d: 2, e: 1 });
  });

  it('should return an empty object for an empty input array', () => {
    const result = arrayValuesToKeys([], 1);
    expect(result).toEqual({});
  });
});
