import { resolveOptions } from '../config/options.js';
import {
  assertSettings,
  createEncoders,
  describe,
  parseFormats,
  type FormatOptionsInput,
  type TargetEncoder,
} from '../config/validate.js';
import { ResultSourceError } from '../errors/result-errors.js';
import { sourceToSettings, type RunContext } from '../image/output.js';
import {
  resolvePathsAndFormats,
  type FormatsMap,
} from '../image/output-paths.js';
import { describeSettings, tallyFiles } from '../log/describe.js';
import type { AssetsOptions } from '../types/options.js';
import type {
  OutputFormats,
  OutputSetting,
  ResultSource,
  ResultStatus,
} from '../types/output.js';
import { displayPath, formatBytes, formatDuration } from '../utils/helpers.js';

/** Where a source's outputs go and how they are encoded. */
export interface SourceTarget {
  /** Output path without suffix and extension. */
  readonly outputPath: string;
  readonly encoders: readonly TargetEncoder[];
}

/**
 * Resolves the output path and the encoders of a source.
 *
 * @throws TypeError or RangeError when no format can be written or the
 * options of a format are invalid.
 */
export const resolveTarget = (
  srcPath: string,
  destPath: string,
  formats: FormatsMap,
  formatOptions: FormatOptionsInput
): SourceTarget => {
  const resolved = resolvePathsAndFormats(srcPath, destPath, formats);
  return {
    outputPath: resolved.outputPath,
    encoders: createEncoders(resolved.formats, formatOptions),
  };
};

/** Checks a path argument: a non-empty string. */
export const assertPath = (name: string, value: unknown): string => {
  if (typeof value === 'string' && value.trim() !== '') return value;
  throw new TypeError(
    `${name} must be a non-empty path, got ${describe(value)}.`
  );
};

/** Creates the result of a source that was not processed or failed early. */
export const sourceResult = (
  source: string,
  status: ResultStatus,
  start: number,
  error?: unknown
): ResultSource => ({
  status,
  source,
  outputsBySetting: [],
  ...(error !== undefined && { error }),
  duration: Math.round(performance.now() - start),
});

/**
 * Processes one source: every setting, every format. Never rejects: failures
 * are in the result, and with `abortScope: 'batch'` they also abort the run.
 */
export const processSource = async (
  srcPath: string,
  target: SourceTarget,
  settings: readonly OutputSetting[],
  context: RunContext
): Promise<ResultSource> => {
  const start = performance.now();
  const { logger } = context;
  if (context.signal.aborted) return sourceResult(srcPath, 'aborted', start);

  try {
    const { outputsBySetting, stopped, width, height, data } =
      await sourceToSettings(
        srcPath,
        settings,
        target.encoders,
        target.outputPath,
        context
      );
    const status: ResultStatus =
      outputsBySetting.some(({ status }) => status === 'failed') ? 'failed'
      : stopped ? 'aborted'
      : 'succeed';
    const result: ResultSource = {
      status,
      source: srcPath,
      width,
      height,
      ...(data && { data }),
      outputsBySetting,
      duration: Math.round(performance.now() - start),
    };

    const { written, bytes, failed } = tallyFiles([result]);
    const summary = `${displayPath(srcPath)}: ${written} files, ${formatBytes(bytes)} in ${formatDuration(result.duration)}`;
    if (status === 'succeed') logger.info(summary);
    else if (status === 'failed')
      logger.warning(`${summary}, ${failed} failed`);
    else logger.warning(`${summary}, stopped by an abort`);

    return result;
  } catch (error: unknown) {
    logger.error({ source: displayPath(srcPath), error });
    if (context.abortScope === 'batch') context.abort(error);
    return sourceResult(srcPath, 'failed', start, error);
  }
};

/**
 * Turns one source image into every size and format asked. Sizes are
 * processed from the largest, each resized from the previous one when it
 * has the source's aspect ratio and no crop, else from the source; the
 * formats of a size are encoded in parallel.
 *
 * ```ts
 * // out/house@2048w.avif, out/house@2048w.webp, out/house@1024w.avif, …
 * await generateSingleSourceAssets(
 *   'photos/house.jpg',
 *   'out/',
 *   [{ width: 2048 }, { width: 1024 }],
 *   ['avif', 'webp']
 * );
 * ```
 *
 * Multipliers are resolved by `resizeStrategyHint`. For a 300x300 source
 * and the settings `[{ width: 'x3' }, { width: 'x2' }, { width: 'x1' }]`,
 * the widths of `x3`, `x2` and `x1` are:
 *
 * - `'downsample'` (default): 300, 200, 100: the source is `x3`;
 * - `'upsample'`: 900, 600, 300: the source is `x1`;
 * - `'x2'`: 450, 300, 150;
 * - `{ width: 50, height: 50 }`: 150, 100, 50.
 *
 * @param srcPath Path of the source image.
 * @param destPath Where the files go, and their name:
 * - a directory (`'out/'`, with a trailing separator): named after the
 *   source, `out/house@1280w.webp`;
 * - a name (`'out/hero'`): `out/hero@1280w.webp`; an extension that isn't
 *   a format is part of it (`'out/hero.v2'`);
 * - a file with a format's extension (`'out/hero.webp'`):
 *   `out/hero@1280w.webp`, and the format is added to `formats`.
 * @param settings One per size: a `width` or a `height` (or both, for
 * another aspect ratio), in pixels or as a multiplier like `'x2'`, and its
 * own options, see `OutputSetting`.
 * @param formats A list, `['avif', 'webp', 'jpg']` (`'fallback'`
 * included), or formats with options for this call,
 * `{ webp: { quality: 70 }, jpg: {} }`, merged over `formatOptions` and
 * `DEFAULT_FORMAT_OPTIONS`. Without formats: the destination's extension,
 * or the source's format.
 * @param options See `AssetsOptions`: each falls back to its environment
 * variable, if it has one, then to its default.
 * @returns The source's result: its status, size and data, and each
 * setting's files with their status (see `ResultSource`). With
 * `abortScope: 'source'`, a failure stops the sizes after it.
 * @throws `TypeError | RangeError` for invalid arguments or options, before
 * any processing.
 * @throws `ResultSourceError` with `abortScope: 'batch'` when the source
 * fails, carrying its result.
 */
export const generateSingleSourceAssets = async (
  srcPath: string,
  destPath: string,
  settings: readonly OutputSetting[],
  formats?: OutputFormats,
  options?: AssetsOptions
): Promise<ResultSource> => {
  assertPath('Source path', srcPath);
  assertPath('Destination path', destPath);
  assertSettings(settings);
  const resolvedOptions = resolveOptions(options);
  const target = resolveTarget(
    srcPath,
    destPath,
    parseFormats(formats),
    resolvedOptions.formatOptions
  );
  resolvedOptions.logger.debug({
    source: displayPath(srcPath),
    output: displayPath(target.outputPath),
    ...describeSettings(settings, target.encoders, resolvedOptions),
  });

  const controller = new AbortController();
  const result = await processSource(srcPath, target, settings, {
    ...resolvedOptions,
    signal: controller.signal,
    abort: (reason) => {
      controller.abort(reason);
    },
  });

  if (resolvedOptions.abortScope === 'batch' && result.status !== 'succeed')
    throw new ResultSourceError(
      `Source ${displayPath(srcPath)} failed.`,
      result,
      {
        cause: controller.signal.reason,
      }
    );

  return result;
};
