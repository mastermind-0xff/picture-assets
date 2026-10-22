import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

import {
  resolveConcurrency,
  resolveOptions,
  type ResolvedOptions,
} from '../config/options.js';
import {
  assertSettings,
  createEncoders,
  parseFormats,
} from '../config/validate.js';
import { ResultBatchError } from '../errors/result-errors.js';
import type { RunContext } from '../image/output.js';
import type { FormatsMap } from '../image/output-paths.js';
import { isLogging, type AssetsLogger } from '../log/logger.js';
import type { BatchAssetsOptions, Concurrency } from '../types/options.js';
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
} from './generate-single-source-assets.js';
import {
  assertBatchSource,
  findSources,
  type BatchSource,
  type FoundSource,
} from './sources.js';

/** Milliseconds between the performance probes of a batch. */
const PROBE_INTERVAL = 100;

/** File systems that don't tell `A.jpg` from `a.jpg` by default. */
const CASE_INSENSITIVE_FS =
  process.platform === 'win32' || process.platform === 'darwin';

/**
 * Number of sources to process at the same time, see
 * `BatchAssetsOptions.concurrency`.
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
  const poolSize =
    Number.isSafeInteger(uvThreads) && uvThreads > 0 ? uvThreads : 4;
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
  logger: AssetsLogger,
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
 * Resolves the target of every source: its output path below the
 * destination, mirroring its directory, and its encoders. Two sources
 * writing the same files (`a.jpg` and `a.png`): the later one fails.
 *
 * @returns Targets and errors, by source index: one of them for each.
 */
export const planTargets = (
  sources: readonly FoundSource[],
  destRoot: string,
  formats: FormatsMap,
  formatOptions: ResolvedOptions['formatOptions']
): { targets: (SourceTarget | undefined)[]; errors: unknown[] } => {
  const targets: (SourceTarget | undefined)[] = [];
  const errors: unknown[] = [];
  const owners = new Map<string, string>();
  sources.forEach((source, index) => {
    try {
      const target = resolveTarget(
        source.path,
        path.join(destRoot, source.relativeDir) + path.sep,
        formats,
        formatOptions
      );
      const key =
        CASE_INSENSITIVE_FS ?
          target.outputPath.toLowerCase()
        : target.outputPath;
      const owner = owners.get(key);
      if (owner !== undefined)
        throw new Error(
          `${source.path} and ${owner} would write the same files (${target.outputPath}*): rename one of them.`
        );
      owners.set(key, source.path);
      targets[index] = target;
    } catch (error: unknown) {
      errors[index] = error;
    }
  });
  return { targets, errors };
};

/** A batch to run: its sources found and its options checked. */
export interface BatchRun {
  /** Sources, with their directory below their root, in the result's order. */
  readonly sources: readonly FoundSource[];
  readonly destRoot: string;
  readonly settings: readonly OutputSetting[];
  readonly formats: FormatsMap;
  readonly options: ResolvedOptions;
  readonly concurrency: Concurrency;
  /** Names the sources in logs: the input. */
  readonly inputName: string;
  /** Stops the batch from outside, like `abortScope: 'batch'` from inside. */
  readonly signal?: AbortSignal | undefined;
  /**
   * Called for each source whose target is valid, before it is processed:
   * `true` skips it (`'skipped'` in the result). For incremental runs.
   */
  readonly skip?:
    | ((source: FoundSource, target: SourceTarget) => Promise<boolean>)
    | undefined;
}

/**
 * Runs a batch: plans every source's target (invalid targets and name
 * collisions fail before any file is written), then processes the sources
 * `concurrency` at a time. A source's failure never rejects, see
 * `generateBatchAssets`.
 *
 * @returns The batch's result, and the targets by source index (undefined
 * for sources whose target is invalid).
 */
export const runBatch = async (
  run: BatchRun
): Promise<{ batch: ResultBatch; targets: (SourceTarget | undefined)[] }> => {
  const timeStart = performance.now();
  const cpuStart = sampleCPUUsage();
  const { sources, destRoot, settings, formats, options, inputName } = run;
  const { logger } = options;
  if (sources.length === 0) {
    logger.warning(`No source images found in ${inputName}.`);
    return {
      batch: {
        status: 'failed',
        sources: [],
        duration: Math.round(performance.now() - timeStart),
      },
      targets: [],
    };
  }

  const concurrency = computeConcurrency(run.concurrency, sources.length);
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
    ...options,
    signal: controller.signal,
    abort: (reason) => {
      controller.abort(reason);
    },
  };
  const { signal } = run;
  const stop = () => {
    controller.abort(signal?.reason);
  };
  if (signal?.aborted) stop();
  else signal?.addEventListener('abort', stop, { once: true });

  // plan every source first: invalid targets and name collisions fail
  // before any file is written
  const results: (ResultSource | undefined)[] = [];
  const { targets, errors } = planTargets(
    sources,
    destRoot,
    formats,
    options.formatOptions
  );
  errors.forEach((error, index) => {
    const source = sources[index];
    if (source === undefined) return;
    logger.error({ source: source.path, error });
    results[index] = sourceResult(
      source.path,
      'failed',
      performance.now(),
      error
    );
    if (options.abortScope === 'batch') context.abort(error);
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
      const start = performance.now();
      if (!controller.signal.aborted && (await run.skip?.(source, target))) {
        logger.debug(`Unchanged since the last run: ${source.path}`);
        results[index] = sourceResult(source.path, 'skipped', start);
      } else
        results[index] = await processSource(
          source.path,
          target,
          settings,
          context
        );
      processed++;
    }
  };
  try {
    await Promise.all(Array.from({ length: concurrency }, worker));
  } finally {
    stopProbes?.();
    signal?.removeEventListener('abort', stop);
  }

  // every source has a result: those never reached are aborted
  const resultSources = sources.map(
    (source, index) =>
      results[index] ?? sourceResult(source.path, 'aborted', performance.now())
  );
  const batch: ResultBatch = {
    status:
      signal?.aborted ? 'aborted'
      : allResultsSucceeded(resultSources) ? 'succeed'
      : 'failed',
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
  const count = (status: ResultSource['status']) =>
    resultSources.filter((source) => source.status === status).length;
  const unchanged = count('skipped');
  const summary = `Batch ${batch.status === 'aborted' ? 'stopped' : 'done'}: ${count('succeed')} of ${resultSources.length} sources${unchanged > 0 ? ` (${unchanged} unchanged)` : ''}, ${written.length} files, ${formatBytes(bytes)} in ${formatDuration(batch.duration)}, CPU ${sampleCPUUsage(cpuStart)}%.`;
  if (batch.status === 'succeed') logger.info(summary);
  else logger.warning(summary);

  if (options.abortScope === 'batch' && batch.status === 'failed')
    throw new ResultBatchError(`Batch ${inputName} aborted.`, batch, {
      cause: controller.signal.reason,
    });

  return { batch, targets };
};

/**
 * Convert multiple files to multiple output resolutions and formats: a
 * directory tree, a glob or a single file. The tree below the source root is
 * mirrored in the destination, so files with the same name in different
 * directories never overwrite each other.
 *
 * Sources are processed `concurrency` at a time, each with
 * `generateSingleSourceAssets`'s pipeline; the results are in path order. Outputs inside the source tree
 * (a destination inside the root) are never picked up as sources.
 *
 * **example**:
 * ```js
 * // photos/a.jpg, photos/trips/b.jpg → public/img/a@1024w.webp, …,
 * // public/img/trips/b@1024w.webp, …
 * await generateBatchAssets(
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
 * @param settings Output sizes, see `generateSingleSourceAssets`.
 * @param formats Output formats, see `generateSingleSourceAssets`. Without
 * formats, each source is written in its own format.
 * @param options Options of `generateSingleSourceAssets`, plus `concurrency`
 * and `signal`. With `abortScope: 'batch'`, the first failure stops the batch: sources in
 * progress finish their current size, the others are `'aborted'`. An
 * aborted `signal` stops it the same way, and the batch is `'aborted'`.
 * @returns The result of every source found, in path order. `'failed'` when
 * no source was found or any source failed, `'aborted'` when the `signal`
 * stopped it.
 * @throws `TypeError | RangeError` for invalid arguments or options, before
 * any processing.
 * @throws `ResultBatchError` with `abortScope: 'batch'` when a source fails,
 * carrying the batch result.
 */
export const generateBatchAssets = async (
  srcPath: BatchSource,
  destRoot: string,
  settings: readonly OutputSetting[],
  formats?: OutputFormats,
  options: BatchAssetsOptions = {}
): Promise<ResultBatch> => {
  const input = assertBatchSource(srcPath);
  assertPath('Destination root', destRoot);
  assertSettings(settings);
  const { concurrency: concurrencyOption, signal, ...sourceOptions } = options;
  const concurrency = resolveConcurrency(concurrencyOption);
  const resolvedOptions = resolveOptions(sourceOptions);
  const formatsMap = parseFormats(formats);
  // invalid format options fail before any source is searched
  createEncoders(formatsMap, resolvedOptions.formatOptions);

  const { sources } = await findSources(input, destRoot);
  const { batch } = await runBatch({
    sources,
    destRoot,
    settings,
    formats: formatsMap,
    options: resolvedOptions,
    concurrency,
    inputName:
      typeof input === 'string' ? input : path.join(input.root, input.pattern),
    signal,
  });
  return batch;
};
