import { ResultStatus } from '../types/output';
import { ExecutionScope } from '../types/execution';
import { LogLevel } from '../types/log';

/**
 * Numeric expression of the execution scopes that brings weight to the scope.
 *
 * Ordered from the single unit of work (lowest value) to the collective
 * (highest value) effort of actions.
 */
export const ExecutionScopes = {
  format: 100,
  setting: 200,
  source: 300,
  batch: 400,
  none: 500,
} as const satisfies Record<ExecutionScope | 'none', number>;

/**
 * Numeric expression of the log levels that creates linear level of output.
 *
 * The lowest the value, the less the output.
 */
export const LogLevels = {
  silent: 100,
  fatal: 200,
  error: 300,
  warning: 400,
  info: 500,
  debug: 600,
  trace: 700,
  verbose: 800,
} as const satisfies Record<LogLevel, number>;

/** Enum encapsulating possible output result completion types. */
export const ResultStatuses = {
  succeed: 'image_resize_status_succeed',
  failed: 'image_resize_status_failed',
  aborted: 'image_resize_status_aborted',
} as const satisfies Record<ResultStatus, string>;
