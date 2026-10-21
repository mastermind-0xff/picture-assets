import type { SizeMultiplier } from '../types/size.js';

/** `x` and a decimal number: `x1`, `x2.5`, `x.5`. */
const SIZE_MULTIPLIER = /^x(?:\d+(?:\.\d*)?|\.\d+)$/;

/**
 * Check if value is size multiplier in the form of x1, x2, x3.5, x[n>0.0].
 * Only plain decimals: `'x 2'`, `'x0x10'` or `'x1e2'` are not multipliers.
 * @param value
 * @returns Boolean
 */
export const isSizeMultiplier = (value: unknown): value is SizeMultiplier =>
  typeof value === 'string' &&
  SIZE_MULTIPLIER.test(value) &&
  Number(value.slice(1)) > 0;

/**
 * Extract the multiplier from a value in the format of 'x1', 'x2', 'x3.5'
 * and so on.
 * @param value Size multiplier.
 * @returns The multiplier as a number.
 */
export const extractSizeMultiplier = (value: SizeMultiplier): number =>
  Number(value.slice(1));
