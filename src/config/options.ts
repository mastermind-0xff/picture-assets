import { groupHooks, type ResolvedHooks } from '../image/hooks.js';
import { createLogger, type AssetsLogger } from '../log/logger.js';
import type {
  AbortScope,
  Concurrency,
  AssetsOptions,
} from '../types/options.js';
import type { ResizeStrategyHint } from '../types/size.js';
import { readEnvOptions } from './env.js';
import {
  describe,
  isPlainObject,
  parseAbortScope,
  parseBoolean,
  parseConcurrency,
  parseFormatOptions,
  parseHooks,
  parseLogger,
  parseResizeStrategyHint,
  parseSuffixOption,
  type FormatOptionsInput,
} from './validate.js';

/** Defaults of the options not set by the call or the environment. */
export const DEFAULT_OPTIONS = {
  resizeStrategyHint: 'downsample',
  suffix: '@{w}w',
  abortScope: 'none',
  logger: 'info',
  upscale: true,
  concurrency: 'auto',
} as const satisfies Required<
  Omit<AssetsOptions, 'formatOptions' | 'hooks'> & { concurrency: Concurrency }
>;

/** Options with every value set and checked. */
export interface ResolvedOptions {
  readonly logger: AssetsLogger;
  readonly resizeStrategyHint: ResizeStrategyHint;
  readonly suffix: string;
  readonly formatOptions: FormatOptionsInput;
  readonly abortScope: AbortScope;
  readonly upscale: boolean;
  readonly hooks: ResolvedHooks;
}

/** Merges format options per format, so each layer can set single fields. */
const mergeFormatOptions = (
  base: FormatOptionsInput,
  override: FormatOptionsInput
): FormatOptionsInput => {
  const merged: Record<string, object> = { ...base };
  for (const [format, options] of Object.entries(override))
    merged[format] = { ...merged[format], ...options };
  return merged;
};

/**
 * Resolves the options of a call: each option from the call, else from its
 * environment variable, else its default.
 *
 * @param options Options of the call.
 * @param env Environment variables. Default: `process.env`.
 * @throws TypeError or RangeError for invalid options or variables.
 */
export const resolveOptions = (
  options: AssetsOptions = {},
  env: NodeJS.ProcessEnv = process.env
): ResolvedOptions => {
  if (!isPlainObject(options))
    throw new TypeError(`Options must be an object, got ${describe(options)}.`);
  const fromEnv = readEnvOptions(env);
  const logger = parseLogger(
    options.logger ?? fromEnv.logger ?? DEFAULT_OPTIONS.logger
  );

  return {
    logger: typeof logger === 'string' ? createLogger(logger) : logger,
    resizeStrategyHint: parseResizeStrategyHint(
      options.resizeStrategyHint ??
        fromEnv.resizeStrategyHint ??
        DEFAULT_OPTIONS.resizeStrategyHint
    ),
    suffix: parseSuffixOption(
      options.suffix ?? fromEnv.suffix ?? DEFAULT_OPTIONS.suffix
    ),
    formatOptions: mergeFormatOptions(
      fromEnv.formatOptions ?? {},
      parseFormatOptions(options.formatOptions ?? {})
    ),
    abortScope: parseAbortScope(
      options.abortScope ?? fromEnv.abortScope ?? DEFAULT_OPTIONS.abortScope
    ),
    upscale: parseBoolean(
      'upscale',
      options.upscale ?? DEFAULT_OPTIONS.upscale
    ),
    hooks: groupHooks(parseHooks(options.hooks ?? [])),
  };
};

/**
 * Resolves the batch's concurrency, see `BatchAssetsOptions`: the call's,
 * else its environment variable, else `'auto'`.
 *
 * @throws RangeError for an invalid concurrency or variable.
 */
export const resolveConcurrency = (
  value: unknown,
  env: NodeJS.ProcessEnv = process.env
): Concurrency =>
  parseConcurrency(
    value ?? readEnvOptions(env).concurrency ?? DEFAULT_OPTIONS.concurrency
  );
