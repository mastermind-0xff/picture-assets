import { isSizeMultiplier } from '../image/size-multiplier.js';
import type { OutputFormats, OutputSetting } from '../types/output.js';
import type { SizeMultiplier } from '../types/size.js';
import { assertSettings, describe } from './validate.js';

/**
 * Sizes presets.
 * - `responsive`: the widths of a typical srcset, for images shown at any
 *   width, from 2560 down to 320 pixels.
 *
 * Sizes for an image shown at a fixed size are its multipliers, as short
 * as a preset: `['x3', 'x2', 'x1']`.
 */
export const SIZE_PRESETS = {
  responsive: [2560, 1920, 1280, 960, 640, 320],
} as const satisfies Record<string, readonly (number | SizeMultiplier)[]>;

export type SizePreset = keyof typeof SIZE_PRESETS;

/**
 * Formats presets.
 * - `web`: AVIF, WebP and a fallback for older browsers: JPEG, or PNG for
 *   transparent sources.
 * - `modern`: AVIF and WebP.
 * - `lossless`: lossless WebP and PNG.
 */
export const FORMAT_PRESETS = {
  web: ['avif', 'webp', 'fallback'],
  modern: ['avif', 'webp'],
  lossless: { webp: { lossless: true }, png: {} },
} as const satisfies Record<string, OutputFormats>;

export type FormatPreset = keyof typeof FORMAT_PRESETS;

/**
 * Sizes: a preset, or a list of widths in pixels (`1280`), width
 * multipliers (`'x2'`) and settings. A width or a multiplier is a setting
 * with only its width: the run's suffix names its files, as any setting
 * without its own.
 */
export type SizesInput =
  SizePreset | readonly (number | SizeMultiplier | OutputSetting)[];

/** Formats: a preset, or formats as `generateSingleSourceAssets` takes them. */
export type FormatsInput = FormatPreset | OutputFormats;

export const isSizePreset = (value: unknown): value is SizePreset =>
  typeof value === 'string' && Object.hasOwn(SIZE_PRESETS, value);

export const isFormatPreset = (value: unknown): value is FormatPreset =>
  typeof value === 'string' && Object.hasOwn(FORMAT_PRESETS, value);

/**
 * Turns sizes into settings: presets expanded, widths and multipliers into
 * `{ width }` settings.
 *
 * @throws TypeError for unknown presets and invalid sizes.
 */
export const expandSizes = (sizes: unknown): OutputSetting[] => {
  if (typeof sizes === 'string' && !isSizePreset(sizes))
    throw new TypeError(
      `Unknown sizes preset ${describe(sizes)}: expected ${Object.keys(SIZE_PRESETS).map(describe).join(', ')}, or a list of sizes.`
    );
  const list: unknown = isSizePreset(sizes) ? SIZE_PRESETS[sizes] : sizes;
  if (!Array.isArray(list))
    throw new TypeError(
      `Sizes must be a preset or a list like [1920, 1280, 'x2'], got ${describe(sizes)}.`
    );
  const settings = list.map((size: unknown) =>
    typeof size === 'number' || isSizeMultiplier(size) ? { width: size } : size
  );
  assertSettings(settings);
  return [...settings];
};

/**
 * Turns formats into what `generateSingleSourceAssets` takes: presets
 * expanded, the rest as is (checked when used).
 *
 * @throws TypeError for unknown presets.
 */
export const expandFormats = (formats: unknown): unknown => {
  if (isFormatPreset(formats)) return FORMAT_PRESETS[formats];
  if (typeof formats === 'string')
    throw new TypeError(
      `Unknown formats preset ${describe(formats)}: expected ${Object.keys(FORMAT_PRESETS).map(describe).join(', ')}, or a list of formats.`
    );
  return formats;
};
