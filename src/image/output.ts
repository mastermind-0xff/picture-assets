import fs from 'fs';
import path from 'path';

import sharp, { Sharp } from 'sharp';

import { AtLeastOneProperty, ObjectEntries } from '@mmtypes/common';

import { ParseDimensionsData, resolveOutputSettings } from './resolve-settings';
import {
  OutputFormat,
  OutputFormatsOptions,
  OutputSetting,
  ResultFormat,
  ResultSetting,
} from '../types/output';
import { ExecutionContext } from '../types/execution';
import { ImageResizeConfig } from '../config/main';
import { isSharpFormatEnum } from '../utils/type-guards';
import {
  allResultsSucceeded,
  isAbortLevel,
  shouldAbort,
} from '../utils/helpers';
import {
  ResultFormatsError,
  ResultSettingsError,
} from '../errors/image-resize-errors';

/**
 * Checks for a user-supplied suffix or use the config default. Replaces
 * supported wildcards in the suffix with values from `dimensionsData`; missing
 * values are replaced with blanks. All path separators are removed from the
 * result. Trimmed.
 *
 * **example:**
 * ```typescript
 * //returns '_@x2_2048w'
 * parseSuffix('_@x{sm}_{w}w', { sizeMultiplier: 2, width: 2048 });
 * ```
 * ---
 * @param suffix String to be attached to every output filename.
 * - *default:* `ImageResizeConfig.suffix`.
 * - *wildcards:*\
 * `'{w}'` - width in pixels;\
 * `'{h}'` - height in pixels;\
 * `'{sm}'` - size multiplier based on area;\
 * `'{wm}'` - width multiplier;\
 * `'{hm}'` - height multiplier.
 * - *example:*\
 * `_@x{sm}_{w}w` - can produce `'_@x2_2048w'`.
 *
 * @param dimensionsData Object providing replacement data for the wildcards.
 * @returns The new resolved string suffix.
 */
export const parseSuffix = (
  suffix: string = ImageResizeConfig.suffix,
  dimensionsData: ParseDimensionsData = {}
) => {
  const { width, height, sizeMultiplier, widthMultiplier, heightMultiplier } =
    dimensionsData;
  const propertiesMap = {
    '{w}': `${width ?? ''}`,
    '{h}': `${height ?? ''}`,
    '{sm}': `${sizeMultiplier ?? ''}`,
    '{wm}': `${widthMultiplier ?? ''}`,
    '{hm}': `${heightMultiplier ?? ''}`,
  };
  return suffix
    .replace(/{\w+}/g, (match) =>
      Object.prototype.hasOwnProperty.call(propertiesMap, match) ?
        `${propertiesMap[match as keyof typeof propertiesMap]}`
      : match
    )
    .replace(/[/\\]+/g, '')
    .trim();
};

/**
 * Saves the contents of a sharp object to a file of specific format.
 *
 * Can be effectively aborted before sharp starts processing the request. After
 * that, even if abort signal arrives, sharp will continue to work in the
 * background as there is currently no mechanism to abort sharp's execution.
 * This, however, will let execution engine to continue and save time by not
 * waiting for the result, but might still use system resources wile sharp is
 * working in the background.
 *
 * @param sharpWrapper Sharp object containing the buffer data or file location
 * and all of its manipulations.
 * @param outputIdentifier Full file path for the output without the extension.
 * @param format Format of the file. Will be used as file extension.
 * @param formatOptions Additional sharp format options.
 * @param signal Abort signal to cancel prematurely.
 * @returns Promise that fulfills with an object containing metadata about the
 * output file and format. In case of an error, the error is consumed and saved
 * in the output object.
 */
export const sharpToFile = async (
  sharpWrapper: Sharp,
  outputIdentifier: string,
  format: OutputFormat,
  formatOptions: OutputFormatsOptions[OutputFormat],
  signal: AbortSignal
): Promise<ResultFormat> => {
  const file = `${outputIdentifier}.${format}`;
  try {
    // if root aborted, cancel early
    if (signal.aborted) {
      // TODO Add fileState: 'early-abort' (no file), 'aborted' (might exist)?
      return { status: 'aborted', format, file };
    }

    const relativeDest = path.dirname(file);
    await fs.promises.mkdir(relativeDest, { recursive: true });

    const createFilePromise = (async (): Promise<ResultFormat> => {
      const fileData = await sharpWrapper
        .toFormat(format, formatOptions)
        .toFile(file);

      return {
        status: 'succeed',
        format,
        file,
        fileData,
      };
    })();

    const abortPromise = new Promise<ResultFormat>((resolve) =>
      signal.addEventListener(
        'abort',
        () => {
          // no way to cancel sharp, return with status for clarity
          resolve({ status: 'aborted', format, file });
        },
        { once: true }
      )
    );

    return await Promise.race([createFilePromise, abortPromise]);
  } catch (error: unknown) {
    // consume the error and let upper level make the decisions
    return {
      status: 'failed',
      format,
      file,
      error,
    };
  }
};

/**
 * Takes sharp source and saves it to a list of formats. Depending on the abort
 * scope, execution might halt and throw, or continue. In both cases the failed
 * format will be added to the resulting list with a failed status.
 *
 * @param sharpSource The source image.
 * @param formats Object containing all formats to be exported and their options.
 * @param outputIdentifier Full path to the output file without the extension.
 * @param executionContext Current running context.
 * @returns Promise that fulfills with a list of objects containing metadata
 * about each format and the output file.
 * @throws `ResultFormatsError | any`
 * If a format fails, and current execution scope is lower or equal to the abort
 * scope, the execution halts and an error is thrown bubbling up. The error
 * contains all completed formats including the one that failed.
 */
export const settingToFormats = async (
  sharpSource: Sharp,
  formats: AtLeastOneProperty<OutputFormatsOptions>,
  outputIdentifier: string,
  executionContext: ExecutionContext
): Promise<ResultFormat[]> => {
  const { logger } = executionContext;

  let resultFormats: ResultFormat[] = [];
  const resultPromisesMap = new Map<OutputFormat, Promise<ResultFormat>>();

  const formatsAbortController = new AbortController();
  const { signal } = formatsAbortController;

  for (const [format, currentFormatOptions] of Object.entries(
    formats
  ) as ObjectEntries<typeof formats>) {
    // runtime fail-safe for Object.entries
    if (!isSharpFormatEnum(format)) {
      logger.warning(
        `Skipping output format '${format}' for '${outputIdentifier}'.`,
        `Unsupported format`
      );
      continue;
    }

    const formatPromise = sharpToFile(
      sharpSource.clone(),
      outputIdentifier,
      format,
      currentFormatOptions,
      signal
    );
    // await promise;

    // format export from raw source execute almost instantly for most formats,
    // running all formats in parallel does not hinder multiple sources
    // performance, but helps with single source speed, if threads are
    // available and format export is challenging
    resultPromisesMap.set(format, formatPromise);
  }

  while (resultPromisesMap.size) {
    // sharpToFile will never reject
    const currentResult = await Promise.race(resultPromisesMap.values());
    resultPromisesMap.delete(currentResult.format);
    // add the result no matter of the status (you get to examine the last file)
    resultFormats.push(currentResult);

    if (currentResult.status === 'failed') {
      if (shouldAbort(executionContext)) {
        if (isAbortLevel(executionContext))
          logger.error(`${currentResult.file}`, 'File failed');
        // trigger abort and immediately exit the loop
        formatsAbortController.abort();
        throw new ResultFormatsError(
          `Format ${currentResult.format} aborted.`,
          resultFormats,
          { cause: currentResult.error }
        );
      }
      logger.warning(`${currentResult.file}`, 'File failed');
    } else if (currentResult.status === 'aborted') {
      // this should not execute as the abort is triggered by previous failure
      logger.warning(`${currentResult.file}`, 'File aborted');
    } else if (currentResult.status === 'succeed') {
      logger.info(`${currentResult.file}`, 'File created');
    }
  }

  return resultFormats;
};

/**
 * Takes source image file path and manipulates it based on the settings list.
 * Each setting is baked to a buffer and then send to be saved to one or
 * multiple formats. Depending on the abort scope, execution might halt and
 * throw, or continue. In both cases the failed setting will be added to the
 * resulting list with a failed status.
 *
 * Settings are ordered by size automatically. By default, if the size is lower
 * than the original source's size and if not overruled in the setting, each
 * iteration's buffer will be used as source for the next iteration. If the
 * flag for generating from source is set, it overrides the current iteration's
 * buffer and source is used instead. If the setting size is bigger than the
 * source's size, then the original source is used, again if not overruled.
 *
 * @param srcPath Source's image full path.
 * @param settings Settings list to generate files.
 * @param formats Object containing all formats to be exported and their
 * corresponding options.
 * @param outputPath Full output path without extension. Setting suffix and file
 * format will be added automatically later on.
 * @param executionContext Current running context.
 * @returns Promise that resolves to a list of objects containing metadata about
 * each setting and its resulting files.
 * @throws `ResultSettingsError | any`
 * If a setting fails, and current execution scope is lower or equal to the
 * abort scope, the execution halts and an error is thrown bubbling up. The
 * error contains all completed settings including the one that failed.
 */
export const sourceToSettings = async (
  srcPath: string,
  settings: OutputSetting[],
  formats: AtLeastOneProperty<OutputFormatsOptions>,
  outputPath: string,
  executionContext: ExecutionContext
): Promise<ResultSetting[]> => {
  const { logger, resizeStrategyHint } = executionContext;

  const srcSharp = sharp(srcPath);
  let workingSharp = srcSharp.clone();

  const resultSettings: ResultSetting[] = [];

  const resolvedSettings = resolveOutputSettings(
    settings,
    await srcSharp.metadata(),
    resizeStrategyHint,
    executionContext
  );

  logger.debug(resolvedSettings, `Resolved settings for ${srcPath}`);

  for (const currentSetting of resolvedSettings) {
    const {
      suffix,
      width: currentWidth,
      height: currentHeight,
      resizeOptions,
      extractRegion,
      generateFromSource,
      useAsNextResizeIteration,
      widthMultiplier,
      heightMultiplier,
      sizeMultiplier,
    } = currentSetting;

    if (generateFromSource) workingSharp = srcSharp.clone();

    workingSharp.resize(currentWidth, currentHeight, resizeOptions);
    if (extractRegion) workingSharp.extract(extractRegion);

    const {
      data,
      info: { width, height, channels },
    } = await workingSharp.raw().toBuffer({ resolveWithObject: true });

    const sharpBaked = sharp(data, {
      raw: { width, height, channels },
    });

    if (useAsNextResizeIteration) workingSharp = sharpBaked;

    const settingWidth = extractRegion?.width ?? width;
    const settingHeight = extractRegion?.height ?? height;
    const settingSuffix = parseSuffix(suffix, {
      width: settingWidth,
      height: settingHeight,
      widthMultiplier,
      heightMultiplier,
      sizeMultiplier,
    });
    const outputIdentifier = `${outputPath}${settingSuffix}`;
    const size = `${settingWidth}x${settingHeight}` as const;

    try {
      const files = await settingToFormats(
        sharpBaked,
        formats,
        outputIdentifier,
        { ...executionContext, executionScope: 'format' }
      );
      resultSettings.push({
        status: allResultsSucceeded(files) ? 'succeed' : 'failed',
        size,
        files,
      });
    } catch (error: unknown) {
      const files =
        error instanceof ResultFormatsError ? error.resultFormats : undefined;

      if (shouldAbort(executionContext)) {
        if (isAbortLevel(executionContext))
          logger.error({ size, error }, 'Setting aborted');

        resultSettings.push({ status: 'aborted', size, files });

        throw new ResultSettingsError(
          `Setting for ${size} aborted.`,
          resultSettings,
          { cause: error }
        );
      }

      resultSettings.push({ status: 'failed', size, files });
      logger.warning({ size, error }, 'Setting failed');
    }
  }

  return resultSettings;
};
