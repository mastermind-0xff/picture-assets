import os from 'node:os';
import path from 'node:path';

import { formatHighResTime } from '@mmutils/time';

/**
 * Checks if the provided width and height matches source's width and height
 * aspect ratio down to 1/1000.
 * @param width Width of the tested resolution.
 * @param height Height of the tested resolution.
 * @param srcWidth Width of the source.
 * @param srcHeight Height of the source.
 * @returns Boolean true if resolutions have matching aspect ratio or false
 * otherwise.
 */
export const isMatchingAspectRatio = (
  width: number,
  height: number,
  srcWidth: number,
  srcHeight: number
): boolean => Math.abs(width / height - srcWidth / srcHeight) < 0.001;

/** Checks if every entry in a list of results succeeded or was skipped. */
export const allResultsSucceeded = (
  results: readonly { status: string }[]
): boolean =>
  results.every(({ status }) => status === 'succeed' || status === 'skipped');

/**
 * Formats milliseconds as readable time: `'0ms'`, `'1s 235ms'`,
 * `'1h 2m 3s 4ms'`.
 */
export const formatDuration = (ms: number): string =>
  formatHighResTime(ms, 'ms', 'ms');

/**
 * Control characters: C0, DEL and C1. A file name may hold them on POSIX
 * systems, and a terminal reads them as commands (`\x1b]0;…\x07` sets its
 * title) or as a new log line.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\x00-\x1F\x7F-\x9F]/g;

/**
 * A path as logs and messages show it: with `/` on Windows too, as the
 * manifest has it and every shell takes it, the same on every system;
 * control characters escaped as in JSON (`\u001b`). Results keep native
 * paths, for `path` and `fs`.
 */
export const displayPath = (file: string): string =>
  (path.sep === '\\' ? file.replaceAll('\\', '/') : file).replace(
    CONTROL_CHARACTERS,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );

/** File systems that don't tell `A.jpg` from `a.jpg` by default. */
export const CASE_INSENSITIVE_FS =
  process.platform === 'win32' || process.platform === 'darwin';

/**
 * A path as the file system compares it: lower case where it ignores case
 * (see `CASE_INSENSITIVE_FS`), so `Out` and `out` are the same directory.
 */
export const fileSystemKey = (file: string): string =>
  CASE_INSENSITIVE_FS ? file.toLowerCase() : file;

/** Formats a size in bytes: `'812 B'`, `'45.3 kB'`, `'1.25 MB'`. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} B`;
  const units = ['kB', 'MB', 'GB', 'TB'];
  let value = bytes / 1000;
  let unit = 0;
  // 999.5 would print as 1.00e+3: move up a unit before rounding does
  while (value >= 999.5 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  const digits = value >= 100 ? `${Math.round(value)}` : value.toPrecision(3);
  return `${digits} ${units[unit] ?? ''}`;
};

/** CPU usage snapshot with a high‑resolution timestamp (nanoseconds). */
export interface CPUSample {
  cpuUsageTimes: NodeJS.CpuUsage;
  time: bigint;
}

/**
 * Captures a timestamped CPU usage sample of the whole process: every
 * thread, libvips' included.
 */
export function sampleCPUUsage(): CPUSample;
/**
 * Computes the process's CPU usage since a previous sample, in percent of
 * all the machine's cores (e.g. 25.34).
 */
export function sampleCPUUsage(startSample: CPUSample): number;
export function sampleCPUUsage(startSample?: CPUSample): CPUSample | number {
  if (!startSample)
    return { cpuUsageTimes: process.cpuUsage(), time: process.hrtime.bigint() };
  const { user, system } = process.cpuUsage(startSample.cpuUsageTimes);
  const elapsedUs = Number(process.hrtime.bigint() - startSample.time) / 1000;
  const capacityUs = os.availableParallelism() * elapsedUs;
  if (capacityUs <= 0) return 0;
  return Math.round(((user + system) / capacityUs) * 10_000) / 100;
}
