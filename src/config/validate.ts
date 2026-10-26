import { assertLogLevel, type LogLevel } from '@mmutils/logger';
import sharp from 'sharp';

import {
  canWriteFormat,
  isOutputFormat,
  OUTPUT_FORMATS,
  resolveFormatOptions,
  toSharpFormat,
} from '../image/formats.js';
import { isSizeMultiplier } from '../image/size-multiplier.js';
import { findUnknownWildcard, SUFFIX_WILDCARDS } from '../image/suffix.js';
import type { AssetsLogger } from '../log/logger.js';
import type { Hook, HookPoint } from '../types/hooks.js';
import type {
  AbortScope,
  Concurrency,
  AssetsOptions,
} from '../types/options.js';
import type {
  FormatSelector,
  OutputFormat,
  OutputFormatsOptions,
  OutputSetting,
} from '../types/output.js';
import type { ResizeStrategyHint } from '../types/size.js';

/** Format options as given by the caller: any formats, any options. */
export type FormatOptionsInput = NonNullable<AssetsOptions['formatOptions']>;

/** Output format with its complete sharp options. */
export interface Encoder {
  readonly format: OutputFormat;
  readonly options: OutputFormatsOptions[OutputFormat];
}

/** `'fallback'`'s encoders, one chosen per source. */
export interface FallbackEncoder {
  readonly format: 'fallback';
  readonly opaque: Encoder;
  readonly transparent: Encoder;
}

/** Encoders of a target, before the source tells if it is transparent. */
export type TargetEncoder = Encoder | FallbackEncoder;

/** Abort scopes, from the most forgiving. */
export const ABORT_SCOPES = ['none', 'source', 'batch'] as const;

const LOGGER_METHODS = ['error', 'warning', 'info', 'debug', 'verbose'];

/** Longest description of a value in a message: the rest is cut. */
const DESCRIPTION_LENGTH = 200;

/** Lists longer than this are told by their length, not their items. */
const LIST_ITEMS = 20;

/**
 * Binary data and long lists by their size, never their contents: as JSON
 * they would be megabytes (a hook's encoded image of 5.6 MB: 20 MB of text
 * in 150 ms).
 */
const sizeOf = (value: unknown): string | undefined => {
  if (ArrayBuffer.isView(value))
    return `${value.constructor.name}(${value.byteLength} bytes)`;
  if (value instanceof ArrayBuffer)
    return `ArrayBuffer(${value.byteLength} bytes)`;
  if (Array.isArray(value) && value.length > LIST_ITEMS)
    return `Array(${value.length} items)`;
  return undefined;
};

/**
 * A `JSON.stringify` replacer: an object's binary data and long lists are
 * told by their size before JSON reaches them (a Buffer's `toJSON` would
 * copy its bytes into a list first). Objects without any are kept as they
 * are, so circular ones still fail.
 */
const withSizes = (_key: string, value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return value;
  const entries: [string, unknown][] = Object.entries(value);
  if (entries.every(([, item]) => sizeOf(item) === undefined)) return value;
  const told = entries.map(
    ([key, item]) => [key, sizeOf(item) ?? item] as const
  );
  return Array.isArray(value) ?
      told.map(([, item]) => item)
    : Object.fromEntries(told);
};

/** `JSON.stringify` gives undefined for undefined, functions and symbols. */
const toJson = (value: unknown): string | undefined =>
  JSON.stringify(value, withSizes);

/**
 * Short description of a value for error messages, at most
 * `DESCRIPTION_LENGTH` characters. Only built for a message: it costs
 * nothing to a run that doesn't fail.
 */
export const describe = (value: unknown): string => {
  if (typeof value === 'string') return `'${value}'`;
  const size = sizeOf(value);
  if (size !== undefined) return size;
  let text: string;
  try {
    text = toJson(value) ?? String(value);
  } catch {
    text = String(value);
  }
  return text.length > DESCRIPTION_LENGTH ?
      `${text.slice(0, DESCRIPTION_LENGTH)}…`
    : text;
};

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const isResolution = (value: unknown) =>
  isPositiveNumber(value) || isSizeMultiplier(value);

/** @throws RangeError for anything but an abort scope. */
export const parseAbortScope = (value: unknown): AbortScope => {
  if ((ABORT_SCOPES as readonly unknown[]).includes(value))
    return value as AbortScope;
  throw new RangeError(
    `Unknown abort scope ${describe(value)}: expected ${ABORT_SCOPES.map(describe).join(', ')}.`
  );
};

/** @throws TypeError for anything but a resize strategy hint. */
export const parseResizeStrategyHint = (value: unknown): ResizeStrategyHint => {
  if (value === 'downsample' || value === 'upsample' || isSizeMultiplier(value))
    return value;
  if (
    isPlainObject(value) &&
    isPositiveNumber(value.width) &&
    isPositiveNumber(value.height)
  )
    return { width: value.width, height: value.height };
  throw new TypeError(
    `Invalid resize strategy hint ${describe(value)}: expected 'downsample', 'upsample', a multiplier like 'x2', or the size of 'x1' as { width, height } in pixels.`
  );
};

/** @throws TypeError or RangeError for anything but format options. */
export const parseFormatOptions = (value: unknown): FormatOptionsInput => {
  if (!isPlainObject(value))
    throw new TypeError(
      `Format options must be an object with formats as keys, got ${describe(value)}.`
    );
  for (const [format, options] of Object.entries(value)) {
    if (!isOutputFormat(format))
      throw new RangeError(
        `Unknown output format ${describe(format)}: expected one of ${OUTPUT_FORMATS.join(', ')}.`
      );
    if (!isPlainObject(options))
      throw new TypeError(
        `Options of format '${format}' must be an object, got ${describe(options)}.`
      );
  }
  return value;
};

/** @throws TypeError for anything but a boolean. */
export const parseBoolean = (name: string, value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  throw new TypeError(`${name} must be true or false, got ${describe(value)}.`);
};

/**
 * Why the suffix is invalid: a name in braces that isn't a wildcard, which
 * would end up in the file names (a typo, or a wildcard renamed).
 */
const suffixProblem = (suffix: string): string | undefined => {
  const unknown = findUnknownWildcard(suffix);
  if (unknown === undefined) return undefined;
  const wildcards = Object.keys(SUFFIX_WILDCARDS);
  return `unknown wildcard ${unknown} in ${describe(suffix)}: the wildcards are ${wildcards.slice(0, -1).join(', ')} and ${wildcards.at(-1) ?? ''}.`;
};

/**
 * @throws TypeError for anything but a string, RangeError for a suffix with
 * an unknown wildcard.
 */
export const parseSuffixOption = (value: unknown): string => {
  if (typeof value !== 'string')
    throw new TypeError(`Suffix must be a string, got ${describe(value)}.`);
  const problem = suffixProblem(value);
  if (problem !== undefined) throw new RangeError(`Suffix: ${problem}`);
  return value;
};

/** @throws TypeError or RangeError for anything but a concurrency. */
export const parseConcurrency = (value: unknown): Concurrency => {
  if (value === 'auto' || value === 'max') return value;
  if (Number.isSafeInteger(value) && (value as number) >= 1)
    return value as number;
  throw new RangeError(
    `Invalid concurrency ${describe(value)}: expected 'auto', 'max' or a whole number from 1.`
  );
};

/**
 * Checks a log level, or an object with the logger methods.
 *
 * @throws RangeError for unknown levels, TypeError for other values.
 */
export const parseLogger = (value: unknown): LogLevel | AssetsLogger => {
  if (typeof value === 'string') {
    assertLogLevel(value);
    return value;
  }
  if (isPlainObject(value)) {
    const missing = LOGGER_METHODS.filter(
      (method) => typeof value[method] !== 'function'
    );
    if (missing.length === 0) return value as unknown as AssetsLogger;
    throw new TypeError(`Logger is missing the methods ${missing.join(', ')}.`);
  }
  throw new TypeError(
    `Logger must be a log level or a logger object, got ${describe(value)}.`
  );
};

/** Points a hook can implement, in the order of a source's run. */
export const HOOK_POINTS = [
  'afterSourceLoad',
  'beforeResize',
  'afterResize',
  'beforeEncode',
  'beforeFormat',
  'beforeFileWrite',
] as const satisfies readonly HookPoint[];

/**
 * Checks the hooks: a list of objects, each with a unique name, a string
 * key and a whole concurrency from 1 if any, and a function at one point
 * at least. Other properties are the hook's own.
 *
 * @returns A copy of the list: changing it later doesn't change a run.
 * @throws TypeError naming the first invalid hook and why.
 */
export const parseHooks = (value: unknown): readonly Hook[] => {
  if (!Array.isArray(value))
    throw new TypeError(
      `Hooks must be a list of hook objects, got ${describe(value)}.`
    );
  const names = new Set<string>();
  value.forEach((hook: unknown, index) => {
    const fail = (reason: string): never => {
      throw new TypeError(`Hook ${index} ${describe(hook)}: ${reason}`);
    };
    if (!isPlainObject(hook))
      return fail(
        'must be an object like { name, afterSourceLoad: (image) => … }.'
      );
    const { name, key, concurrency } = hook;
    if (typeof name !== 'string' || name.trim() === '')
      return fail('needs a name, for the logs, errors and the manifest.');
    if (names.has(name)) fail(`another hook is named '${name}'.`);
    names.add(name);
    if (key !== undefined && typeof key !== 'string')
      fail('key must be a string.');
    if (
      concurrency !== undefined &&
      !(Number.isSafeInteger(concurrency) && (concurrency as number) >= 1)
    )
      fail('concurrency must be a whole number from 1.');
    const points = HOOK_POINTS.filter((point) => hook[point] !== undefined);
    for (const point of points)
      if (typeof hook[point] !== 'function')
        fail(`${point} must be a function.`);
    if (points.length === 0)
      fail(`has no function at any point: ${HOOK_POINTS.join(', ')}.`);
  });
  return [...(value as Hook[])];
};

/**
 * Checks the output settings: a non-empty list of objects with a width or a
 * height each, in pixels or as a multiplier.
 *
 * @throws TypeError naming the first invalid setting and why.
 */
export function assertSettings(
  settings: unknown
): asserts settings is readonly OutputSetting[] {
  if (!Array.isArray(settings) || settings.length === 0)
    throw new TypeError(
      `Settings must be a non-empty list of sizes like { width: 1024 }, got ${describe(settings)}.`
    );
  settings.forEach((setting: unknown, index) => {
    const fail = (reason: string): never => {
      throw new TypeError(`Setting ${index} ${describe(setting)}: ${reason}`);
    };
    if (!isPlainObject(setting)) return fail('must be an object.');
    const { width, height, resizeOptions, extractRegion, suffix } = setting;
    if (width === undefined && height === undefined)
      fail('needs a width or a height.');
    for (const [name, value] of [
      ['width', width],
      ['height', height],
    ] as const)
      if (value !== undefined && !isResolution(value))
        fail(
          `${name} must be a positive number of pixels or a multiplier like 'x2', got ${describe(value)}.`
        );
    if (resizeOptions !== undefined && !isPlainObject(resizeOptions))
      fail('resizeOptions must be an object.');
    if (extractRegion !== undefined) {
      const region = isPlainObject(extractRegion) ? extractRegion : {};
      const { left, top, width: regionWidth, height: regionHeight } = region;
      if (
        !isNonNegativeInteger(left) ||
        !isNonNegativeInteger(top) ||
        !isNonNegativeInteger(regionWidth) ||
        !isNonNegativeInteger(regionHeight) ||
        regionWidth === 0 ||
        regionHeight === 0
      )
        fail(
          'extractRegion must have whole numbers left, top, width and height, the size above 0.'
        );
    }
    if (suffix !== undefined && typeof suffix !== 'string')
      fail('suffix must be a string.');
    const problem =
      typeof suffix === 'string' ? suffixProblem(suffix) : undefined;
    if (problem !== undefined) fail(`suffix has an ${problem}`);
    for (const flag of ['generateFromSource', 'useAsNextResizeIteration'])
      if (setting[flag] !== undefined && typeof setting[flag] !== 'boolean')
        fail(`${flag} must be a boolean.`);
  });
}

/**
 * Reads the `formats` argument: a list of formats or an object of formats
 * and their options. Duplicates are kept once. `'fallback'` is allowed in
 * lists: its options are those of `jpg` and `png`.
 *
 * @returns Formats with the options given with them, in the given order;
 * empty when `formats` is undefined or empty.
 * @throws TypeError or RangeError for unknown formats and invalid options.
 */
export const parseFormats = (
  formats: unknown
): Map<FormatSelector, object | undefined> => {
  const parsed = new Map<FormatSelector, object | undefined>();
  if (formats === undefined) return parsed;
  if (!Array.isArray(formats) && !isPlainObject(formats))
    throw new TypeError(
      `Formats must be a list like ['avif', 'webp'] or an object like { webp: { quality: 70 } }, got ${describe(formats)}.`
    );
  const entries: [unknown, unknown][] =
    Array.isArray(formats) ?
      formats.map((format: unknown) => [format, undefined])
    : Object.entries(formats);
  for (const [format, options] of entries) {
    if (format === 'fallback' && Array.isArray(formats)) {
      parsed.set('fallback', undefined);
      continue;
    }
    if (!isOutputFormat(format))
      throw new RangeError(
        format === 'fallback' ?
          "'fallback' takes no options: put it in a list, and set the options of jpg and png."
        : `Unknown output format ${describe(format)}: expected one of ${OUTPUT_FORMATS.join(', ')}, or 'fallback'.`
      );
    if (options !== undefined && !isPlainObject(options))
      throw new TypeError(
        `Options of format '${format}' must be an object, got ${describe(options)}.`
      );
    if (!parsed.has(format)) parsed.set(format, options);
  }
  return parsed;
};

const createEncoder = (
  format: OutputFormat,
  formatOptions: FormatOptionsInput,
  callOptions?: object
): Encoder => {
  if (!canWriteFormat(format))
    throw new RangeError(
      `The installed sharp can't write ${format} files: its prebuilt binaries don't include an encoder for them.`
    );
  const options = resolveFormatOptions(format, formatOptions, callOptions);
  try {
    // sharp validates format options when they are set, before any input
    sharp().toFormat(toSharpFormat(format), options);
  } catch (error) {
    throw new TypeError(
      `Invalid ${format} options ${describe(options)}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  return { format, options };
};

/**
 * Resolves the complete options of each format and checks them with sharp,
 * so invalid options fail before any image is processed. `'fallback'` gets
 * both of its encoders, chosen per source by `selectEncoders`.
 *
 * @throws RangeError for formats the installed sharp can't write, TypeError
 * for options sharp rejects.
 */
export const createEncoders = (
  formats: ReadonlyMap<FormatSelector, object | undefined>,
  formatOptions: FormatOptionsInput
): TargetEncoder[] =>
  [...formats].map(([format, callOptions]) =>
    format === 'fallback' ?
      {
        format,
        opaque: createEncoder('jpg', formatOptions),
        transparent: createEncoder('png', formatOptions),
      }
    : createEncoder(format, formatOptions, callOptions)
  );

/**
 * The encoders of a source: `'fallback'` becomes JPEG, or PNG for a
 * transparent source. A format listed twice is written once.
 */
export const selectEncoders = (
  encoders: readonly TargetEncoder[],
  hasAlpha: boolean
): Encoder[] => {
  const selected = new Map<OutputFormat, Encoder>();
  for (const encoder of encoders) {
    const concrete =
      encoder.format !== 'fallback' ? encoder
      : hasAlpha ? encoder.transparent
      : encoder.opaque;
    if (!selected.has(concrete.format)) selected.set(concrete.format, concrete);
  }
  return [...selected.values()];
};
