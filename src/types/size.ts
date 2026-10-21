/** Image resolution multiplier. */
export type SizeMultiplier = `x${number}`;

/** Fixed pixels or size multiplier. */
export type ResizeResolution = number | SizeMultiplier;

/**
 * Hints what source image's multiplier is, or what `'x1'` is.
 *
 * - `'downsample'` - Source has the highest resolution.
 * - `'upsample'` - Source has the lowest resolution.
 * - `'x${number}'` - Source multiplier is hardcoded.
 * - `{ width: number; height: number }` - Tells what `'x1'` resolution is.
 */
export type ResizeStrategyHint =
  | 'downsample'
  | 'upsample'
  | SizeMultiplier
  | { width: number; height: number };
