import type { GraphSettings, LogLevel, LogType } from '@mmutils/logger';
import { vi } from 'vitest';

import type { ImageAssetsLogger } from '../log/logger.js';

export interface LogRecord {
  type: LogType;
  data: string | object;
}

/**
 * A logger that records every log instead of printing it.
 *
 * @param level Level reported to the library, which skips work for filtered
 * logs. Every log is recorded anyway.
 */
export const createRecordingLogger = (level: LogLevel = 'verbose') => {
  const logs: LogRecord[] = [];
  const record = (type: LogType) => (data: string | object) => {
    logs.push({ type, data });
  };
  const logger = {
    level,
    error: record('error'),
    warning: record('warning'),
    info: record('info'),
    debug: record('debug'),
    verbose: record('verbose'),
    debugGraph:
      vi.fn<(values: readonly number[], settings?: GraphSettings) => void>(),
  } satisfies ImageAssetsLogger;

  /** Text logs of a type. */
  const messages = (type: LogType) =>
    logs.flatMap((log) =>
      log.type === type && typeof log.data === 'string' ? [log.data] : []
    );

  return { logger, logs, messages };
};
