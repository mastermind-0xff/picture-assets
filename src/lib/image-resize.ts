import { ResultSource } from '../types/output';
import { AtLeastOneOutputFormat, OutputSetting } from '../types/output';
import { ExecutionContext } from '../types/execution';

import { ImageResizeConfig } from '../config/main';
import { createLogger } from '../log/logger';
import { sourceToSettings } from '../image/output';
import { resolvePathsAndFormats } from '../image/output-paths';
import {
  ResultSettingsError,
  ResultSourceError,
} from '../errors/image-resize-errors';
import {
  allResultsSucceeded,
  formatMsTime,
  isAbortLevel,
  sampleCPUUsage,
  shouldAbort,
} from '../utils/helpers';
import { sec } from 'style-escape-codes';

/**
 * ---
 * Convert a single image source file to a multiple output formats and
 * resolutions. By default, source is considered the highest resolution image.
 * Formats for a given setting are computed all together, while each setting is
 * awaited to completion and then the final result is returned. Depending on the
 * abort scope, execution might halt and throw, or continue returning result
 * with failed status.
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
 * @param destPath Path to an output file or directory. If extension is present
 * it will be added to the output formats list. If trailing slash is used
 * (destination is a directory) source's file name will be used as a destination
 * file name otherwise the string after the last slash will be used as a prefix
 * for all settings and formats.
 *
 * *examples*:
 * ```
 * // /!\ source is 'path/to/src/image.png'
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'file'; .webp added to formats
 * 'path/to/dest/dir/file.webp';
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'image'; .png may be added to formats
 * 'path/to/dest/dir/';
 *
 * // dest dir:'path/to/dest/dir/'; prefix:'file'; .png may be added to formats
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
 * setting resolution is bigger than the source's resolution, it won't use the
 * previously saved buffer, but original source instead, again if not overruled
 * by the settings.
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
 *
 * **examples:**
 * ```
 * ['jpg', 'webp'];
 * // -or-
 * {jpg: { quality: 80 }, webp: { quality: 70 } }
 * ```
 *
 * @param executionContext Sets the current execution context.
 *
 * **properties:**
 * - `logger` - Execution-scoped logger with convenience methods for each log
 * level. All logging methods accept the same `message` format:\
 * a string; an object (each property printed on a new line); an array (each
 * item printed on a new line).\
 * An optional `title` may be provided to prefix the message with a styled title
 * for clarity.
 *
 * - `resizeStrategyHint` - Helps to determine what multipliers mean in the
 * context of the settings. Tells what source image's multiplier is, or what
 * `'x1'` resolution is. Based on that, all other multipliers in the `settings`
 * can be calculated. Possible values:\
 * `'downsample'` - Source has the highest resolution. If pixel resolution
 * is available the lowest resolution that is lower than the source's is `'x1'`
 * or if multipliers are available the highest multiplier is source's
 * multiplier. Pixel resolutions take precedence over multipliers.\
 * `'upsample'` - Source is the lowest resolution - alias of `'x1'`.\
 * `'x${number}'` - Source multiplier is known and hardcoded - `'x1'`, `'x2'`,
 * `'x3.5'` and so on.\
 * `{ width: number; height: number }` - Tells what `'x1'` resolution is, then
 * source multiplier is based on that.\
 * **example:**
 * ```typescript
 * // source @ 300x300px
 * console.log(await imageResize(
 *  'image.jpg',
 *  './dest/',
 *  [
 *    { width: 'x3', suffix: '@3x({w}w)' },
 *    { width: 'x2', suffix: '@2x({w}w)' },
 *    { width: 'x1', suffix: '@1x({w}w)' },
 *  ],
 *  ['webp']))
 *
 * // 'downsample' will output
 * {in:'image.jpg',
 *  out:[
 *   './dest/image@3x(300w).webp',
 *   './dest/image@2x(200w).webp',
 *   './dest/image@1x(100w).webp'
 *  ]}
 *
 * // 'upsample' will output
 * {in:'image.jpg',
 *  out:[
 *   './dest/image@3x(900w).webp',
 *   './dest/image@2x(600w).webp',
 *   './dest/image@1x(300w).webp'
 *  ]}
 *
 * // 'x2' will output
 * {in:'image.jpg',
 *  out:[
 *   './dest/image@3x(450w).webp',
 *   './dest/image@2x(300w).webp',
 *   './dest/image@1x(150w).webp'
 *  ]}
 *
 * // {width:50, height:50} will output
 * {in:'image.jpg',
 *  out:[
 *   './dest/image@3x(150w).webp',
 *   './dest/image@2x(100w).webp',
 *   './dest/image@1x(50w).webp'
 *  ]}
 * ```
 *
 * - `executionScope` - The current level of execution. This function makes
 * manipulations based on the source image, thus the scope should be `'source'`.
 * Then the execution is transferred to a function that loops all settings -
 * the `'setting`' level and finally it loops all formats for the current
 * setting - `'format'` level:\
 * **levels of execution:** batch -> source -> setting -> format.
 *
 * - `abortScope` - At what level of execution should the program halt and exit
 * in case of an error.\
 * **example:** If current execution level is `'format'`, but the abort level is
 * `'setting'`, all formats will be processed even if some fails - best effort
 * strategy. As not all files are successfully created for the particular
 * setting, that setting will fail. Because the abort level is `'setting'`,
 * the moment this failed setting return, the execution will halt and no more
 * settings will be executed, then the source level will exit with fail status
 * and settings outputs the source will be available only to the failed setting
 * (failed setting is included).
 *
 * @returns Resolves to an object containing source file path and list of
 * objects containing each setting that contains a list of each format. Each
 * branch of the formed three contains a field with its completion status.
 * @throws `ResultSourceError | any`
 * If a source fails, and current execution scope is lower or equal to the
 * abort scope, the execution halts and an error is thrown bubbling up. The
 * error contains the source result.
 */
export const imageResize = async (
  srcPath: string,
  destPath: string,
  settings: OutputSetting[],
  formats?: AtLeastOneOutputFormat,
  executionContext: ExecutionContext = {
    logger: createLogger(ImageResizeConfig.logLevel),
    resizeStrategyHint: ImageResizeConfig.resizeStrategyHint,
    executionScope: 'source',
    abortScope: ImageResizeConfig.abortScope,
  }
): Promise<ResultSource> => {
  const startCPUSample = sampleCPUUsage();
  const start = performance.now();

  const { logger } = executionContext;
  logger.info(`Started for ${sec.fgBlue(srcPath)}.`, 'imageResize');
  logger.debug(
    { srcPath, destPath, settings, formats, executionContext },
    'Arguments'
  );

  const { outputPath, combinedFormats } = resolvePathsAndFormats(
    srcPath,
    destPath,
    formats
  );
  logger.debug(
    { outputPath, combinedFormats },
    'Resolved output path and formats'
  );

  let resultSource: ResultSource;
  try {
    const resultSettings = await sourceToSettings(
      srcPath,
      settings,
      combinedFormats,
      outputPath,
      { ...executionContext, executionScope: 'setting' }
    );
    resultSource = {
      status: allResultsSucceeded(resultSettings) ? 'succeed' : 'failed',
      source: srcPath,
      outputsBySetting: resultSettings,
    };
  } catch (error: unknown) {
    const outputsBySetting =
      error instanceof ResultSettingsError ? error.resultSettings : undefined;

    if (shouldAbort(executionContext)) {
      if (isAbortLevel(executionContext))
        logger.error({ source: srcPath, error }, 'Source aborted');

      resultSource = {
        status: 'aborted',
        source: srcPath,
        outputsBySetting,
      };
      throw new ResultSourceError(`Source ${srcPath} aborted.`, resultSource, {
        cause: error,
      });
    }

    resultSource = {
      status: 'failed',
      source: srcPath,
      outputsBySetting,
    };
    logger.warning({ source: srcPath, error }, 'Source failed');
  }

  logger.info(
    `Completed source: ${sec.fgBlue(srcPath)}. \
Time: ${formatMsTime(Math.round(performance.now() - start))}. CPU usage: \
${sampleCPUUsage(startCPUSample)}%.`,
    'imageResize'
  );

  return resultSource;
};
