import type { AssetsLogger } from '../log/logger.js';
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
    /** Not made: larger than the source, with `upscale: false`. */
    skipped?: boolean;
  };

export interface SourceDimensions {
  srcWidth: number;
  srcHeight: number;
}

const isNumber = (value: unknown): value is number => typeof value === 'number';

/**
 * The smallest size in pixels and the largest multiplier of the settings,
 * for `'downsample'`. A size in pixels given by its width or its height
 * alone gets the other from the source's aspect ratio; sizes in pixels of
 * another aspect ratio are left out.
 * @param outputSettings The settings, as given.
 * @param sourceDimensions Size of the source, in pixels.
 * @returns The smallest width and height in pixels, and the largest
 * multiplier of a width or a height: each undefined when no size has one.
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
 * The source's multiplier, from the settings, the source's size and the
 * hint (see `ResizeStrategyHint`):
 *
 * - `'downsample'`: the source's width over the smallest width in pixels
 *   with its aspect ratio, when that width is not larger than the source;
 *   else the largest multiplier; else 1, with a warning.
 * - `'upsample'`: 1.
 * - a multiplier, `'x2'`: that multiplier.
 * - `{ width, height }`: what makes `'x1'` cover that size.
 * @param settings The settings, as given.
 * @param sourceDimensions Size of the source, in pixels.
 * @param resizeStrategyHint What `'x1'` is.
 * @param logger Receives a warning when downsampling isn't possible.
 * @returns The source's multiplier, not rounded.
 */
export const getSourceMultiplier = (
  settings: readonly OutputSetting[],
  sourceDimensions: SourceDimensions,
  resizeStrategyHint: ResizeStrategyHint,
  logger: AssetsLogger
): number => {
  if (isSizeMultiplier(resizeStrategyHint))
    return extractSizeMultiplier(resizeStrategyHint);

  const { srcWidth, srcHeight } = sourceDimensions;

  if (typeof resizeStrategyHint === 'object') {
    // get the multiplier that can satisfy both width and height and will match
    // aspect ratio of the x1 resolution; not rounded: sizes derive from it
    return Math.min(
      srcWidth / resizeStrategyHint.width,
      srcHeight / resizeStrategyHint.height
    );
  }

  if (resizeStrategyHint === 'downsample') {
    const { minWidth, maxMultiplier } = findSettingsResolutionBoundaries(
      settings,
      sourceDimensions
    );
    if (minWidth && minWidth <= srcWidth) return srcWidth / minWidth;

    if (isNumber(maxMultiplier)) return maxMultiplier;

    logger.warning(
      `Unable to downsample with current config. Source multiplier set to 1.`
    );
  }

  return 1;
};

/**
 * Resolves each setting's size in pixels, its multipliers and where it is
 * resized from: `generateFromSource` and `useAsNextResizeIteration` get
 * their defaults (see `OutputSetting`).
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
  logger: AssetsLogger
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

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Keeps the sizes from being larger than the source, for `upscale: false`:
 * those larger in width or height are skipped, except the largest of them,
 * made at the largest size with its aspect ratio that fits in the source
 * (the source's own size for the same aspect ratio), unless another setting
 * already has that size. So the largest output keeps every pixel of the
 * source. Crops larger than the source are skipped: their region is
 * relative to their size.
 *
 * @param settings Resolved settings, from the largest.
 * @param sourceDimensions Size of the source, as shown.
 */
export const limitToSource = (
  settings: readonly ResolvedOutputSettings[],
  { srcWidth, srcHeight }: SourceDimensions
): ResolvedOutputSettings[] => {
  const fits = ({ width, height }: ResolvedOutputSettings) =>
    width <= srcWidth && height <= srcHeight;
  const fitting = settings.filter(fits);
  let replaced = false;

  return settings.map((setting) => {
    if (fits(setting)) return setting;
    if (replaced || setting.extractRegion) return { ...setting, skipped: true };
    replaced = true;
    const factor = Math.min(
      srcWidth / setting.width,
      srcHeight / setting.height
    );
    const width = Math.max(1, Math.round(setting.width * factor));
    const height = Math.max(1, Math.round(setting.height * factor));
    if (
      fitting.some((other) => other.width === width && other.height === height)
    )
      return { ...setting, skipped: true };
    return {
      ...setting,
      width,
      height,
      widthMultiplier: round3(setting.widthMultiplier * factor),
      heightMultiplier: round3(setting.heightMultiplier * factor),
      sizeMultiplier: round3(setting.sizeMultiplier * factor),
      generateFromSource: true,
      // the most detailed size: the best base for the next ones
      useAsNextResizeIteration: setting.isMatchingSourceAspectRatio,
    };
  });
};
