import os from 'node:os';

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

/** Checks if every entry in a list of results is successful. */
export const allResultsSucceeded = (
  results: readonly { status: string }[]
): boolean => results.every((result) => result.status === 'succeed');

/**
 * Formats milliseconds as readable time: `'0ms'`, `'1s 235ms'`,
 * `'1h 2m 3s 4ms'`.
 */
export const formatDuration = (ms: number): string =>
  formatHighResTime(ms, 'ms', 'ms');

/** Formats a size in bytes: `'812 B'`, `'45.3 kB'`, `'1.25 MB'`. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} B`;
  const units = ['kB', 'MB', 'GB'];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${value.toPrecision(3)} ${units[unit] ?? ''}`;
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
