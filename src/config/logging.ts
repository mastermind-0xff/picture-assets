import { LogLevel } from '../types/log';
import { LogLevels } from '../global-enums/main';

const DEFAULT_LOG_LEVEL: LogLevel = 'info';

export const LOG_LEVEL: LogLevel = (() => {
  const envValue = process?.env?.IMAGE_RESIZE_LOG_LEVEL;
  if (envValue != null && Object.hasOwnProperty.call(LogLevels, envValue))
    return envValue as LogLevel;

  return DEFAULT_LOG_LEVEL;
})();
