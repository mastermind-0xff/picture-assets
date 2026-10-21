import type { ImageAssetsLogger } from '../log/logger.js';
import type { OutputSetting } from '../types/output.js';
import type { ResizeStrategyHint } from '../types/size.js';
import { isMatchingAspectRatio } from '../utils/helpers.js';
import { extractSizeMultiplier, isSizeMultiplier } from './size-multiplier.js';

/**
 * Full data for the output. Width and height are calculated.
 */
export type ResolvedOutputSettings = Required<
  Pick<OutputSetting, 'generateFromSource' | 'useAsNextResizeIteration'>
> &
  Pick<OutputSetting, 'resizeOptions' | 'extractRegion' | 'suffix'> & {
    width: number;
    height: number;
    sizeMultiplier: number;
    widthMultiplier: number;
    heightMultiplier: number;
    aspectRatio: number;
    isMatchingSourceAspectRatio: boolean;
  };

export interface SourceDimensions {
  srcWidth: number;
  srcHeight: number;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number';

/**
 * Get the boundaries from width and height properties of the output settings
 * object. If width or height is absolute value, the other is calculated based
 * on source's aspect ratio, if it's a multiplier the other dimension is equal.
 * Resolutions that are not same aspect ratio as the source are ignored.
 * @param outputSettings Object containing all widths and heights.
 * @param sourceDimensions Object containing width and height of the source as
 * absolute pixel value.
 * @returns Object containing minimum absolute width and height or undefined
 * and maximum multiplier (from both width and height) or undefined.
 */
export const findSettingsResolutionBoundaries = (
  outputSettings: readonly OutputSetting[],
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
      const wM =
          isSizeMultiplier(width) ? extractSizeMultiplier(width) : undefined,
        hM =
          isSizeMultiplier(height) ? extractSizeMultiplier(height) : undefined;

      let extractedWidth =
        isNumber(width) ? width
        : width === undefined && isNumber(height) ? height * srcAspectRatio
        : undefined;

      let extractedHeight =
        isNumber(height) ? height
        : height === undefined && isNumber(width) ? width / srcAspectRatio
        : undefined;

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
          : acc.minWidth,
        minHeight:
          isNumber(extractedHeight) ?
            Math.min(acc.minHeight ?? Number.MAX_SAFE_INTEGER, extractedHeight)
          : acc.minHeight,
        maxMultiplier:
          Math.max(acc.maxMultiplier ?? 0, wM ?? 0, hM ?? 0) || undefined,
      };
    },
    { minWidth: undefined, minHeight: undefined, maxMultiplier: undefined }
  );
};

/**
 * Returns mapped source multiplier based on the output settings object,
 * source's dimensions and the resize hint.
 * @param settings Output settings object.
 * @param sourceDimensions Object containing width and height of the source as
 * absolute pixel value.
 * @param resizeStrategyHint Strategy to retrieve source's multiplier.\
 * **'downsample'** - Source is the highest resolution - the lowest resolution
 * that is lower than source's is `'x1'` or the highest multiplier is source's
 * multiplier.\
 * **'upsample'** - Source is lowest resolution - shorthand for source's
 * multiplier equals x1.\
 * **\`x${number}\`** - Source multiplier is known - 'x1', 'x2', 'x3.5' etc.\
 * **{ width: number; height: number }** - tells what x1 resolution is.
 * @param logger Receives a warning when downsampling isn't possible.
 * @returns Source's multiplier as a number, could be float.
 */
export const getSourceMultiplier = (
  settings: readonly OutputSetting[],
  sourceDimensions: SourceDimensions,
  resizeStrategyHint: ResizeStrategyHint,
  logger: ImageAssetsLogger
): number => {
  if (isSizeMultiplier(resizeStrategyHint))
    return extractSizeMultiplier(resizeStrategyHint);

  const { srcWidth, srcHeight } = sourceDimensions;

  if (typeof resizeStrategyHint === 'object') {
    // get the multiplier that can satisfy both width and height and will match
    // aspect ratio of the x1 resolution
    return (
      Math.round(
        Math.min(
          srcWidth / resizeStrategyHint.width,
          srcHeight / resizeStrategyHint.height
        ) * 100
      ) / 100
    );
  }

  if (resizeStrategyHint === 'downsample') {
    const { minWidth, maxMultiplier } = findSettingsResolutionBoundaries(
      settings,
      sourceDimensions
    );
    if (minWidth && minWidth <= srcWidth)
      return Math.round((srcWidth / minWidth) * 100) / 100;

    if (isNumber(maxMultiplier)) return maxMultiplier;

    logger.warning(
      `Unable to downsample with current config. Source multiplier set to 1.`
    );
  }

  return 1;
};

/**
 * Calculate width, height, multipliers and resolve all necessary data required
 * for the output files.
 * @param settings Valid output settings.
 * @param sourceDimensions Size of the source, as displayed (auto-oriented).
 * @param resizeStrategyHint What the source's multiplier is, see
 * `getSourceMultiplier`.
 * @param logger Receives a warning when downsampling isn't possible.
 * @returns Resolved object containing all the missing data from the settings
 * object, ordered from the largest size to the smallest.
 */
export const resolveOutputSettings = (
  settings: readonly OutputSetting[],
  sourceDimensions: SourceDimensions,
  resizeStrategyHint: ResizeStrategyHint,
  logger: ImageAssetsLogger
): ResolvedOutputSettings[] => {
  const { srcWidth, srcHeight } = sourceDimensions;
  const srcMultiplier = getSourceMultiplier(
    settings,
    sourceDimensions,
    resizeStrategyHint,
    logger
  );
  const srcAspectRatio = srcWidth / srcHeight;

  return settings
    .map((current): ResolvedOutputSettings => {
      const { width: currentWidth, height: currentHeight } = current;

      let resolvedWidth =
        isNumber(currentWidth) ? currentWidth
        : isSizeMultiplier(currentWidth) ?
          (extractSizeMultiplier(currentWidth) / srcMultiplier) * srcWidth
        : 0;

      let resolvedHeight =
        isNumber(currentHeight) ? currentHeight
        : isSizeMultiplier(currentHeight) ?
          (extractSizeMultiplier(currentHeight) / srcMultiplier) * srcHeight
        : 0;

      if (resolvedWidth === 0) resolvedWidth = resolvedHeight * srcAspectRatio;
      if (resolvedHeight === 0) resolvedHeight = resolvedWidth / srcAspectRatio;

      const widthMultiplier =
        Math.round((resolvedWidth / srcWidth) * srcMultiplier * 1000) / 1000;
      const heightMultiplier =
        Math.round((resolvedHeight / srcHeight) * srcMultiplier * 1000) / 1000;
      const sizeMultiplier =
        Math.round(((widthMultiplier + heightMultiplier) / 2) * 1000) / 1000;
      const aspectRatio =
        Math.round((resolvedWidth / resolvedHeight) * 1000) / 1000;
      const isMatchingSourceAspectRatio =
        Math.abs(aspectRatio - srcAspectRatio) < 0.001;
      const isCrop = current.extractRegion !== undefined;

      return {
        // sharp needs whole pixels, at least one
        width: Math.max(1, Math.round(resolvedWidth)),
        height: Math.max(1, Math.round(resolvedHeight)),
        sizeMultiplier,
        widthMultiplier,
        heightMultiplier,
        aspectRatio,
        isMatchingSourceAspectRatio,
        generateFromSource:
          current.generateFromSource ?? sizeMultiplier > srcMultiplier,
        useAsNextResizeIteration:
          current.useAsNextResizeIteration ??
          (!isCrop &&
            isMatchingSourceAspectRatio &&
            srcMultiplier >= sizeMultiplier),
        ...(current.resizeOptions && { resizeOptions: current.resizeOptions }),
        ...(current.extractRegion && { extractRegion: current.extractRegion }),
        ...(current.suffix !== undefined && { suffix: current.suffix }),
      };
    })
    .sort((a, b) => b.sizeMultiplier - a.sizeMultiplier);
};
