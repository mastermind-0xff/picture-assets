import { SizeMultiplier } from '../../lib/image-resize';

/**
 * Check if value is size multiplier.
 * @param value
 * @returns Boolean
 */
export const isSizeMultiplier = (value: unknown): value is SizeMultiplier => {
  if (
    typeof value === 'string' &&
    value.length === 2 &&
    value[0] === 'x' &&
    parseInt(value[1]!) > 0
  ) {
    return true;
  }
  return false;
};
