// import '../config/environment';

import path from 'path';
import fs from 'fs';

import sharp, {
  AvifOptions,
  GifOptions,
  HeifOptions,
  Jp2Options,
  JpegOptions,
  JxlOptions,
  Metadata,
  OutputOptions,
  PngOptions,
  ResizeOptions,
  Sharp,
  TiffOptions,
  WebpOptions,
} from 'sharp';
import { ImageResizeConfig, SourceMultiplierBehavior } from '../config/main';
import { isSharpFormatEnum } from '../utils/type-guards/isSharpFormatEnum';
import { arrayValuesToKeys } from '../utils/actions/arrayValuesToKeys';
import { parsePath } from '@mmutils/common';
import type {
  ObjectEntries,
  AtLeastOneItem,
  AtLeastOneProperty,
} from '@mmtypes/common';
import { debugMessage } from '../utils/actions/debugMessage';
import {
  assert,
  assertNever,
  isNullish,
  isNumber,
  isUndefined,
} from '@mmutils/assert';

/**
 * List of available output file types and their corresponding options.
 */
export type OutputFormatsOptions = {
  [K in keyof sharp.FormatEnum]: OutputOptions;
} & {
  avif: AvifOptions;
  gif: GifOptions;
  heif: HeifOptions;
  jpeg: JpegOptions;
  jpg: JpegOptions;
  jp2: Jp2Options;
  jxl: JxlOptions;
  png: PngOptions;
  tiff: TiffOptions;
  tif: TiffOptions;
  webp: WebpOptions;
};

/**
 * List of available output file types.
 */
export type OutputFormat = keyof OutputFormatsOptions;

/**
 * Array of output filetype strings or object, containing filetype key and
 * options object as value.
 */
export type AtLeastOneOutputFormat =
  | AtLeastOneItem<(keyof OutputFormatsOptions)[]>
  | AtLeastOneProperty<OutputFormatsOptions>;

/**
 * Source image path and list of output images' paths.
 */
export type ImageAssets = {
  /** Source path */
  in: string;
  /** List of output paths */
  out: string[];
};

/**
 * Image resolution multiplier for width and/or height.
 */
export type SizeMultiplier = 'x1' | 'x2' | 'x3' | 'x4' | 'x5';

/** Fixed pixels or size multiplier. */
export type ResizeResolution = number | SizeMultiplier;

/**
 * Output size options and size file name suffix. Width or height required.
 */
export type OutputSettings = (
  | {
      /** Fixed resolution or resolution multiplier based on source height. */
      width?: ResizeResolution;
      /** Fixed resolution or resolution multiplier based on source width. */
      height: ResizeResolution;
    }
  | {
      width: ResizeResolution;
      height?: ResizeResolution;
    }
) & {
  /** Sharp advanced resize options. */
  options?: ResizeOptions;
  /**
   * File name suffix. Wildcards:\
   * __'{w}'__ for width;\
   * __'{h}'__ for height;\
   * __'{wm}'__ for width's multiplier;\
   * __'{hm}'__ for height's multiplier;\
   * __'{am}'__ for area multiplier;
   *
   * __example:__\
   * // with source at x3 and width: 2048, height: 1536\
   * '@x{am}({w}x{h})' // results in 'some-file@x2(1024x768).webp'
   */
  suffix?: string;
  /** Use source image to generate this size and all formats for it. */
  generateFromSource?: boolean;
  /** Set this size as source for the next size in the chain. */
  useAsNextResizeIteration?: boolean;
};

export type SourceDimensions = { srcWidth: number; srcHeight: number };

export type NormalizedSettings = {
  type: 'absolute' | 'multiplier' | 'crop';
  width?: number;
  height?: number;
  multiplierWidth?: number;
  multiplierHeight?: number;
};

export type ResolvedOutputSettings = Pick<
  OutputSettings,
  'options' | 'suffix' | 'generateFromSource' | 'useAsNextResizeIteration'
> & {
  width: number;
  height: number;
  sizeMultiplier: number;
  widthMultiplier: number;
  heightMultiplier: number;
  aspectRatio: number;
  isMatchingSourceAspectRatio: boolean;
};

export type ParseDimensionsData = {
  width?: number;
  height?: number;
  sizeMultiplier?: number;
  widthMultiplier?: number;
  heightMultiplier?: number;
};

/**
 * Check for user supplied suffix or use the one provided in config object and
 * replace the wildcards if any.
 * @param suffix String to be attached to every file. Defaults to
 * ImageResizeConfig.SUFFIX_DEFAULT.
 * @param dimensionsData Object providing replacement data for all wildcards.
 * Defaults to empty object.
 * @returns The new string suffix.
 */
export const parseSuffix = (
  suffix: string = ImageResizeConfig.SUFFIX_DEFAULT,
  dimensionsData: ParseDimensionsData = {}
) => {
  const { width, height, sizeMultiplier, widthMultiplier, heightMultiplier } =
    dimensionsData;
  const propertiesMap = {
    '{w}': `${width ?? ''}`,
    '{h}': `${height ?? ''}`,
    '{wm}': `${widthMultiplier ?? ''}`,
    '{hm}': `${heightMultiplier ?? ''}`,
    '{sm}': `${sizeMultiplier ?? ''}`,
  };
  return suffix
    .replace(/{\w+}/g, (match) =>
      Object.prototype.hasOwnProperty.call(propertiesMap, match) ?
        `${propertiesMap[match as keyof typeof propertiesMap]}`
      : match
    )
    .replace(/[/\\]+/g, '');
};

/**
 * Extract multiplier from a resolution dimension, if present.
 * @param dimension Width or height to try to extract multiplier from.
 * @returns Integer containing extracted multiplier or undefined if not found.
 */
export const extractResolutionMultiplier = (
  dimension: ResizeResolution | undefined
): number | undefined => {
  let dimensionMultiplier = undefined;

  if (
    dimension != null &&
    typeof dimension === 'string' &&
    dimension.length > 1 &&
    dimension[0] === 'x'
  )
    dimensionMultiplier = parseInt(dimension[1]!);

  return dimensionMultiplier;
};

/**
 * Get the boundaries from width and height properties of the output settings
 * object. If width or height is absolute value, the other is calculated based
 * on source's aspect ratio, if it's a multiplier the other dimension is equal.
 * Resolutions that are not same aspect ration as the source are ignored.
 * @param outputSettings Object containing all widths and heights.
 * @param sourceDimensions Object containing width and height of the source as
 * absolute pixel value.
 * @returns Object containing minimum absolute width or undefined and maximum
 * multiplier (from both width and height) or undefined.
 */
export const findSettingsResolutionBoundaries = (
  outputSettings: OutputSettings[],
  sourceDimensions: SourceDimensions
) => {
  const { srcWidth, srcHeight } = sourceDimensions;
  const srcAspectRatio = srcWidth / srcHeight;

  return outputSettings.reduce<{
    minWidth: number | undefined;
    minHeight: number | undefined;
    maxMultiplier: number | undefined;
  }>(
    (acc, { width, height }) => {
      const wM = extractResolutionMultiplier(width),
        hM = extractResolutionMultiplier(height);

      let extractedWidth =
        isNumber(width) ? width
        : isUndefined(width) && isNumber(height) ? height * srcAspectRatio
        : width;

      let extractedHeight =
        isNumber(height) ? height
        : isUndefined(height) && isNumber(width) ? width * srcAspectRatio
        : height;

      if (isUndefined(extractedWidth) && isNumber(extractedHeight))
        extractedWidth = extractedHeight * srcAspectRatio;

      if (
        isNumber(extractedWidth) &&
        isNumber(extractedHeight) &&
        !isMatchingAspectRatio(
          extractedWidth,
          extractedHeight,
          srcWidth,
          srcHeight
        )
      ) {
        extractedWidth = undefined;
        extractedHeight = undefined;
      }

      return {
        minWidth:
          isNumber(extractedWidth) ?
            Math.min(acc.minWidth ?? Number.MAX_SAFE_INTEGER, extractedWidth)
          : undefined,
        minHeight:
          isNumber(extractedHeight) ?
            Math.min(acc.minHeight ?? Number.MAX_SAFE_INTEGER, extractedHeight)
          : undefined,
        maxMultiplier:
          Math.max(acc.maxMultiplier ?? 0, wM ?? 0, hM ?? 0) || undefined,
      };
    },
    { minWidth: undefined, minHeight: undefined, maxMultiplier: undefined }
  );
};

/**
 * Calculate new width or height or both based on provided multipliers and
 * source's dimension.
 * @param srcDimension Source image dimension in pixels (width or height).
 * @param srcMultiplier Source's multiplier.
 * @param requiredResolutionMultiplier Multiplier for the output image.
 * @returns Calculated resolution as integer, can be undefined.
 */
export const calcResolutionMultiplier = (
  srcDimension: number,
  srcMultiplier: number,
  requiredResolutionMultiplier?: number
): number | undefined => {
  let calcResolution =
    requiredResolutionMultiplier &&
    (srcDimension / srcMultiplier) * requiredResolutionMultiplier;

  return calcResolution;
};

/**
 * Returns mapped source multiplier based on current config, source multiplier
 * behavior and the output settings object. Difference between auto and
 * downsample is that downsample throws if no multipliers are present or there
 * is no lower resolution than source's.
 * @param settings Output settings object.
 * @param sourceDimensions Object containing width and height of the source as
 * absolute pixel value.
 * @param sourceMultiplierBehavior Strategy to try and retrieve source's
 * multiplier.
 * @returns Source's multiplier.
 */
export const retrieveSourceMultiplier = (
  settings: OutputSettings[],
  sourceDimensions: SourceDimensions,
  sourceMultiplierBehavior: SourceMultiplierBehavior
): number => {
  switch (sourceMultiplierBehavior) {
    case 'x1':
    case 'x2':
    case 'x3':
    case 'x4':
    case 'x5':
      return extractResolutionMultiplier(sourceMultiplierBehavior)!;

    case 'auto':
    case 'downsample':
      const { srcWidth } = sourceDimensions;
      const { minWidth, maxMultiplier } = findSettingsResolutionBoundaries(
        settings,
        sourceDimensions
      );
      if (minWidth && minWidth <= srcWidth)
        return Math.round((srcWidth / minWidth) * 100) / 100;

      if (isNumber(maxMultiplier)) return maxMultiplier;

      if (
        sourceMultiplierBehavior === 'downsample' &&
        minWidth &&
        minWidth > srcWidth
      )
        // no multipliers, no lower resolution than source, no way to downsample
        throw new TypeError(
          "Source's multiplier can't be determined based on the settings object."
        );

    case 'upscale':
      return 1;

    default:
      assertNever(
        sourceMultiplierBehavior,
        'Source multiplier behavior not correct.'
      );
  }
};

const sharpBufferToFile = (
  sharpBuffer: Sharp,
  outputFile: string,
  format: OutputFormat,
  formatOptions: OutputFormatsOptions[OutputFormat]
) => {
  const relativeDest = path.dirname(outputFile);

  if (!fs.existsSync(relativeDest)) {
    fs.mkdirSync(relativeDest, { recursive: true });
    debugMessage(`Folder created: ${relativeDest}`, 'notification');
  }
  debugMessage(`File added: ${outputFile}`, 'notification');
  return sharpBuffer.toFormat(format, formatOptions).toFile(outputFile);
};

export const isMatchingAspectRatio = (
  width: number,
  height: number,
  srcWidth: number,
  srcHeight: number
) => Math.abs(width / height - srcWidth / srcHeight) < 0.001;

/**
 * Calculate width, height and all necessary data required for the output files.
 * Optimize the order of the files based on multiplayer behavior to reuse each
 * output as next input.
 * @param settings
 * @param srcMeta
 * @param sourceMultiplierBehavior
 * @returns
 */
export const resolveOutputSettings = (
  settings: OutputSettings[],
  { width: srcWidth, height: srcHeight }: Metadata,
  sourceMultiplierBehavior: SourceMultiplierBehavior
): ResolvedOutputSettings[] => {
  assert(
    srcWidth != null && srcHeight != null,
    "Source's width or height not available."
  );
  const srcMultiplier = retrieveSourceMultiplier(
    settings,
    { srcWidth, srcHeight },
    sourceMultiplierBehavior
  );
  const srcAspectRatio = srcHeight / srcWidth;

  return settings.reduce((acc: ResolvedOutputSettings[], current) => {
    const { width: currentWidth, height: currentHeight } = {
      ...current,
      width: current.options?.width ?? current.width,
      height: current.options?.height ?? current.height,
    };

    // TODO: handle currentWidth is not a multiplier string ('x2'), but a regular string. Throw?
    let resolvedWidth: number =
      isNumber(currentWidth) ? currentWidth
      : !isNullish(currentWidth) ?
        (extractResolutionMultiplier(currentWidth)! / srcMultiplier) * srcWidth
      : 0;

    let resolvedHeight =
      isNumber(currentHeight) ? currentHeight
      : !isNullish(currentHeight) ?
        (extractResolutionMultiplier(currentHeight)! / srcMultiplier) *
        srcHeight
      : 0;

    if (resolvedWidth === 0) resolvedWidth = resolvedHeight * srcAspectRatio;
    if (resolvedHeight === 0) resolvedHeight = resolvedWidth * srcAspectRatio;

    const widthMultiplier = (resolvedWidth / srcWidth) * srcMultiplier;
    const heightMultiplier = (resolvedHeight / srcHeight) * srcMultiplier;
    const aspectRatio =
      Math.round((resolvedWidth / resolvedHeight) * 100) / 100;

    acc.push({
      ...current,
      width: Math.round(resolvedWidth),
      height: Math.round(resolvedHeight),
      sizeMultiplier:
        Math.round(((widthMultiplier + heightMultiplier) / 2) * 1000) / 1000,
      widthMultiplier,
      heightMultiplier,
      aspectRatio: aspectRatio,
      isMatchingSourceAspectRatio:
        Math.abs(aspectRatio - srcAspectRatio) < 0.001,
    });
    return acc;
  }, []);
};

/**
 * Helper function to crunch all files.
 * @param srcPath
 * @param settings
 * @param formats
 * @param outputPath
 * @returns
 */
const resizeFileToFormatsAsync = async (
  srcPath: string,
  settings: OutputSettings[],
  formats: AtLeastOneProperty<OutputFormatsOptions>,
  outputPath: string,
  sourceMultiplierBehavior: SourceMultiplierBehavior
): Promise<string[]> => {
  assert(
    Object.keys(formats).length >= 1,
    'At least one output format is required.'
  );

  const outputFilePaths: string[] = [];
  const srcSharp = sharp(srcPath);

  const sortOrder =
    sourceMultiplierBehavior === 'upscale' ?
      (a: ResolvedOutputSettings, b: ResolvedOutputSettings) =>
        a.sizeMultiplier - b.sizeMultiplier
    : (a: ResolvedOutputSettings, b: ResolvedOutputSettings) =>
        b.sizeMultiplier - a.sizeMultiplier;

  const resolvedSettings = resolveOutputSettings(
    settings,
    await srcSharp.metadata(),
    sourceMultiplierBehavior
  ).sort(sortOrder);
  // TODO: Check if order matters, consider sourceMultiplierBehavior auto mode

  let currentSharpSize = srcSharp;
  for (const currentSetting of resolvedSettings) {
    const {
      suffix,
      width: requiredWidth,
      height: requiredHeight,
      options,
      generateFromSource,
      useAsNextResizeIteration,
    } = currentSetting;

    if (generateFromSource) currentSharpSize = srcSharp;

    const {
      data,
      info: { width, height, channels },
    } = await currentSharpSize
      .resize(requiredWidth, requiredHeight, options)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sharpBufferResized = sharp(data, {
      raw: { width, height, channels },
    });
    if (useAsNextResizeIteration ?? true) currentSharpSize = sharpBufferResized;

    const settingSuffix = parseSuffix(suffix, currentSetting);
    const sharpOutputPromises: Promise<sharp.OutputInfo>[] = [];

    // re-use the buffer to create all formats for this size
    for (const [format, currentFormatOptions] of Object.entries(
      formats
    ) as ObjectEntries<typeof formats>) {
      // runtime fail-safe for Object.entries
      if (!isSharpFormatEnum(format)) continue;

      const outputFile = `${outputPath}${settingSuffix}.${format}`;

      sharpOutputPromises.push(
        sharpBufferToFile(
          sharpBufferResized,
          outputFile,
          format,
          currentFormatOptions
        )
      );
    }
  }
  return outputFilePaths;
};

/**
 * Converts uncertain destination and formats to a reliable data. If a string
 * list of formats is provided it's converted to empty settings formats object.
 * If formats are missing - output's file format is used, if it's also missing -
 * source's file format is used.
 *
 * @param srcPath Source file path.
 * @param destPath Destination file, directory or identifier.
 * @param formats List of output format strings or format-format options
 * key-value pairs. Can be omitted.
 * @returns Object containing output path and at least one format with or
 * without options.
 */
const resolvePathsAndFormats = (
  srcPath: string,
  destPath: string,
  formats?: AtLeastOneOutputFormat
) => {
  const { baseName: srcBaseName, extension: srcExtension } = parsePath(srcPath);
  const {
    basePath: destBasePath,
    baseName: destBaseName,
    extension: destExtension,
    type: destType,
  } = parsePath(destPath);

  const combinedFormats: Partial<OutputFormatsOptions> =
    (Array.isArray(formats) ? arrayValuesToKeys(formats, {}) : formats) || {};

  let outputPath = path.join(destBasePath, destBaseName);

  if (destType === 'file') {
    if (isSharpFormatEnum(destExtension) && !combinedFormats[destExtension]) {
      combinedFormats[destExtension] = {};
    }
  } else {
    outputPath = path.join(
      destBasePath,
      destBaseName,
      destType === 'dir' ? srcBaseName : ''
    );

    if (
      srcExtension &&
      !Object.keys(combinedFormats).length &&
      isSharpFormatEnum(srcExtension) &&
      !combinedFormats[srcExtension]
    ) {
      combinedFormats[srcExtension] = {};
    }
  }
  return {
    outputPath,
    combinedFormats:
      combinedFormats as AtLeastOneProperty<OutputFormatsOptions>,
  };
};

/**
 * Convert a single image source file to a multiple output formats and
 * resolutions. By default, source is considered the highest resolution image.
 *
 * **examples:**
 * ```typescript
 * const result = await imageResizeAsync(
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
 * @param destPath Path to a output file or directory. If extension is present
 * it will be added to the output formats list. If trailing dash is used
 * (destination is a directory) source's file name will be used as destination
 * file name otherwise the string after the last dash will be used as prefix for
 * all settings and formats.
 * @param settings List of objects containing width and/or height,
 * additional "options" param for sharp and file name suffix string. Omit width
 * or height to calculate the other dimension automatically. For performance,
 * quality and to avoid unexpected results, sort resolutions in descending order
 * when downsampling or ascending order when upscaling. Suffix can use '{w}' or
 * '{h}' wildcards for the output file's width and height respectively.
 * @param formats List of strings containing output file formats or object
 * containing format as key and format options (quality, etc.) as values.
 * @returns Resolves to an object containing source file path and generated
 * images' paths list.
 */
export const imageResizeAsync = async (
  srcPath: string,
  destPath: string,
  settings: OutputSettings[],
  formats?: AtLeastOneOutputFormat,
  sourceMultiplierBehavior: SourceMultiplierBehavior = ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR
): Promise<ImageAssets> => {
  const { outputPath, combinedFormats } = resolvePathsAndFormats(
    srcPath,
    destPath,
    formats
  );

  const generatedAssets: ImageAssets = {
    in: srcPath,
    out: await resizeFileToFormatsAsync(
      srcPath,
      settings,
      combinedFormats,
      outputPath,
      sourceMultiplierBehavior
    ),
  };

  return generatedAssets;
};
