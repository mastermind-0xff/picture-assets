import { Metadata } from 'sharp';

import { isObject, isNumber, isUndefined, assert } from '@mmutils/assert';

import { ResizeStrategyHint } from '../types/size';
import { OutputSetting } from '../types/output';
import { isMatchingAspectRatio } from '../utils/helpers';
import { logMessage } from '../log/logger';

import { isSizeMultiplier, extractSizeMultiplier } from './size-multiplier';
import { ExecutionContext } from '../types/execution';

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

export type SourceDimensions = { srcWidth: number; srcHeight: number };

export type ParseDimensionsData = {
  width?: number;
  height?: number;
  sizeMultiplier?: number;
  widthMultiplier?: number;
  heightMultiplier?: number;
};

/**
 * Get the boundaries from width and height properties of the output settings
 * object. If width or height is absolute value, the other is calculated based
 * on source's aspect ratio, if it's a multiplier the other dimension is equal.
 * Resolutions that are not same aspect ratio as the source are ignored.
 * @param outputSettings Object containing all widths and heights.
 * @param sourceDimensions Object containing width and height of the source as
 * absolute pixel value.
 * @returns Object containing minimum absolute width or undefined and maximum
 * multiplier (from both width and height) or undefined.
 */
export const findSettingsResolutionBoundaries = (
  outputSettings: OutputSetting[],
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
        : isUndefined(width) && isNumber(height) ? height * srcAspectRatio
        : width;

      let extractedHeight =
        isNumber(height) ? height
        : isUndefined(height) && isNumber(width) ? width / srcAspectRatio
        : height;

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
 * @returns Source's multiplier as a number, could be float.
 */
export const getSourceMultiplier = (
  settings: OutputSetting[],
  sourceDimensions: SourceDimensions,
  resizeStrategyHint: ResizeStrategyHint,
  executionContext: ExecutionContext
): number => {
  const { logger } = executionContext;
  if (isSizeMultiplier(resizeStrategyHint))
    return extractSizeMultiplier(resizeStrategyHint);

  const { srcWidth, srcHeight } = sourceDimensions;

  if (isObject(resizeStrategyHint)) {
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
 * @param settings
 * @param srcMeta
 * @param resizeStrategyHint
 * @returns Resolved object containing all the missing data from the settings
 * object.
 */
export const resolveOutputSettings = (
  settings: OutputSetting[],
  { width: srcWidth, height: srcHeight }: Metadata,
  resizeStrategyHint: ResizeStrategyHint,
  executionContext: ExecutionContext
): ResolvedOutputSettings[] => {
  assert(
    srcWidth != null && srcHeight != null,
    "Source's width or height not available."
  );
  const srcMultiplier = getSourceMultiplier(
    settings,
    { srcWidth, srcHeight },
    resizeStrategyHint,
    executionContext
  );
  const srcAspectRatio = srcWidth / srcHeight;

  return settings
    .reduce((acc: ResolvedOutputSettings[], current) => {
      const { width: currentWidth, height: currentHeight } = {
        ...current,
        width: current.resizeOptions?.width ?? current.width,
        height: current.resizeOptions?.height ?? current.height,
      };

      // TODO: handle currentWidth is not a multiplier string ('x2'), but a regular string. Throw?
      let resolvedWidth: number =
        isNumber(currentWidth) ? currentWidth
        : isSizeMultiplier(currentWidth) ?
          (extractSizeMultiplier(currentWidth)! / srcMultiplier) * srcWidth
        : 0;

      let resolvedHeight =
        isNumber(currentHeight) ? currentHeight
        : isSizeMultiplier(currentHeight) ?
          (extractSizeMultiplier(currentHeight)! / srcMultiplier) * srcHeight
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
      const isCrop = !!current.extractRegion;

      acc.push({
        useAsNextResizeIteration:
          !isCrop &&
          isMatchingSourceAspectRatio &&
          srcMultiplier >= sizeMultiplier,
        generateFromSource: sizeMultiplier > srcMultiplier,
        ...current,
        width: Math.round(resolvedWidth),
        height: Math.round(resolvedHeight),
        sizeMultiplier,
        widthMultiplier,
        heightMultiplier,
        aspectRatio,
        isMatchingSourceAspectRatio,
      });
      return acc;
    }, [])
    .sort((a, b) => b.sizeMultiplier - a.sizeMultiplier);
};
