import { resolveOptions } from '../config/options.js';
import {
  assertSettings,
  createEncoders,
  describe,
  parseFormats,
  type FormatOptionsInput,
  type TargetEncoder,
} from '../config/validate.js';
import { ResultSourceError } from '../errors/image-resize-errors.js';
import { sourceToSettings, type RunContext } from '../image/output.js';
import {
  resolvePathsAndFormats,
  type FormatsMap,
} from '../image/output-paths.js';
import type { ImageResizeOptions } from '../types/options.js';
import type {
  OutputFormats,
  OutputSetting,
  ResultSource,
  ResultStatus,
} from '../types/output.js';
import { formatBytes, formatDuration } from '../utils/helpers.js';

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

  logger.debug(`Processing ${srcPath}`);
  try {
    const { outputsBySetting, stopped, width, height } = await sourceToSettings(
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
      outputsBySetting,
      duration: Math.round(performance.now() - start),
    };

    const files = outputsBySetting.flatMap((setting) => setting.files);
    const written = files.flatMap((file) =>
      file.status === 'succeed' ? [file.fileData.size] : []
    );
    const bytes = written.reduce((sum, size) => sum + size, 0);
    const summary = `${srcPath}: ${written.length} files, ${formatBytes(bytes)} in ${formatDuration(result.duration)}`;
    if (status === 'succeed') logger.info(summary);
    else if (status === 'failed')
      logger.warning(`${summary}, ${files.length - written.length} failed`);
    else logger.warning(`${summary}, stopped by an abort`);

    return result;
  } catch (error: unknown) {
    logger.error({ source: srcPath, error });
    if (context.abortScope === 'batch') context.abort(error);
    return sourceResult(srcPath, 'failed', start, error);
  }
};

/**
 * ---
 * Convert a single image source file to a multiple output formats and
 * resolutions. By default, source is considered the highest resolution image.
 * Formats for a given setting are computed all together, while each setting is
 * awaited to completion and then the final result is returned. Depending on the
 * abort scope, a failure stops the source or makes the call reject, see
 * `options.abortScope`.
 *
 * **examples:**
 * ```typescript
 * // minimum config
 * const result = await imageResize(
 *  '/path/to/file.jpg',
 *  '/path/to/assets/new-name-prefix',
 *  [
 *   { width: 'x2', suffix: '@2x({w}w)' },
 *   { width: 1024, suffix: '@1x({w}w)' },
 *  ],
 *  ['webp', 'jpg']
 * );
 * ```
 *
 * @param srcPath Path to a single source file.
 *
 * @param destPath Path to an output file or directory. If the extension is an
 * output format, it is added to the output formats list. If trailing slash is
 * used (destination is a directory) source's file name will be used as a
 * destination file name otherwise the string after the last slash will be
 * used as a prefix for all settings and formats.
 *
 * *examples*:
 * ```
 * // /!\ source is 'path/to/src/image.png'
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'file'; .webp added to formats
 * 'path/to/dest/dir/file.webp';
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'image'; .png used without formats
 * 'path/to/dest/dir/';
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'file'; .png used without formats
 * 'path/to/dest/dir/file';
 * ```
 *
 * @param settings List of objects containing width and/or height, sharp
 * advanced resize options, crop region, output suffix, ability to force
 * generation from source or whether to use or not the result buffer as next
 * iteration. Omit width or height to calculate the other dimension
 * automatically.
 *
 * **important:**
 * Settings are resolved to width and height pixels and ordered by size from
 * highest resolution to the lowest. Then, after each resize of the same aspect
 * ratio the resize buffer is updated unless overruled in the settings. If some
 * setting resolution is bigger than the source's resolution, or than the
 * buffer, it won't use the previously saved buffer, but original source
 * instead, again if not overruled by the settings.
 *
 * **examples:**
 * ```
 * [{width:1024}, {width:'x2'}];
 * // ---
 * [
 * {width:1024, height:768},
 * {width:1000, extractRegion:{left:250, top:0, width:500, height:375}}
 * ];
 * ```
 *
 * @param formats List of strings containing output file formats or object
 * containing format as key and format options (quality, etc.) as values.
 * Options are merged over the format's defaults (`DEFAULT_FORMAT_OPTIONS`).
 *
 * **examples:**
 * ```
 * ['avif', 'webp', 'jpg'];
 * // -or-
 * {jpg: { quality: 80 }, webp: { quality: 70 } }
 * ```
 *
 * @param options Options of the call, each falling back to its environment
 * variable, then to its default:
 *
 * - `resizeStrategyHint` - Helps to determine what multipliers mean in the
 * context of the settings. Tells what source image's multiplier is, or what
 * `'x1'` resolution is. Based on that, all other multipliers in the `settings`
 * can be calculated. Possible values:\
 * `'downsample'` (default) - Source has the highest resolution. If pixel
 * resolution is available the lowest resolution that is lower than the
 * source's is `'x1'` or if multipliers are available the highest multiplier is
 * source's multiplier. Pixel resolutions take precedence over multipliers.\
 * `'upsample'` - Source is the lowest resolution - alias of `'x1'`.\
 * `'x${number}'` - Source multiplier is known and hardcoded - `'x1'`, `'x2'`,
 * `'x3.5'` and so on.\
 * `{ width: number; height: number }` - Tells what `'x1'` resolution is, then
 * source multiplier is based on that.\
 * **example:**
 * ```typescript
 * // source @ 300x300px
 * await imageResize(
 *  'image.jpg',
 *  './dest/',
 *  [
 *    { width: 'x3', suffix: '@3x({w}w)' },
 *    { width: 'x2', suffix: '@2x({w}w)' },
 *    { width: 'x1', suffix: '@1x({w}w)' },
 *  ],
 *  ['webp'])
 *
 * // 'downsample' will output
 * // ./dest/image@3x(300w).webp, ./dest/image@2x(200w).webp,
 * // ./dest/image@1x(100w).webp
 *
 * // 'upsample' will output
 * // ./dest/image@3x(900w).webp, ./dest/image@2x(600w).webp,
 * // ./dest/image@1x(300w).webp
 *
 * // 'x2' will output
 * // ./dest/image@3x(450w).webp, ./dest/image@2x(300w).webp,
 * // ./dest/image@1x(150w).webp
 *
 * // {width:50, height:50} will output
 * // ./dest/image@3x(150w).webp, ./dest/image@2x(100w).webp,
 * // ./dest/image@1x(50w).webp
 * ```
 *
 * - `suffix` - Suffix of settings without their own. Default `'@{w}w'`.
 *
 * - `formatOptions` - Options per format, for every call that writes it.
 *
 * - `upscale` - Whether sizes larger than the source are made (default
 * `true`). With `false` they are `'skipped'`, and the largest of them is made
 * at the source's size instead, unless a size already is.
 *
 * - `abortScope` - What a failure stops: `'none'` (default) attempts every
 * output and reports failures in the result; `'source'` stops at the first
 * failed setting and resolves with a failed result; `'batch'` stops as well
 * and rejects with a `ResultSourceError` carrying the result.
 *
 * - `logger` - A log level for the default logger (`'info'`), or a logger.
 *
 * @returns Resolves to an object containing source file path and list of
 * objects containing each setting that contains a list of each format. Each
 * branch of the formed three contains a field with its completion status.
 * @throws `TypeError | RangeError` for invalid arguments or options, before
 * any processing.
 * @throws `ResultSourceError` with `abortScope: 'batch'` when the source
 * fails. The error contains the source result.
 */
export const imageResize = async (
  srcPath: string,
  destPath: string,
  settings: readonly OutputSetting[],
  formats?: OutputFormats,
  options?: ImageResizeOptions
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
  resolvedOptions.logger.verbose({
    srcPath,
    destPath,
    outputPath: target.outputPath,
    encoders: target.encoders,
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
    throw new ResultSourceError(`Source ${srcPath} failed.`, result, {
      cause: controller.signal.reason,
    });

  return result;
};
