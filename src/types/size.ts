/** Image resolution multiplier: `'x1'`, `'x2'`, `'x1.5'`. */
export type SizeMultiplier = `x${number}`;

/** Fixed pixels or size multiplier. */
export type ResizeResolution = number | SizeMultiplier;

/**
 * What `'x1'` is, so multipliers can be turned into pixels:
 *
 * - `'downsample'`: inferred from the sizes. The smallest size in pixels
 *   (with the source's aspect ratio, not larger than the source) is `'x1'`;
 *   without one, the source is the largest multiplier (`'x1'` without
 *   multipliers).
 * - `'upsample'`: the source is `'x1'`; larger multipliers are enlarged.
 * - a multiplier, `'x2'`: the source is that multiplier.
 * - `{ width, height }`: `'x1'` is that size, whatever the source's; for
 *   another aspect ratio, the smallest size with the source's that covers it.
 */
export type ResizeStrategyHint =
  | 'downsample'
  | 'upsample'
  | SizeMultiplier
  | { readonly width: number; readonly height: number };
