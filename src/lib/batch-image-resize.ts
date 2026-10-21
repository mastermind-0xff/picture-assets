import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

import { resolveConcurrency, resolveOptions } from '../config/options.js';
import {
  assertSettings,
  createEncoders,
  parseFormats,
} from '../config/validate.js';
import { ResultBatchError } from '../errors/image-resize-errors.js';
import type { RunContext } from '../image/output.js';
import { isLogging, type ImageAssetsLogger } from '../log/logger.js';
import type { BatchImageResizeOptions, Concurrency } from '../types/options.js';
import type {
  OutputFormats,
  OutputSetting,
  ResultBatch,
  ResultSource,
} from '../types/output.js';
import {
  allResultsSucceeded,
  formatBytes,
  formatDuration,
  sampleCPUUsage,
} from '../utils/helpers.js';
import {
  assertPath,
  processSource,
  resolveTarget,
  sourceResult,
  type SourceTarget,
} from './image-resize.js';
import { assertBatchSource, findSources, type BatchSource } from './sources.js';

/** Milliseconds between the performance probes of a batch. */
const PROBE_INTERVAL = 100;

/** File systems that don't tell `A.jpg` from `a.jpg` by default. */
const CASE_INSENSITIVE_FS =
  process.platform === 'win32' || process.platform === 'darwin';

/**
 * Number of sources to process at the same time, see
 * `BatchImageResizeOptions.concurrency`.
 *
 * @param concurrency The option.
 * @param sources Number of sources: never more workers than sources.
 * @param env Read for `UV_THREADPOOL_SIZE`. Default: `process.env`.
 */
export const computeConcurrency = (
  concurrency: Concurrency,
  sources: number,
  env: NodeJS.ProcessEnv = process.env
): number => {
  const uvThreads = Number(env.UV_THREADPOOL_SIZE);
  const poolSize = Number.isSafeInteger(uvThreads) && uvThreads > 0 ? uvThreads : 4;
  const parallelism = os.availableParallelism();
  const wanted =
    concurrency === 'auto' ? Math.min(poolSize, parallelism)
    : concurrency === 'max' ? parallelism
    : concurrency;
  return Math.max(1, Math.min(wanted, sources));
};

/**
 * Samples CPU, memory and progress during a batch and draws them when it
 * ends, if the logger draws graphs at debug level.
 */
const startProbes = (
  logger: ImageAssetsLogger,
  totalSources: number,
  getProcessed: () => number
) => {
  if (!logger.debugGraph || !isLogging(logger, 'debug')) return undefined;
  const cpu: number[] = [];
  const memory: number[] = [];
  const processed: number[] = [];
  const start = performance.now();
  let sample = sampleCPUUsage();
  const timer = setInterval(() => {
    cpu.push(sampleCPUUsage(sample));
    sample = sampleCPUUsage();
    memory.push(process.memoryUsage.rss() / 1024 / 1024);
    processed.push(getProcessed());
  }, PROBE_INTERVAL);
  timer.unref();

  return () => {
    clearInterval(timer);
    if (cpu.length === 0) return;
    const end = Math.round(performance.now() - start);
    const axis = { start: 0, end, unit: 'ms', capTo: 'ms' } as const;
    logger.debugGraph?.(cpu, { title: 'CPU usage', unit: '%', max: 100, axis });
    logger.debugGraph?.(memory, { title: 'Memory (RSS)', unit: 'MB', axis });
    logger.debugGraph?.(processed, {
      title: 'Sources processed',
      max: totalSources,
      precision: 0,
      axis,
    });
  };
};

/**
 * Convert multiple files to multiple output resolutions and formats: a
 * directory tree, a glob or a single file. The tree below the source root is
 * mirrored in the destination, so files with the same name in different
 * directories never overwrite each other.
 *
 * Sources are processed `concurrency` at a time, each with `imageResize`'s
 * pipeline; the results are in path order. Outputs inside the source tree
 * (a destination inside the root) are never picked up as sources.
 *
 * **example**:
 * ```js
 * // photos/a.jpg, photos/trips/b.jpg → public/img/a@1024w.webp, …,
 * // public/img/trips/b@1024w.webp, …
 * await batchImageResize(
 *   'photos/**\/*.jpg',
 *   'public/img/',
 *   [{ width: 2048 }, { width: 1024 }],
 *   ['avif', 'webp', 'jpg']
 * );
 * ```
 *
 * @param srcPath A file, a directory, a glob, or `{ root, pattern }`, see
 * `BatchSource`.
 * @param destRoot Directory to output all converted files.
 * @param settings Output sizes, see `imageResize`.
 * @param formats Output formats, see `imageResize`. Without formats, each
 * source is written in its own format.
 * @param options Options of `imageResize`, plus `concurrency`. With
 * `abortScope: 'batch'`, the first failure stops the batch: sources in
 * progress finish their current size, the others are `'aborted'`.
 * @returns The result of every source found, in path order. `'failed'` when
 * no source was found or any source didn't succeed.
 * @throws `TypeError | RangeError` for invalid arguments or options, before
 * any processing.
 * @throws `ResultBatchError` with `abortScope: 'batch'` when a source fails,
 * carrying the batch result.
 */
export const batchImageResize = async (
  srcPath: BatchSource,
  destRoot: string,
  settings: readonly OutputSetting[],
  formats?: OutputFormats,
  options: BatchImageResizeOptions = {}
): Promise<ResultBatch> => {
  const timeStart = performance.now();
  const cpuStart = sampleCPUUsage();
  const input = assertBatchSource(srcPath);
  assertPath('Destination root', destRoot);
  assertSettings(settings);
  const { concurrency: concurrencyOption, ...sourceOptions } = options;
  const concurrencySetting = resolveConcurrency(concurrencyOption);
  const resolvedOptions = resolveOptions(sourceOptions);
  const { logger } = resolvedOptions;
  const formatsMap = parseFormats(formats);
  // invalid format options fail before any source is searched
  createEncoders(formatsMap, resolvedOptions.formatOptions);

  const { sources } = await findSources(input, destRoot);
  const inputName =
    typeof input === 'string' ? input : path.join(input.root, input.pattern);
  if (sources.length === 0) {
    logger.warning(`No source images found in ${inputName}.`);
    return {
      status: 'failed',
      sources: [],
      duration: Math.round(performance.now() - timeStart),
    };
  }

  const concurrency = computeConcurrency(concurrencySetting, sources.length);
  logger.info(
    `Found ${sources.length} source image(s) in ${inputName}, processing ${concurrency} at a time.`
  );
  logger.debug({
    UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE ?? '4 (default)',
    availableParallelism: os.availableParallelism(),
    sharpConcurrency: sharp.concurrency(),
    concurrency,
  });

  const controller = new AbortController();
  const context: RunContext = {
    ...resolvedOptions,
    signal: controller.signal,
    abort: (reason) => {
      controller.abort(reason);
    },
  };

  // plan every source first: invalid targets and name collisions fail
  // before any file is written
  const results: (ResultSource | undefined)[] = [];
  const targets: (SourceTarget | undefined)[] = [];
  const owners = new Map<string, string>();
  sources.forEach((source, index) => {
    try {
      const target = resolveTarget(
        source.path,
        path.join(destRoot, source.relativeDir) + path.sep,
        formatsMap,
        resolvedOptions.formatOptions
      );
      const key =
        CASE_INSENSITIVE_FS ? target.outputPath.toLowerCase() : target.outputPath;
      const owner = owners.get(key);
      if (owner !== undefined)
        throw new Error(
          `${source.path} and ${owner} would write the same files (${target.outputPath}*): rename one of them.`
        );
      owners.set(key, source.path);
      targets[index] = target;
    } catch (error: unknown) {
      logger.error({ source: source.path, error });
      results[index] = sourceResult(source.path, 'failed', performance.now(), error);
      if (resolvedOptions.abortScope === 'batch') context.abort(error);
    }
  });

  let next = 0;
  let processed = results.filter(Boolean).length;
  const stopProbes = startProbes(logger, sources.length, () => processed);
  const worker = async () => {
    while (next < sources.length) {
      const index = next++;
      const source = sources[index];
      const target = targets[index];
      if (source === undefined || target === undefined) continue;
      results[index] = await processSource(source.path, target, settings, context);
      processed++;
    }
  };
  try {
    await Promise.all(Array.from({ length: concurrency }, worker));
  } finally {
    stopProbes?.();
  }

  const resultSources = results.map(
    (result, index) =>
      result ?? sourceResult(sources[index]?.path ?? '', 'aborted', performance.now())
  );
  const batch: ResultBatch = {
    status: allResultsSucceeded(resultSources) ? 'succeed' : 'failed',
    sources: resultSources,
    duration: Math.round(performance.now() - timeStart),
  };

  const written = resultSources.flatMap(({ outputsBySetting }) =>
    outputsBySetting.flatMap(({ files }) =>
      files.flatMap((file) =>
        file.status === 'succeed' ? [file.fileData.size] : []
      )
    )
  );
  const bytes = written.reduce((sum, size) => sum + size, 0);
  const succeeded = resultSources.filter(({ status }) => status === 'succeed');
  const summary = `Batch done: ${succeeded.length} of ${resultSources.length} sources, ${written.length} files, ${formatBytes(bytes)} in ${formatDuration(batch.duration)}, CPU ${sampleCPUUsage(cpuStart)}%.`;
  if (batch.status === 'succeed') logger.info(summary);
  else logger.warning(summary);

  if (resolvedOptions.abortScope === 'batch' && batch.status === 'failed')
    throw new ResultBatchError(`Batch ${inputName} aborted.`, batch, {
      cause: controller.signal.reason,
    });

  return batch;
};
