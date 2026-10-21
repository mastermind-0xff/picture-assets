import { assertLogLevel } from '@mmutils/logger';

import type { ImageResizeOptions } from '../types/options.js';
import {
  parseAbortScope,
  parseFormatOptions,
  parseResizeStrategyHint,
} from './validate.js';

/**
 * Environment variables read by `imageResize` and `batchImageResize`, for
 * options not given in the call. Invalid values throw, naming the variable,
 * instead of being silently replaced by defaults.
 */
export const ENV_VARIABLES = {
  /**
   * `resizeStrategyHint`: `'downsample'`, `'upsample'`, a multiplier
   * (`'x2'`) or what `'x1'` is as JSON (`'{"width":1024,"height":768}'`).
   */
  resizeStrategyHint: 'IMAGE_RESIZE_RESIZE_STRATEGY_HINT',
  /** `suffix`, e.g. `'@x{sm}_{w}w'`. */
  suffix: 'IMAGE_RESIZE_SUFFIX',
  /**
   * `formatOptions` as JSON, e.g.
   * `'{"jpeg":{"quality":75},"webp":{"quality":70}}'`.
   */
  formatOptions: 'IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS',
  /** `abortScope`: `'none'`, `'source'` or `'batch'`. */
  abortScope: 'IMAGE_RESIZE_ABORT_SCOPE',
  /** Level of the default logger: `'silent'` to `'verbose'`. */
  logLevel: 'IMAGE_RESIZE_LOG_LEVEL',
} as const;

const parseJson = (name: string, value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new SyntaxError(`${name} is not valid JSON: ${value}`, {
      cause: error,
    });
  }
};

/** Prefixes validation errors with the variable's name. */
const fromVariable = <T>(name: string, parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    if (error instanceof Error && !(error instanceof SyntaxError))
      error.message = `${name}: ${error.message}`;
    throw error;
  }
};

/**
 * Reads the options set by environment variables. Unset and empty variables
 * are left out.
 *
 * @param env Variables to read. Default: `process.env`.
 * @throws TypeError, RangeError or SyntaxError naming the variable with an
 * invalid value.
 */
export const readEnvOptions = (
  env: NodeJS.ProcessEnv = process.env
): ImageResizeOptions => {
  const read = (name: string) => {
    const value = env[name];
    return value === undefined || value.trim() === '' ? undefined : value;
  };
  const options: {
    -readonly [K in keyof ImageResizeOptions]: ImageResizeOptions[K];
  } = {};

  const hint = read(ENV_VARIABLES.resizeStrategyHint);
  if (hint !== undefined)
    options.resizeStrategyHint = fromVariable(
      ENV_VARIABLES.resizeStrategyHint,
      () =>
        parseResizeStrategyHint(
          hint.trim().startsWith('{') ?
            parseJson(ENV_VARIABLES.resizeStrategyHint, hint)
          : hint.trim()
        )
    );

  const suffix = env[ENV_VARIABLES.suffix];
  if (suffix !== undefined) options.suffix = suffix;

  const formatOptions = read(ENV_VARIABLES.formatOptions);
  if (formatOptions !== undefined)
    options.formatOptions = fromVariable(ENV_VARIABLES.formatOptions, () =>
      parseFormatOptions(parseJson(ENV_VARIABLES.formatOptions, formatOptions))
    );

  const abortScope = read(ENV_VARIABLES.abortScope);
  if (abortScope !== undefined)
    options.abortScope = fromVariable(ENV_VARIABLES.abortScope, () =>
      parseAbortScope(abortScope.trim())
    );

  const logLevel = read(ENV_VARIABLES.logLevel)?.trim();
  if (logLevel !== undefined)
    options.logger = fromVariable(ENV_VARIABLES.logLevel, () => {
      assertLogLevel(logLevel);
      return logLevel;
    });

  return options;
};
