import fs from 'node:fs/promises';
import path from 'node:path';

import sharp, { type Sharp } from 'sharp';

import type { ResolvedOptions } from '../config/options.js';
import {
  selectEncoders,
  type Encoder,
  type TargetEncoder,
} from '../config/validate.js';
import type { ImageAssetsLogger } from '../log/logger.js';
import type {
  OutputSetting,
  ResultFormat,
  ResultSetting,
} from '../types/output.js';
import { allResultsSucceeded, formatBytes } from '../utils/helpers.js';
import { supportsAlpha, toSharpFormat } from './formats.js';
import {
  limitToSource,
  resolveOutputSettings,
  type ResolvedOutputSettings,
} from './resolve-settings.js';
import { parseSuffix } from './suffix.js';

/** Options of a run, with the signal stopping it (`abortScope: 'batch'`). */
export interface RunContext extends ResolvedOptions {
  readonly signal: AbortSignal;
  /** Stops the run: sources not started are skipped, settings not started too. */
  readonly abort: (reason: unknown) => void;
}

/** What a source gives: its size, its resolved sizes and its encoders. */
export interface SourcePlan {
  /** Size of the source as shown (auto-oriented). */
  readonly width: number;
  readonly height: number;
  readonly hasAlpha: boolean;
  /** From the largest; those larger than the source `skipped` without upscale. */
  readonly settings: ResolvedOutputSettings[];
  /** `'fallback'` resolved for this source. */
  readonly encoders: Encoder[];
}

/**
 * Reads a source's metadata and resolves what it will give, without
 * resizing anything.
 */
export const planSource = async (
  source: Sharp,
  settings: readonly OutputSetting[],
  encoders: readonly TargetEncoder[],
  {
    logger,
    resizeStrategyHint,
    upscale,
  }: Pick<ResolvedOptions, 'logger' | 'resizeStrategyHint' | 'upscale'>
): Promise<SourcePlan> => {
  const {
    autoOrient: { width, height },
    hasAlpha,
  } = await source.metadata();
  const dimensions = { srcWidth: width, srcHeight: height };
  const resolved = resolveOutputSettings(
    settings,
    dimensions,
    resizeStrategyHint,
    logger
  );
  return {
    width,
    height,
    hasAlpha,
    settings: upscale ? resolved : limitToSource(resolved, dimensions),
    encoders: selectEncoders(encoders, hasAlpha),
  };
};

/**
 * Output path of a setting without the extension, with its planned size:
 * the actual size can differ with `resizeOptions` like `withoutEnlargement`.
 */
export const plannedIdentifier = (
  outputPath: string,
  setting: ResolvedOutputSettings,
  suffix: string
) =>
  `${outputPath}${parseSuffix(setting.suffix ?? suffix, {
    width: setting.extractRegion?.width ?? setting.width,
    height: setting.extractRegion?.height ?? setting.height,
    widthMultiplier: setting.widthMultiplier,
    heightMultiplier: setting.heightMultiplier,
    sizeMultiplier: setting.sizeMultiplier,
  })}`;

/** Background of transparent images written to formats without alpha. */
const FLATTEN_BACKGROUND = '#ffffff';

/**
 * Saves the contents of a sharp object to a file of specific format.
 *
 * @param image Sharp object containing the image data.
 * @param file Full file path of the output.
 * @param encoder Format of the file and its complete options.
 * @param hasAlpha Whether the image is transparent: formats without alpha
 * (JPEG) get it flattened on white instead of showing the hidden colors of
 * transparent pixels.
 * @returns Promise that fulfills with an object containing metadata about the
 * output file and format. Never rejects: an error is consumed and saved in
 * the output object.
 */
export const sharpToFile = async (
  image: Sharp,
  file: string,
  { format, options }: Encoder,
  hasAlpha: boolean
): Promise<ResultFormat> => {
  try {
    const pipeline =
      hasAlpha && !supportsAlpha(format) ?
        image.flatten({ background: FLATTEN_BACKGROUND })
      : image;
    const fileData = await pipeline
      .toFormat(toSharpFormat(format), options)
      .toFile(file);
    return { status: 'succeed', format, file, fileData };
  } catch (error: unknown) {
    // consume the error and let upper level make the decisions
    return { status: 'failed', format, file, error };
  }
};

/**
 * Takes an image and saves it to a list of formats, all at the same time:
 * encoding from a decoded image is fast, so running the formats in parallel
 * helps single source speed when threads are available. Every format is
 * attempted and awaited, so no file is written after this resolves.
 *
 * @param image The image, already resized.
 * @param encoders Formats to write and their options, `'fallback'` resolved
 * once the source tells if it is transparent.
 * @param outputIdentifier Full path to the output file without the extension.
 * @param hasAlpha Whether the image is transparent, see `sharpToFile`.
 * @param logger Receives a debug log per file and an error per failure.
 * @returns Promise that fulfills with a list of objects containing metadata
 * about each format and the output file, in the order of the encoders.
 */
export const settingToFormats = async (
  image: Sharp,
  encoders: readonly Encoder[],
  outputIdentifier: string,
  hasAlpha: boolean,
  logger: ImageAssetsLogger
): Promise<ResultFormat[]> => {
  const results = await Promise.all(
    encoders.map((encoder) =>
      sharpToFile(
        image.clone(),
        `${outputIdentifier}.${encoder.format}`,
        encoder,
        hasAlpha
      )
    )
  );

  for (const result of results) {
    if (result.status === 'succeed') {
      const { width, height, size } = result.fileData;
      logger.debug(
        `Created ${result.file} (${width}x${height}, ${formatBytes(size)})`
      );
    } else logger.error({ file: result.file, error: result.error });
  }

  return results;
};

/** Image the next sizes can be resized from, with its size. */
interface ResizeBase {
  image: Sharp;
  width: number;
  height: number;
  /** A baked buffer of an earlier size, not the source. */
  isBuffer: boolean;
  /** Has the source's aspect ratio, up to the rounding of its size. */
  keepsAspectRatio: boolean;
}

/**
 * Takes source image file path and manipulates it based on the settings list.
 * Each setting is baked to a buffer and then send to be saved to one or
 * multiple formats.
 *
 * Settings are ordered by size automatically. By default, if the size is lower
 * than the original source's size and if not overruled in the setting, each
 * iteration's buffer will be used as source for the next iteration. If the
 * flag for generating from source is set, it overrides the current iteration's
 * buffer and source is used instead. If the setting size is bigger than the
 * source's size, or than the current iteration's buffer, then the original
 * source is used, so no size is ever upscaled from a smaller copy.
 *
 * A failed setting is added to the result with a failed status. With
 * `abortScope` `'source'` or `'batch'` it stops the source: the settings after
 * it are not processed. With `upscale: false`, settings larger than the
 * source are skipped, see `limitToSource`.
 *
 * @param srcPath Source's image full path.
 * @param settings Settings list to generate files.
 * @param encoders Formats to write and their options.
 * @param outputPath Full output path without extension. Setting suffix and file
 * format will be added automatically later on.
 * @param context Options of the run and its abort signal.
 * @returns Promise that resolves to a list of objects containing metadata about
 * each setting and its resulting files, whether the source stopped before
 * its last setting, and the source's size.
 * @throws When the source can't be read or the output directory can't be
 * created: nothing was processed.
 */
export const sourceToSettings = async (
  srcPath: string,
  settings: readonly OutputSetting[],
  targetEncoders: readonly TargetEncoder[],
  outputPath: string,
  context: RunContext
): Promise<{
  outputsBySetting: ResultSetting[];
  stopped: boolean;
  width: number;
  height: number;
}> => {
  const { logger, suffix, abortScope, signal } = context;

  // read once: every size sees the same file, and libvips' file cache never
  // keeps it open (Windows can't change or delete open files)
  const input = await fs.readFile(srcPath);
  // EXIF orientation applied: phone photos are often stored sideways
  const source = sharp(input, { autoOrient: true });
  const plan = await planSource(source, settings, targetEncoders, context);
  const { width: srcWidth, height: srcHeight, hasAlpha, encoders } = plan;
  logger.verbose({ source: srcPath, settings: plan.settings });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const outputsBySetting: ResultSetting[] = [];
  const done = (stopped: boolean) => ({
    outputsBySetting,
    stopped,
    width: srcWidth,
    height: srcHeight,
  });
  const identifiers = new Set<string>();
  const sourceBase: ResizeBase = {
    image: source,
    width: srcWidth,
    height: srcHeight,
    isBuffer: false,
    keepsAspectRatio: true,
  };
  let base = sourceBase;

  for (const setting of plan.settings) {
    if (signal.aborted) return done(true);

    const { width, height, resizeOptions, extractRegion } = setting;
    if (setting.skipped) {
      outputsBySetting.push({
        status: 'skipped',
        size: `${width}x${height}`,
        files: [],
      });
      logger.debug(
        `Skipped ${width}x${height} of ${srcPath}: larger than the source (${srcWidth}x${srcHeight})`
      );
      continue;
    }
    const start =
      setting.generateFromSource || base.width < width || base.height < height ?
        sourceBase
      : base;
    logger.verbose(
      `Resizing ${srcPath} to ${width}x${height} from ${start.isBuffer ? `the ${start.width}x${start.height} buffer` : 'the source'}`
    );

    let result: ResultSetting;
    try {
      // same aspect ratio up to rounding: 'cover' would crop a fraction of a
      // pixel, and each size resized from the previous one would add its
      // own, shifting the image (up to 0.1 SSIM lost after a few sizes)
      const fit =
        resizeOptions?.fit ??
        (start.keepsAspectRatio && setting.isMatchingSourceAspectRatio ?
          'fill'
        : undefined);
      // a fresh pipeline per setting: operations never leak to the next one
      const pipeline = start.image
        .clone()
        .resize(width, height, { ...resizeOptions, ...(fit && { fit }) });
      if (extractRegion) pipeline.extract(extractRegion);

      const { data, info } = await pipeline
        .raw({ depth: 'uchar' })
        .toBuffer({ resolveWithObject: true });
      const baked = sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      });

      const outputIdentifier = `${outputPath}${parseSuffix(
        setting.suffix ?? suffix,
        {
          width: info.width,
          height: info.height,
          widthMultiplier: setting.widthMultiplier,
          heightMultiplier: setting.heightMultiplier,
          sizeMultiplier: setting.sizeMultiplier,
        }
      )}`;
      if (identifiers.has(outputIdentifier))
        throw new Error(
          `Another setting already writes ${outputIdentifier}.*: give the settings different suffixes, e.g. with {w}.`
        );
      identifiers.add(outputIdentifier);

      const files = await settingToFormats(
        baked,
        encoders,
        outputIdentifier,
        hasAlpha,
        logger
      );
      result = {
        status: allResultsSucceeded(files) ? 'succeed' : 'failed',
        size: `${info.width}x${info.height}`,
        files,
      };

      if (setting.useAsNextResizeIteration)
        base = {
          image: baked,
          width: info.width,
          height: info.height,
          isBuffer: true,
          keepsAspectRatio:
            setting.isMatchingSourceAspectRatio && extractRegion === undefined,
        };
    } catch (error: unknown) {
      result = {
        status: 'failed',
        size: `${width}x${height}`,
        files: [],
        error,
      };
      logger.error({ source: srcPath, size: result.size, error });
    }

    outputsBySetting.push(result);

    if (result.status === 'failed' && abortScope !== 'none') {
      if (abortScope === 'batch') {
        // the resize's error, or the first file's
        const failedFile = result.files.find(
          (file) => file.status === 'failed'
        );
        context.abort(
          new Error(`Setting ${result.size} of ${srcPath} failed.`, {
            cause: result.error ?? failedFile?.error,
          })
        );
      }
      return done(true);
    }
  }

  return done(false);
};
