import {
  graphPlugin,
  Logger,
  messagePlugin,
  shouldLog,
  type GraphSettings,
  type LogLevel,
  type LogType,
} from '@mmutils/logger';

/**
 * What the library logs through: a `@mmutils/logger` `Logger` with the
 * message plugin, or any object with these methods. Messages are strings or
 * plain objects (each property on its own line).
 */
export interface AssetsLogger {
  error(data: string | object): void;
  warning(data: string | object): void;
  info(data: string | object): void;
  debug(data: string | object): void;
  verbose(data: string | object): void;

  /**
   * Draws a bar graph at debug level: the batch's CPU, memory and progress.
   * Optional: without it, the batch takes no performance probes.
   */
  debugGraph?(values: readonly number[], settings?: GraphSettings): void;

  /**
   * Current level. Optional: when present, work done only for filtered logs
   * (the batch's probes) is skipped.
   */
  readonly level?: LogLevel;
}

/**
 * Creates the default logger: `@mmutils/logger` with the message and graph
 * plugins, timestamps to the millisecond: a hook's start and end logs tell
 * its time.
 *
 * @param level Lowest level to output, from `'silent'` to `'verbose'`.
 */
export const createLogger = (level: LogLevel): AssetsLogger =>
  new Logger({
    level,
    timestamp: 'YYYY/MM/DD HH:mm:ss.SSS',
    plugins: [messagePlugin(), graphPlugin()],
  });

/**
 * Whether a log of the given type would be output. Loggers without a level
 * are assumed to output everything.
 */
export const isLogging = (logger: AssetsLogger, type: LogType) =>
  logger.level === undefined || shouldLog(type, logger.level);
