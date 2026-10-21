import { SizeMultiplier } from '../types/size';

/**
 * Check if value is size multiplier in the form of x1, x2, x3.5, x[n>0.0].
 * @param value
 * @returns Boolean
 */
export const isSizeMultiplier = (value: unknown): value is SizeMultiplier => {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('x')) return false;

  const num = Number(value.slice(1));
  return Number.isFinite(num) && num > 0;
};

/**
 * Extract a multiplier from a value if it has the format of 'x1', 'x2', 'x3.5'
 * and so on.
 * @param value Value to try to extract multiplier from.
 * @returns Number containing extracted multiplier or undefined if not found.
 */
export const extractSizeMultiplier = (value: SizeMultiplier): number => {
  return Number(value.slice(1));
};
