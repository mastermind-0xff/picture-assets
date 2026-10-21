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

export const sharpToFile = async (
  sharpWrapper: Sharp,
  outputIdentifier: string,
  format: OutputFormat,
  formatOptions: OutputFormatsOptions[OutputFormat],
  signal: AbortSignal
): Promise<ResultFormat> => {
  const file = `${outputIdentifier}.${format}`;
  try {
    const fileData = await sharpWrapper
      .toFormat(format, formatOptions)
      .toFile(file);

    return {
      status: 'succeed',
      format,
      file,
      fileData,
    };

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

    return [
      await sharpToFile(
        sharpSource,
        outputIdentifier,
        format,
        currentFormatOptions,
        signal
      ),
    ];

    resultPromisesMap.set(
      format,
      sharpToFile(
        sharpSource,
        outputIdentifier,
        format,
        currentFormatOptions,
        signal
      )
    );
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

export const sourceToSettings = async (
  srcPath: string,
  settings: OutputSetting[],
  formats: AtLeastOneProperty<OutputFormatsOptions>,
  outputPath: string,
  executionContext: ExecutionContext
) => {
  const { logger, resizeStrategyHint } = executionContext;

  const srcSharp = sharp(srcPath);
  // let workingSharp = srcSharp.clone();
  let workingSharp = srcSharp;

  const resultSettings: ResultSetting[] = [];
  let n = 0;
  for (const currentSetting of settings) {
    console.log('123', n++);
    const {
      suffix,
      width: currentWidth,
      height: currentHeight,
      resizeOptions,
      extractRegion,
      generateFromSource,
      useAsNextResizeIteration,
    } = currentSetting;

    // if (generateFromSource) workingSharp = srcSharp.clone();

    workingSharp.resize(currentWidth as number);
    // if (extractRegion) workingSharp.extract(extractRegion);

    const {
      data,
      info: { width, height, channels },
    } = await workingSharp.raw().toBuffer({ resolveWithObject: true });

    const sharpBaked = sharp(data, {
      raw: { width, height, channels },
    });

    return sharpBaked.toFormat('webp',{quality:80});

    // if (useAsNextResizeIteration) workingSharp = sharpBaked.clone();

    const settingWidth = extractRegion?.width ?? width;
    const settingHeight = extractRegion?.height ?? height;
    // const settingSuffix = parseSuffix(suffix, {
    //   width: settingWidth,
    //   height: settingHeight,
    //   widthMultiplier,
    //   heightMultiplier,
    //   sizeMultiplier,
    // });
    const settingSuffix = '';
    const outputIdentifier = `${outputPath}${settingSuffix}`;
    const size = `${settingWidth}x${settingHeight}` as const;

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
    
  }
};
