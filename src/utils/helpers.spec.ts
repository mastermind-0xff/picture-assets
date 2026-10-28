import path from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  allResultsSucceeded,
  displayPath,
  formatBytes,
  formatDuration,
  isMatchingAspectRatio,
  sampleCPUUsage,
} from './helpers.js';

describe('displayPath', () => {
  test('/ on every system; a POSIX name keeps its backslashes', () => {
    expect(displayPath(path.join('photos', 'trips', 'a.jpg'))).toBe(
      'photos/trips/a.jpg'
    );
    expect(displayPath('C:\\photos\\a.jpg')).toBe(
      path.sep === '\\' ? 'C:/photos/a.jpg' : 'C:\\photos\\a.jpg'
    );
  });

  test('control characters escaped: a name never drives the terminal or adds a log line', () => {
    expect(displayPath('up/\u001b]0;title\u0007.jpg')).toBe(
      'up/\\u001b]0;title\\u0007.jpg'
    );
    expect(displayPath('a\nINFO forged.jpg')).toBe('a\\u000aINFO forged.jpg');
    expect(displayPath('c1-\u009b31m.jpg')).toBe('c1-\\u009b31m.jpg');
    expect(displayPath('é ü 日本.jpg')).toBe('é ü 日本.jpg');
  });
});

describe('isMatchingAspectRatio', () => {
  test('same and scaled ratios', () => {
    expect(isMatchingAspectRatio(1024, 768, 1024, 768)).toBe(true);
    expect(isMatchingAspectRatio(2048, 1536, 1024, 768)).toBe(true);
    expect(isMatchingAspectRatio(2100, 1200, 1024, 768)).toBe(false);
  });

  test('down to 1/1000', () => {
    expect(isMatchingAspectRatio(2000, 1999, 100, 100)).toBe(true);
    expect(isMatchingAspectRatio(1000, 999, 100, 100)).toBe(false);
  });
});

describe('allResultsSucceeded', () => {
  test('every status must be succeed', () => {
    expect(allResultsSucceeded([])).toBe(true);
    expect(allResultsSucceeded([{ status: 'succeed' }])).toBe(true);
    expect(
      allResultsSucceeded([{ status: 'succeed' }, { status: 'aborted' }])
    ).toBe(false);
  });
});

describe('formatDuration', () => {
  test('zero and units', () => {
    // the old formatMsTime returned '' for 0
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(4)).toBe('4ms');
    expect(formatDuration(1234.5)).toBe('1s 235ms');
    expect(formatDuration(3_723_004)).toBe('1h 2m 3s 4ms');
  });
});

describe('formatBytes', () => {
  test('decimal units, 3 significant digits', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(812)).toBe('812 B');
    expect(formatBytes(45_300)).toBe('45.3 kB');
    expect(formatBytes(1_250_000)).toBe('1.25 MB');
    expect(formatBytes(168_000)).toBe('168 kB');
    expect(formatBytes(3_000_000_000_000)).toBe('3.00 TB');
  });

  test('values rounding up to 1000 move to the next unit', () => {
    expect(formatBytes(999_499)).toBe('999 kB');
    expect(formatBytes(999_500)).toBe('1.00 MB');
  });
});

describe('sampleCPUUsage', () => {
  test('a sample, then a percentage of all cores', () => {
    const sample = sampleCPUUsage();
    expect(typeof sample.time).toBe('bigint');
    // busy for 250 ms: process.cpuUsage() steps 15-16 ms on Windows, more
    // than a short loop takes, which then reads as over 100%
    const start = performance.now();
    let sink = 0;
    while (performance.now() - start < 250) sink += Math.sqrt(sink + 1);
    expect(sink).toBeGreaterThan(0);
    const usage = sampleCPUUsage(sample);
    expect(usage).toBeGreaterThanOrEqual(0);
    expect(usage).toBeLessThanOrEqual(100);
  });
});
