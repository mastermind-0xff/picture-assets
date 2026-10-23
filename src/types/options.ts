import type { LogLevel } from '@mmutils/logger';
import type { AssetsLogger } from '../log/logger.js';
import type { Hook } from './hooks.js';
import type { OutputFormatsOptions } from './output.js';
import type { ResizeStrategyHint } from './size.js';

/**
 * What a failure stops.
 * - `'none'`: nothing; every output is attempted and failures are reported
 *   in the result (best effort).
 * - `'source'`: the rest of the failing source; other sources go on.
 * - `'batch'`: everything, as soon as the work in progress is done; the
 *   function rejects with an error carrying the partial result (fail fast).
 */
export type AbortScope = 'none' | 'source' | 'batch';

/** How many sources a batch processes at the same time. */
export type Concurrency = number | 'auto' | 'max';

/**
 * Options of `generateSingleSourceAssets`, and of `generateBatchAssets` and
 * `generateAssets` with theirs. Every option falls back to its environment
 * variable (see `ENV_VARIABLES`), then to its default.
 */
export interface AssetsOptions {
  /**
   * Tells what source image's multiplier is, or what `'x1'` resolution is,
   * so multipliers in the settings can be turned into pixels.
   *
   * Default: `'downsample'` (`PICTURE_ASSETS_RESIZE_STRATEGY_HINT`).
   */
  readonly resizeStrategyHint?: ResizeStrategyHint;

  /**
   * Suffix of settings without their own, with the same wildcards.
   *
   * Default: `'@{w}w'` (`PICTURE_ASSETS_SUFFIX`).
   */
  readonly suffix?: string;

  /**
   * Options per format, merged over the defaults (see
   * `DEFAULT_FORMAT_OPTIONS`). Options given with the `formats` argument win
   * over these. `jpg` outputs use `jpeg`'s options too, `tif` `tiff`'s.
   *
   * Default: `{}` (`PICTURE_ASSETS_FORMAT_OPTIONS`, as JSON).
   */
  readonly formatOptions?: {
    readonly [F in keyof OutputFormatsOptions]?: OutputFormatsOptions[F];
  };

  /**
   * Whether sizes larger than the source are made. With `false`, they are
   * skipped (`'skipped'` in the result), except the largest of them, made at
   * the source's size instead, unless a size already is: so the largest
   * output keeps every pixel of the source and nothing is enlarged. Crops
   * larger than the source are skipped.
   *
   * Default: `true`.
   */
  readonly upscale?: boolean;

  /**
   * What a failure stops, see `AbortScope`.
   *
   * Default: `'none'` (`PICTURE_ASSETS_ABORT_SCOPE`).
   */
  readonly abortScope?: AbortScope;

  /**
   * A log level for the default logger, or a logger: a `@mmutils/logger`
   * `Logger` with the message plugin (and the graph plugin for the batch's
   * performance graphs at debug level), or any object with the same methods.
   *
   * Default: `'info'` (`PICTURE_ASSETS_LOG_LEVEL`).
   */
  readonly logger?: LogLevel | AssetsLogger;

  /**
   * Functions run in the resize chain, see `Hook`. At each point, in the
   * list's order, each on the image the previous one gave. Hooks come from
   * code or a `.js` config file: there is no environment variable.
   *
   * Default: `[]`.
   */
  readonly hooks?: readonly Hook[];
}

/** Options of `generateBatchAssets`. */
export interface BatchAssetsOptions extends AssetsOptions {
  /**
   * Sources processed at the same time.
   * - `'auto'`: the libuv thread pool size (`UV_THREADPOOL_SIZE`, 4 by
   *   default), at most the machine's parallelism. Sharp runs on that pool,
   *   so more sources at once would only wait for a thread.
   * - `'max'`: the machine's parallelism. Set `UV_THREADPOOL_SIZE` as high
   *   before the process starts to benefit from it.
   * - a number: at least 1.
   *
   * Never more than the number of sources. Default: `'auto'`
   * (`PICTURE_ASSETS_CONCURRENCY`).
   */
  readonly concurrency?: Concurrency;

  /**
   * Stops the batch when aborted: sources in progress finish their current
   * size, the others are `'aborted'`, and so is the batch.
   */
  readonly signal?: AbortSignal;
}
