import { isNumber } from '@mmutils/assert';
import { isSizeMultiplier } from '../image/size-multiplier';
import { logMessage } from '../log/logger';
import { LOG_LEVEL } from './logging';
import { ResizeStrategyHint } from '../types/size';

const DEFAULT_RESIZE_STRATEGY_HINT: ResizeStrategyHint = 'downsample';

export const resizeStrategyHint: ResizeStrategyHint = (() => {
  const envValue = process?.env?.IMAGE_RESIZE_RESIZE_STRATEGY_HINT;
  if (envValue == null) return DEFAULT_RESIZE_STRATEGY_HINT;
  if (isSizeMultiplier(envValue)) return envValue;
  if (envValue === 'upsample') return 'upsample';
  if (envValue === 'downsample') return 'downsample';

  try {
    const json = JSON.parse(envValue);
    if (isNumber(json.width) && isNumber(json.height)) {
      const { width, height } = json;
      return { width, height };
    }
  } catch (e) {
    logMessage(
      'error',
      { hint: envValue, e },
      `Unable to parse RESIZE_STRATEGY_HINT json.`,
      LOG_LEVEL
    );
  }

  logMessage(
    'warning',
    `Defaulting to 'downsample'.`,
    'Unknown config for RESIZE_STRATEGY_HINT',
    LOG_LEVEL
  );

  return DEFAULT_RESIZE_STRATEGY_HINT;
})();
