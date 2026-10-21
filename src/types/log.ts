/**
 * Supported logging levels, ordered from lowest verbosity ('silent')
 * to highest verbosity ('verbose').
 *
 * These levels control which messages are emitted based on the
 * configured minimum log level.
 */
export type LogLevel =
  | 'silent'
  | 'fatal'
  | 'error'
  | 'warning'
  | 'info'
  | 'debug'
  | 'trace'
  | 'verbose';

/** Actual message type. Excludes `'silent'` as this level has no output. */
export type LogMessageType = Exclude<LogLevel, 'silent'>;
