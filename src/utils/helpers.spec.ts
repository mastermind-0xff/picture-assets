import {
  arrayValuesToKeys,
  isMatchingAspectRatio,
} from './helpers';
import { logMessage } from '../log/logger';
const log = console.log;
describe('debugMessage', () => {
  beforeEach(() => {
    console.log = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('by default notification is displayed', () => {
    logMessage('Some notification text message.', undefined, undefined, true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('🟦'));
  });
  test('error is displayed', () => {
    logMessage('Some error text message.', 'error', undefined, true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('🛑'));
  });
  test('warning is displayed', () => {
    logMessage('Some warning text message.', 'warning', undefined, true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('⚠️'));
  });
  test('success is displayed', () => {
    logMessage('Some success text message.', 'success', undefined, true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('✅'));
  });
  test('notification is displayed', () => {
    logMessage(
      'Some notification text message.',
      'info',
      undefined,
      true
    );
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('🟦'));
  });
  test('raw is displayed', () => {
    logMessage('Some raw text message.', 'raw', undefined, true);
    expect(console.log).toHaveBeenLastCalledWith(
      expect.stringContaining('Raw:')
    );
  });
  test('nothing is displayed', () => {
    logMessage('Some error text message.', 'error', undefined, false);
    expect(console.log).not.toHaveBeenCalled();
  });
  test('custom title is displayed', () => {
    logMessage(
      'Some error text message.',
      'info',
      'Title text',
      true
    );
    expect(console.log).toHaveBeenLastCalledWith(
      expect.stringContaining('Title text:')
    );
  });
  test('no title is displayed', () => {
    logMessage('Some error text message.', 'info', '', true);
    expect(console.log).toHaveBeenLastCalledWith(
      expect.not.stringContaining(':')
    );
  });
  test('only title is displayed', () => {
    logMessage('', 'info', 'Title', true);
    expect(console.log).toHaveBeenLastCalledWith(
      expect.stringMatching('Title:')
    );
  });
});

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

describe('check isMatchingAspectRatio', () => {
  expect(isMatchingAspectRatio(1024, 768, 1024, 768)).toStrictEqual(true);
  expect(isMatchingAspectRatio(2048, 1536, 1024, 768)).toStrictEqual(true);

  expect(isMatchingAspectRatio(2100, 1200, 1024, 768)).toStrictEqual(false);

  //edge cases
  expect(isMatchingAspectRatio(2000, 1999, 100, 100)).toStrictEqual(true);
  expect(isMatchingAspectRatio(1000, 999, 100, 100)).toStrictEqual(false);
});
