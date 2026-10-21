import os from 'os';

import { ExecutionScopes } from '../global-enums/main';
import { ExecutionContext } from '../types/execution';
import {
  ResultBatch,
  ResultFormat,
  ResultSetting,
  ResultSource,
} from '../types/output';

/**
 * Convert array of strings to object with keys set to predefined value or
 * values.
 *
 * **_examples:_**
 * ```typescript
 * arrayValuesToKeys(['a','b'],''); // {'a':'', 'b':''}
 * arrayValuesToKeys(['a','b','d','e'],[1,2]); // {'a':1, 'b':2, 'c':1, 'b':2}
 * ```
 *
 * @param list Array of strings.
 * @param fillValue Array of values for every key or single value to fill all
 * keys.
 * @returns Object.
 */
export const arrayValuesToKeys = <T extends PropertyKey, VT>(
  list: T[],
  fillValue: VT | VT[]
): { [K in T]: VT } => {
  return list.reduce(
    (acc, value, n) => (
      (acc[value] =
        Array.isArray(fillValue) ?
          fillValue[n % fillValue.length]!
        : fillValue),
      acc
    ),
    {} as { [K in T]: VT }
  );
};

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

/**
 * Checks if the current context matches the abort policy context. Use in case
 * of an error to decided if the execution flow should be halted or the
 * execution should continue.
 *
 * **If a given level should abort, all levels above should also abort.**
 *
 * In case the abort scope is a higher execution scope, any errors should bubble
 * up and be re-thrown to be handled by the upper level. Otherwise the error
 * should be logged and consumed locally.
 *
 * @param executionContext Current execution context.
 * @returns Boolean indicating whether the error should abort the current flow.
 */
export const shouldAbort = (executionContext: ExecutionContext): boolean =>
  ExecutionScopes[executionContext.executionScope] >=
  ExecutionScopes[executionContext.abortScope];

/**
 * Checks if the current context level matches the abort policy context level.
 * Use in case of an error to decided if you are at the abort level.
 *
 * **Tells if this is the first abort level.**
 *
 * @param executionContext Current execution context.
 * @returns Boolean indicating whether the execution is at the abort level.
 */
export const isAbortLevel = (executionContext: ExecutionContext): boolean =>
  ExecutionScopes[executionContext.executionScope] ===
  ExecutionScopes[executionContext.abortScope];

/** Checks if every entry in a batch of results is successful. */
export const allResultsSucceeded = (
  results: ResultFormat[] | ResultSetting[] | ResultSource[] | ResultBatch[]
) => results.every((result) => result.status === 'succeed');

/**
 * Format time from milliseconds to a more readable string.
 *
 * **examples:**
 * - `formatMsTime(1*60*60*1000) // '1h'`
 * - `formatMsTime(2*60*1000) // '2m'`
 * - `formatMsTime(3*1000) // '3s'`
 * - `formatMsTime(4) // '4ms'`
 * - `formatMsTime(1*60*60*1000 + 2*60*1000 + 3*1000 + 4); // '1h 2m 3s 4ms'`
 *
 * @param time Time in milliseconds.
 * @returns Formatted string with units of time attached, if that unit's value
 * is greater than zero.
 */
export const formatMsTime = (time: number) =>
  Object.entries({
    h: Math.floor(time / (60000 * 60)),
    m: Math.floor((time % (60000 * 60)) / 60000),
    s: Math.floor((time % 60000) / 1000),
    ms: Math.round(time) % 1000,
  })
    .map(([n, v]) => (v ? ` ${v}${n}` : ''))
    .join('')
    .substring(1);

/** CPU usage snapshot with a high‑resolution timestamp (nanoseconds). */
type CPUSample = {
  cpuUsageTimes: NodeJS.CpuUsage;
  time: bigint;
};

type CPUUsageSampler = {
  /** Capture CPU usage sample at the current timestamp. */
  (): CPUSample;
  /** Compute CPU usage percentage based on a previous timestamped CPU sample.*/
  (startSample: CPUSample): number;
};

/**
 * Capture a timestamped CPU usage sample, or compute the CPU usage percentage
 * since a previous sample.
 *
 * @param startSample Optional CPU sample marking the beginning of the
 * measurement.
 * @returns A new `CPUSample` when no argument is provided, or a CPU usage
 * percentage (e.g., 25.34).
 */
export const sampleCPUUsage: CPUUsageSampler = (
  startSample?: CPUSample
): any => {
  if (!startSample)
    return {
      cpuUsageTimes: process.cpuUsage(),
      time: process.hrtime.bigint(),
    };
  const { user, system } = process.cpuUsage(startSample.cpuUsageTimes);
  const totalUsageTime = user + system;
  const totalSystemTime =
    os.cpus().length *
    (Number(process.hrtime.bigint() - startSample.time) / 1000);
  return Math.round((totalUsageTime / totalSystemTime) * 10000) / 100;
};
