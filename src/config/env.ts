import { assertLogLevel } from '@mmutils/logger';

import type { BatchAssetsOptions } from '../types/options.js';
import {
  parseAbortScope,
  parseConcurrency,
  parseFormatOptions,
  parseLimitInputPixels,
  parseRecordLimit,
  parseResizeStrategyHint,
  parseSuffixOption,
} from './validate.js';

/**
 * Environment variables read by `generateAssets`,
 * `generateSingleSourceAssets` and `generateBatchAssets`, for options not
 * given in the call. Each is `PICTURE_ASSETS_` and the option's name, but
 * the logger's: `PICTURE_ASSETS_LOG_LEVEL`, a level. Invalid values throw,
 * naming the variable, instead of being silently replaced by defaults.
 */
export const ENV_VARIABLES = {
  /**
   * `resizeStrategyHint`: `'downsample'`, `'upsample'`, a multiplier
   * (`'x2'`) or what `'x1'` is as JSON (`'{"width":1024,"height":768}'`).
   */
  resizeStrategyHint: 'PICTURE_ASSETS_RESIZE_STRATEGY_HINT',
  /** `suffix`, e.g. `'@{x}x_{w}w'`. */
  suffix: 'PICTURE_ASSETS_SUFFIX',
  /**
   * `formatOptions` as JSON, e.g.
   * `'{"jpeg":{"quality":75},"webp":{"quality":70}}'`.
   */
  formatOptions: 'PICTURE_ASSETS_FORMAT_OPTIONS',
  /** `abortScope`: `'none'`, `'source'` or `'batch'`. */
  abortScope: 'PICTURE_ASSETS_ABORT_SCOPE',
  /** Level of the default logger: `'silent'` to `'verbose'`. */
  logLevel: 'PICTURE_ASSETS_LOG_LEVEL',
  /**
   * `concurrency` of batches: `'auto'`, `'max'` or a number. The machine's
   * setting more than the project's, so a variable suits it.
   */
  concurrency: 'PICTURE_ASSETS_CONCURRENCY',
  /** `limitInputPixels`: a whole number of pixels, or `false`. */
  limitInputPixels: 'PICTURE_ASSETS_LIMIT_INPUT_PIXELS',
  /** `recordLimit`: a whole number of bytes, or `false`. */
  recordLimit: 'PICTURE_ASSETS_RECORD_LIMIT',
} as const;

/** Options an environment variable can set. */
export type EnvOptions = Omit<
  BatchAssetsOptions,
  'upscale' | 'overwriteSource' | 'signal'
>;

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
): EnvOptions => {
  const read = (name: string) => {
    const value = env[name];
    return value === undefined || value.trim() === '' ? undefined : value;
  };
  const options: {
    -readonly [K in keyof EnvOptions]: EnvOptions[K];
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
  if (suffix !== undefined)
    options.suffix = fromVariable(ENV_VARIABLES.suffix, () =>
      parseSuffixOption(suffix)
    );

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

  const concurrency = read(ENV_VARIABLES.concurrency)?.trim();
  if (concurrency !== undefined)
    options.concurrency = fromVariable(ENV_VARIABLES.concurrency, () =>
      parseConcurrency(
        /^\d+$/.test(concurrency) ? Number(concurrency) : concurrency
      )
    );

  /** A limit: digits, or `false` for none. */
  const readLimit = <T>(name: string, parse: (value: unknown) => T) => {
    const limit = read(name)?.trim();
    return limit === undefined ? undefined : (
        fromVariable(name, () =>
          parse(
            limit === 'false' ? false
            : /^\d+$/.test(limit) ? Number(limit)
            : limit
          )
        )
      );
  };

  const limitInputPixels = readLimit(
    ENV_VARIABLES.limitInputPixels,
    parseLimitInputPixels
  );
  if (limitInputPixels !== undefined)
    options.limitInputPixels = limitInputPixels;

  const recordLimit = readLimit(ENV_VARIABLES.recordLimit, parseRecordLimit);
  if (recordLimit !== undefined) options.recordLimit = recordLimit;

  return options;
};
