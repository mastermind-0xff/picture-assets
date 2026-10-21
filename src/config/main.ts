import type { ResizeStrategyHint } from '../types/size';
import type { LogLevel } from '../types/log';
import type { OutputFormatsOptions } from '../types/output';

import { outputFormatsOptions } from './output-formats';
import { resizeStrategyHint } from './resize-strategy';
import { abortScope } from './abort-strategy';
import { suffix } from './suffix';
import { LOG_LEVEL } from './logging';
import { ExecutionScope } from '../types/execution';

export type ImageResizeOptions = {
  /**
   * Default format output options for each filetype.
   *
   * Can be overridden by the environment variable
   * `IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS` at runtime initialization.
   *
   * @default `outputFormatsOptionsDefault`
   */
  readonly outputFormatsOptions: OutputFormatsOptions;

  /**
   * Default resize strategy for all images.
   *
   * Can be overridden by the environment variable
   * `IMAGE_RESIZE_RESIZE_STRATEGY_HINT` at runtime initialization.
   *
   * @default 'downsample'
   */
  readonly resizeStrategyHint: ResizeStrategyHint;

  /**
   * Default abort execution level in case of an error.
   *
   * Can be overridden by the environment variable
   * `IMAGE_RESIZE_ABORT_SCOPE` at runtime initialization.
   *
   * @default 'format'
   */
  readonly abortScope: ExecutionScope;

  /**
   * Default suffix for all outputted file names.
   *
   * Can be overridden by the environment variable `IMAGE_RESIZE_SUFFIX_DEFAULT`
   * at runtime initialization.
   *
   * @default '@{w}w'
   */
  readonly suffix: string;

  /**
   * Default log level. Controls what level and above will be emitted to the
   * output.
   *
   * Can be overridden by the environment variable`IMAGE_RESIZE_LOG_LEVEL` at
   * runtime initialization.
   *
   * @default string 'info'
   */
  readonly logLevel: LogLevel;
};

const logLevel = LOG_LEVEL;

/**
 * Read only defaults configuration object. Default values can be alter at
 * runtime initialization via environment variables.
 *
 * - Provides default output format options for all images;
 * - Provides default suffix for all images;
 * - Provides default resize strategy hint for all images;
 * - Provides default logging level.
 */
export const ImageResizeConfig: ImageResizeOptions = {
  outputFormatsOptions,
  suffix,
  resizeStrategyHint,
  abortScope,
  logLevel,
};
