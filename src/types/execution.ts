import { Logger } from '../log/logger';
import { ResizeStrategyHint } from './size';

/**
 * Available execution levels.
 */
export type ExecutionScope = 'batch' | 'source' | 'setting' | 'format';

/**
 * Execution context for the image processing pipeline.
 *
 * Carries cross‑cutting operational settings such as a pre-configured logger,
 * resize behavior, current level of execution (scope) and abort execution level
 * throughout the entire pipeline.
 * These values remain constant for the duration of the execution with the
 * exception of the execution scope. At each level the execution context should
 * be shadowed with the same version but with the new execution scope.
 *
 * **properties:**
 * - `logger` - ready to use, pre-configured, factory instance of the logging
 * function.
 * - `resizeStrategyHint` - Tells what source image's multiplier is, or what
 * `'x1'` resolution is.
 * - `executionScope` - Current level of execution depth.
 * - `abortScope` - At what level should the process halt and exit in case of an
 * error.
 */
export type ExecutionContext = {
  /**
   * Execution-scoped logger with convenience methods for each log level.
   *
   * All logging methods accept the same `message` format:
   * - a string
   * - an object (each property printed on a new line)
   * - an array (each item printed on a new line)
   *
   * An optional `title` may be provided to prefix the message with a styled
   * title for clarity.
   */
  readonly logger: Logger;
  /**
   * Hints what source image's multiplier is, or what 'x1' is.
   */
  readonly resizeStrategyHint: ResizeStrategyHint;
  /**
   * Current execution level.
   */
  readonly executionScope: ExecutionScope;
  /**
   * Abort execution level in case of an error.
   */
  readonly abortScope: ExecutionScope;
};
