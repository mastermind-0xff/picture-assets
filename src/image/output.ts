import fs from 'node:fs/promises';
import path from 'node:path';

import sharp, { type Channels, type Sharp } from 'sharp';

import type { ResolvedOptions } from '../config/options.js';
import {
  selectEncoders,
  type Encoder,
  type TargetEncoder,
} from '../config/validate.js';
import { describeFiles, tallyFiles } from '../log/describe.js';
import type { AssetsLogger } from '../log/logger.js';
import type { HookSetting, RawImage } from '../types/hooks.js';
import type {
  OutputSetting,
  ResultFormat,
  ResultSetting,
} from '../types/output.js';
import {
  allResultsSucceeded,
  formatBytes,
  formatDuration,
  isMatchingAspectRatio,
} from '../utils/helpers.js';
import { supportsAlpha, toSharpFormat } from './formats.js';
import {
  bake,
  encodedInput,
  fromRaw,
  hasAlphaChannel,
  rawInput,
  runFormatHooks,
  runHooks,
  type HookInput,
} from './hooks.js';
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

/** What a source is, as read or as its `source` hooks made it. */
export interface SourceInfo {
  /** Size as shown (auto-oriented). */
  readonly width: number;
  readonly height: number;
  readonly channels: Channels;
  readonly hasAlpha: boolean;
}

/**
 * Reads a source's size, channels, transparency and file format from its
 * metadata.
 */
export const readSourceInfo = async (
  source: Sharp
): Promise<SourceInfo & { readonly format: string }> => {
  const {
    autoOrient: { width, height },
    channels,
    hasAlpha,
    format,
  } = await source.metadata();
  return { width, height, channels, hasAlpha, format };
};

/**
 * Formats without a scaled decode: a resize from the file decodes all of
 * it and is slower than decoding it once, then resizing the pixels (PNG
 * 2.4x, AVIF 1.4x slower at 2048 of 3901 pixels). WebP's scaled decode beats
 * decoding first at any size; SVG and PDF render at the size asked.
 */
const DECODED_FORMATS: ReadonlySet<string> = new Set([
  'png',
  'heif',
  'gif',
  'tiff',
]);

/**
 * Shrink from which sharp's JPEG shrink-on-load is as fast as decoding
 * first, or faster. Below it, a resize from the file is 2.1 to 3.7x slower
 * than a decode then a resize from the pixels, most of it the embedded ICC
 * profile's transform (measured on 4 to 40 megapixel photos).
 */
const JPEG_SHRINK_ON_LOAD = 3;

/**
 * Whether a source is decoded once, so its sizes resize from its pixels
 * instead of its file: when the largest size it makes (the first, the one
 * resized from the source) gains nothing from a scaled decode.
 */
export const decodesFirst = (
  format: string,
  { width, height, settings }: SourcePlan
): boolean => {
  const first = settings.find(({ skipped }) => skipped !== true);
  if (first === undefined) return false;
  return format === 'jpeg' ?
      Math.min(width / first.width, height / first.height) < JPEG_SHRINK_ON_LOAD
    : DECODED_FORMATS.has(format);
};

/** Resolves what a source will give, without resizing anything. */
export const planSource = (
  { width, height, hasAlpha }: SourceInfo,
  settings: readonly OutputSetting[],
  encoders: readonly TargetEncoder[],
  {
    logger,
    resizeStrategyHint,
    upscale,
  }: Pick<ResolvedOptions, 'logger' | 'resizeStrategyHint' | 'upscale'>
): SourcePlan => {
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
 * Runs a file's `beforeFormat` hooks: the sharp object to encode, or
 * undefined to encode the size's image.
 */
type FormatHooks = (
  encoder: Encoder,
  file: string
) => Promise<Sharp | undefined>;

/** Saves a file whose `beforeFormat` hooks may give the image to encode. */
const hookedToFile = async (
  pixels: RawImage,
  file: string,
  encoder: Encoder,
  hasAlpha: boolean,
  beforeFormat: FormatHooks
): Promise<ResultFormat> => {
  let pipeline: Sharp;
  try {
    pipeline = (await beforeFormat(encoder, file)) ?? fromRaw(pixels);
  } catch (error: unknown) {
    return { status: 'failed', format: encoder.format, file, error };
  }
  return sharpToFile(pipeline, file, encoder, hasAlpha);
};

/**
 * Takes an image and saves it to a list of formats, all at the same time:
 * encoding from a decoded image is fast, so running the formats in parallel
 * helps single source speed when threads are available. Every format is
 * attempted and awaited, so no file is written after this resolves. Each
 * format gets its own sharp object over the same pixels, read only: none
 * copies them.
 *
 * @param pixels The image, already resized.
 * @param encoders Formats to write and their options, `'fallback'` resolved
 * once the source tells if it is transparent.
 * @param outputIdentifier Full path to the output file without the extension.
 * @param hasAlpha Whether the image is transparent, see `sharpToFile`.
 * @param logger Receives a debug log per file and an error per failure.
 * @param beforeFormat The `beforeFormat` hooks, if any: a failure fails
 * the file.
 * @returns Promise that fulfills with a list of objects containing metadata
 * about each format and the output file, in the order of the encoders.
 */
export const settingToFormats = async (
  pixels: RawImage,
  encoders: readonly Encoder[],
  outputIdentifier: string,
  hasAlpha: boolean,
  logger: AssetsLogger,
  beforeFormat?: FormatHooks
): Promise<ResultFormat[]> => {
  const results = await Promise.all(
    encoders.map((encoder) => {
      const file = `${outputIdentifier}.${encoder.format}`;
      return beforeFormat === undefined ?
          sharpToFile(fromRaw(pixels), file, encoder, hasAlpha)
        : hookedToFile(pixels, file, encoder, hasAlpha, beforeFormat);
    })
  );

  for (const result of results) {
    if (result.status === 'succeed') {
      const { width, height, size } = result.fileData;
      logger.verbose(
        `Created ${result.file} (${width}x${height}, ${formatBytes(size)})`
      );
    } else logger.error({ file: result.file, error: result.error });
  }

  return results;
};

/** Image the next sizes can be resized from, with its size. */
interface ResizeBase {
  image: Sharp;
  /** Its pixels: a size, or a source its hooks changed. */
  pixels: RawImage | undefined;
  width: number;
  height: number;
  /** A baked buffer of an earlier size, not the source. */
  isBuffer: boolean;
  /** Has the source's aspect ratio, up to the rounding of its size. */
  keepsAspectRatio: boolean;
  hasAlpha: boolean;
}

/** What hooks are told about a size. */
const toHookSetting = ({
  width,
  height,
  sizeMultiplier,
  suffix,
  resizeOptions,
  extractRegion,
}: ResolvedOutputSettings): HookSetting => ({
  width,
  height,
  sizeMultiplier,
  suffix,
  resizeOptions,
  extractRegion,
});

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
 * Hooks run at their points (see `HookPoint`), and the image each point's
 * hooks give is the image from there on, with its size and transparency:
 * a `source` hook's image is planned as the source; after `afterResize`, a
 * size's image is what the next sizes resize from; after `beforeEncode`, it
 * is only what this size's files encode. Points without hooks cost nothing.
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
 * @throws When the source can't be read, a `source` hook fails or the output
 * directory can't be created: nothing was processed.
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
  const { logger, suffix, abortScope, signal, hooks } = context;

  // read once: every size sees the same file, and libvips' file cache never
  // keeps it open (Windows can't change or delete open files)
  const input = await fs.readFile(srcPath);
  // EXIF orientation applied: phone photos are often stored sideways
  const source = sharp(input, { autoOrient: true });
  const read = await readSourceInfo(source);
  // hooks get the file's bytes until a hook gives pixels, decoded at most
  // once for all of them
  let sourceInput: HookInput | undefined;
  const encoded = () => (sourceInput ??= encodedInput(input, read));
  const inputOf = (base: ResizeBase) =>
    base.pixels ? rawInput(base.pixels) : encoded();

  // the image a source hook gives is the source from now on: its size,
  // channels and transparency plan the sizes
  const sourcePixels =
    hooks.source.length > 0 ?
      await runHooks(
        'source',
        hooks.source,
        encoded(),
        { source: srcPath, signal, logger },
        srcPath
      )
    : undefined;
  const info =
    sourcePixels ?
      {
        ...sourcePixels.info,
        hasAlpha: hasAlphaChannel(sourcePixels.info.channels),
      }
    : read;
  const plan = planSource(info, settings, targetEncoders, context);
  const { width: srcWidth, height: srcHeight, encoders } = plan;
  const made = plan.settings.filter(({ skipped }) => skipped !== true).length;
  const skipped = plan.settings.length - made;
  logger.info(
    `Processing ${srcPath} (${srcWidth}x${srcHeight}): ${made} size(s) in ${encoders.length} format(s)${skipped > 0 ? `, ${skipped} skipped as larger than the source` : ''}`
  );
  logger.verbose({ source: srcPath, settings: plan.settings });
  const pixels =
    sourcePixels ??
    (decodesFirst(read.format, plan) ? await bake(source) : undefined);
  if (pixels && !sourcePixels)
    logger.verbose(`Decoded ${srcPath}: its sizes resize from its pixels`);

  /** Encoders of an image: `'fallback'` follows its transparency. */
  const encodersFor = (hasAlpha: boolean) =>
    hasAlpha === plan.hasAlpha ?
      encoders
    : selectEncoders(targetEncoders, hasAlpha);
  /** A hook's pixels as the image a size is resized from. */
  const toBase = (pixels: RawImage, previous: ResizeBase): ResizeBase => {
    const { width, height, channels } = pixels.info;
    return {
      image: fromRaw(pixels),
      pixels,
      width,
      height,
      isBuffer: true,
      keepsAspectRatio:
        width === previous.width && height === previous.height ?
          previous.keepsAspectRatio
        : isMatchingAspectRatio(width, height, srcWidth, srcHeight),
      hasAlpha: hasAlphaChannel(channels),
    };
  };
  const sizeContext = (setting: ResolvedOutputSettings) => ({
    source: srcPath,
    signal,
    logger,
    setting: toHookSetting(setting),
  });

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
    image: pixels ? fromRaw(pixels) : source,
    pixels,
    width: srcWidth,
    height: srcHeight,
    isBuffer: false,
    keepsAspectRatio: true,
    hasAlpha: plan.hasAlpha,
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
    let start =
      setting.generateFromSource || base.width < width || base.height < height ?
        sourceBase
      : base;
    logger.verbose(
      `Resizing ${srcPath} to ${width}x${height} from ${start.isBuffer ? `the ${start.width}x${start.height} buffer` : 'the source'}`
    );
    const label = `${srcPath} at ${width}x${height}`;
    const sizeStart = performance.now();

    let result: ResultSetting;
    try {
      if (hooks.beforeResize.length > 0) {
        const changed = await runHooks(
          'beforeResize',
          hooks.beforeResize,
          inputOf(start),
          sizeContext(setting),
          label
        );
        if (changed) start = toBase(changed, start);
      }

      // same aspect ratio up to rounding: 'cover' would crop a fraction of a
      // pixel, and each size resized from the previous one would add its
      // own, shifting the image (up to 0.1 SSIM lost after a few sizes)
      const fit =
        resizeOptions?.fit ??
        (start.keepsAspectRatio && setting.isMatchingSourceAspectRatio ?
          'fill'
        : undefined);
      // a fresh pipeline per setting: operations never leak to the next one.
      // Over pixels, a new sharp object shares them; clone() would copy them
      const pipeline = (
        start.pixels ?
          fromRaw(start.pixels)
        : start.image.clone()).resize(width, height, {
        ...resizeOptions,
        ...(fit && { fit }),
      });
      if (extractRegion) pipeline.extract(extractRegion);

      const { data, info } = await pipeline
        .raw({ depth: 'uchar' })
        .toBuffer({ resolveWithObject: true });
      let resized: RawImage = {
        data,
        info: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      };
      let next: ResizeBase = {
        image: fromRaw(resized),
        pixels: resized,
        width: info.width,
        height: info.height,
        isBuffer: true,
        keepsAspectRatio:
          setting.isMatchingSourceAspectRatio && extractRegion === undefined,
        hasAlpha: start.hasAlpha,
      };
      if (hooks.afterResize.length > 0) {
        const changed = await runHooks(
          'afterResize',
          hooks.afterResize,
          rawInput(resized),
          sizeContext(setting),
          label
        );
        if (changed) {
          resized = changed;
          next = toBase(changed, next);
        }
      }

      // the chain splits here: what follows changes this size's files only
      let encoded = resized;
      let hasAlpha = next.hasAlpha;
      if (hooks.beforeEncode.length > 0) {
        const changed = await runHooks(
          'beforeEncode',
          hooks.beforeEncode,
          rawInput(resized),
          sizeContext(setting),
          label
        );
        if (changed) {
          encoded = changed;
          hasAlpha = hasAlphaChannel(changed.info.channels);
        }
      }
      const { width: fileWidth, height: fileHeight } = encoded.info;

      const outputIdentifier = `${outputPath}${parseSuffix(
        setting.suffix ?? suffix,
        {
          width: fileWidth,
          height: fileHeight,
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
        encoded,
        encodersFor(hasAlpha),
        outputIdentifier,
        hasAlpha,
        logger,
        hooks.beforeFormat.length > 0 ?
          (encoder, file) =>
            runFormatHooks(
              hooks.beforeFormat,
              rawInput(encoded),
              {
                ...sizeContext(setting),
                format: encoder.format,
                options: encoder.options,
                file,
              },
              file
            )
        : undefined
      );
      result = {
        status: allResultsSucceeded(files) ? 'succeed' : 'failed',
        size: `${fileWidth}x${fileHeight}`,
        files,
      };
      const { written, bytes, failed } = tallyFiles([
        { outputsBySetting: [result] },
      ]);
      logger.debug(
        `${srcPath} at ${result.size}: ${describeFiles(written, bytes)}${failed > 0 ? `, ${failed} failed` : ''} in ${formatDuration(performance.now() - sizeStart)}`
      );

      if (setting.useAsNextResizeIteration) base = next;
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
