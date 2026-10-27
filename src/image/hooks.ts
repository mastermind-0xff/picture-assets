import sharp, { type Channels, type Sharp } from 'sharp';

import { describe, isPlainObject } from '../config/validate.js';
import { HookError } from '../errors/hook-error.js';
import type {
  FormatHookContext,
  Hook,
  HookContext,
  HookData,
  HookPoint,
  HookResult,
  HookReturn,
  JsonValue,
  RawImage,
  SizeHookContext,
} from '../types/hooks.js';
import { formatDuration } from '../utils/helpers.js';

/** Hooks by point, each list in the given order, and every hook. */
export interface ResolvedHooks extends Readonly<
  Record<HookPoint, readonly Hook[]>
> {
  readonly all: readonly Hook[];
}

/** No hooks: every point is skipped. */
export const NO_HOOKS: ResolvedHooks = Object.freeze({
  all: [],
  afterSourceLoad: [],
  beforeResize: [],
  afterResize: [],
  beforeEncode: [],
  beforeFormat: [],
  beforeFileWrite: [],
});

/** Groups checked hooks by the points they implement, once per run. */
export const groupHooks = (hooks: readonly Hook[]): ResolvedHooks => {
  if (hooks.length === 0) return NO_HOOKS;
  const at = (point: HookPoint) =>
    hooks.filter((hook) => hook[point] !== undefined);
  return {
    all: hooks,
    afterSourceLoad: at('afterSourceLoad'),
    beforeResize: at('beforeResize'),
    afterResize: at('afterResize'),
    beforeEncode: at('beforeEncode'),
    beforeFormat: at('beforeFormat'),
    beforeFileWrite: at('beforeFileWrite'),
  };
};

/** Whether pixels with this many channels have alpha. */
export const hasAlphaChannel = (channels: number) =>
  channels === 2 || channels === 4;

/** A sharp object over pixels: shares their buffer, copies nothing. */
export const fromRaw = ({ data, info }: RawImage): Sharp =>
  sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  });

/** Runs a sharp object's operations into pixels, 8 bits per channel. */
export const bake = async (image: Sharp): Promise<RawImage> => {
  const { data, info } = await image
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });
  return {
    data,
    info: { width: info.width, height: info.height, channels: info.channels },
  };
};

/** An image hooks can be given. */
export interface HookInput {
  readonly width: number;
  readonly height: number;
  readonly channels: Channels;
  /** A new sharp object over the image, never one the run uses. */
  readonly create: () => Sharp;
  /** A copy of its pixels. */
  readonly pixels: () => Promise<RawImage>;
}

const copy = ({ data, info }: RawImage): RawImage => ({
  data: Buffer.from(data),
  info,
});

/** Pixels the run has, as a hook's input. */
export const rawInput = (image: RawImage): HookInput => ({
  ...image.info,
  create: () => fromRaw(image),
  pixels: () => Promise.resolve(copy(image)),
});

/** An encoded source as a hook's input, see `encodedInput`. */
export interface EncodedInput extends HookInput {
  /**
   * The source's pixels if a hook asked for them, decoded once: never
   * changed, `pixels()` gives copies.
   */
  readonly decoded: () => Promise<RawImage> | undefined;
}

/**
 * An encoded source (the file's bytes) as a hook's input: auto-oriented,
 * decoded on the first call for its pixels.
 */
export const encodedInput = (
  input: Buffer,
  { width, height, channels }: Omit<HookInput, 'create' | 'pixels'>
): EncodedInput => {
  const create = () => sharp(input, { autoOrient: true });
  let decoded: Promise<RawImage> | undefined;
  return {
    width,
    height,
    channels,
    create,
    pixels: async () => copy(await (decoded ??= bake(create()))),
    decoded: () => decoded,
  };
};

const isRawImage = (value: unknown): value is RawImage =>
  isPlainObject(value) && value.data instanceof Uint8Array;

const isSharp = (value: unknown): value is Sharp =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Partial<Sharp>).toBuffer === 'function';

const isDimension = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 1;

const isChannels = (value: unknown): value is Channels =>
  value === 1 || value === 2 || value === 3 || value === 4;

/** A hook's pixels, checked: their size must match their buffer. */
const checkRawImage = (image: RawImage): RawImage => {
  // any typed array of bytes, as sharp takes them
  const data: Uint8Array = image.data;
  const info: Record<string, unknown> =
    isPlainObject(image.info) ? image.info : {};
  const { width, height, channels } = info;
  if (!isDimension(width) || !isDimension(height) || !isChannels(channels))
    throw new TypeError(
      `returned pixels with info ${describe(image.info)}: expected { width, height, channels }, channels from 1 to 4.`
    );
  const expected = width * height * channels;
  if (data.length !== expected)
    throw new TypeError(
      `returned ${data.length} bytes of pixels for ${width}x${height} with ${channels} channels: expected ${expected}.`
    );
  return {
    data:
      Buffer.isBuffer(data) ? data : (
        Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      ),
    info: { width, height, channels },
  };
};

/**
 * What the hooks of a source, a size or a file recorded, by hook name, then
 * key (see `HookContext.record`). Maps: a key like `__proto__` is data like
 * any other.
 */
export type Recorded = Map<string, Map<string, JsonValue>>;

/**
 * Recorded data as the results have it, the stores merged in order: for the
 * same hook and key, a later store's value wins (a file's over its size's).
 *
 * @returns The data, or undefined when nothing was recorded.
 */
export const recordedData = (
  ...stores: readonly (Recorded | undefined)[]
): HookData | undefined => {
  const merged: Recorded = new Map();
  for (const store of stores)
    for (const [hook, values] of store ?? []) {
      const into = merged.get(hook);
      if (into === undefined) merged.set(hook, new Map(values));
      else for (const [key, value] of values) into.set(key, value);
    }
  if (merged.size === 0) return undefined;
  return Object.fromEntries(
    [...merged].map(([hook, values]) => [hook, Object.fromEntries(values)])
  );
};

/** `JSON.stringify` gives undefined for undefined, functions and symbols. */
const stringify = (value: unknown): string | undefined => JSON.stringify(value);

/**
 * A recorded value as JSON gives it back. Checked when recorded: as the
 * manifest is written, after the whole run, a BigInt or a circular object
 * would fail it and name no hook.
 *
 * @throws TypeError when JSON can't write the value.
 */
const jsonCopy = (key: string, value: unknown): JsonValue => {
  let text: string | undefined;
  try {
    text = stringify(value);
  } catch (error: unknown) {
    throw new TypeError(
      `recorded ${describe(key)} as ${describe(value)}: not JSON (${error instanceof Error ? error.message : String(error)}).`,
      { cause: error }
    );
  }
  if (text === undefined)
    throw new TypeError(
      `recorded ${describe(key)} as ${describe(value)}: not JSON.`
    );
  return JSON.parse(text) as JsonValue;
};

/** What a point tells its hooks, beyond what each image tells. */
type PointContext<P extends HookPoint> = Omit<
  P extends 'afterSourceLoad' ? HookContext
  : P extends 'beforeFormat' | 'beforeFileWrite' ? FormatHookContext
  : SizeHookContext,
  'point' | 'width' | 'height' | 'channels' | 'pixels' | 'record'
> & {
  /** Where its hooks' `record` keeps their data. */
  readonly recorded: Recorded;
};

/** At most `limit` calls at once: the others wait, in order. */
interface Gate {
  readonly full: () => boolean;
  readonly acquire: () => Promise<void>;
  readonly release: () => void;
}

const createGate = (limit: number): Gate => {
  let active = 0;
  const waiting: (() => void)[] = [];
  return {
    full: () => active >= limit,
    acquire: () => {
      if (active < limit) {
        active++;
        return Promise.resolve();
      }
      return new Promise((resolve) => waiting.push(resolve));
    },
    // the slot goes to the next call waiting, if any
    release: () => {
      const next = waiting.shift();
      if (next) next();
      else active--;
    },
  };
};

/**
 * The gate of each hook with a `concurrency`: shared by its points and by
 * every run in the process, as the GPU or the API it guards is.
 */
const gates = new WeakMap<Hook, Gate>();

const gateOf = (hook: Hook): Gate | undefined => {
  if (hook.concurrency === undefined) return undefined;
  let gate = gates.get(hook);
  if (gate === undefined) {
    gate = createGate(hook.concurrency);
    gates.set(hook, gate);
  }
  return gate;
};

/**
 * Calls one hook at a point. Logged at debug level when it starts and when
 * it ends, `take` included: its time is the hook's work. A hook at its
 * `concurrency` waits for a turn first (logged too), and doesn't start if
 * the run was stopped meanwhile.
 *
 * @param image The image the hook gets, made once its turn came.
 * @param context The hook's context but its `record`, made here for the
 * hook: it keeps the data in `recorded`, under the hook's name.
 * @param label Where, for the logs: the source, its size or the file.
 * @param take Checks what the hook returned and makes it the image to go on
 * with (a bake): what it throws fails the hook.
 * @throws HookError when the hook throws or `take` refuses what it returned.
 */
const callHook = async <T>(
  hook: Hook,
  point: HookPoint,
  image: () => Sharp,
  context: Omit<HookContext, 'record'>,
  recorded: Recorded,
  label: string,
  take: (returned: HookResult) => T | Promise<T>
): Promise<T> => {
  const call = hook[point] as (
    image: Sharp,
    context: HookContext
  ) => HookReturn;
  const { logger, signal } = context;
  let ended = false;
  const record = (key: string, value: JsonValue) => {
    // the results may be made already: the value would be lost, or not
    if (ended)
      throw new Error(
        `Hook ${hook.name} recorded ${describe(key)} after its ${point} call of ${label} ended.`
      );
    const copy = jsonCopy(key, value);
    const values = recorded.get(hook.name);
    if (values === undefined) recorded.set(hook.name, new Map([[key, copy]]));
    else values.set(key, copy);
  };
  const gate = gateOf(hook);
  if (gate?.full())
    logger.debug(`Hook ${hook.name} waiting: ${point} of ${label}`);
  await gate?.acquire();
  logger.debug(`Hook ${hook.name} start: ${point} of ${label}`);
  const start = performance.now();
  let result: T;
  try {
    if (gate) signal.throwIfAborted();
    let returned: HookResult;
    try {
      returned = await call.call(hook, image(), { ...context, record });
    } finally {
      ended = true;
    }
    result = await take(returned);
  } catch (error: unknown) {
    throw new HookError(
      `Hook ${hook.name} failed at ${point} of ${label}: ${error instanceof Error ? error.message : String(error)}`,
      hook.name,
      point,
      { cause: error }
    );
  } finally {
    gate?.release();
  }
  logger.debug(
    `Hook ${hook.name} end: ${point} of ${label} in ${formatDuration(performance.now() - start)}`
  );
  return result;
};

/**
 * Runs the hooks of a point, one after the other, each on the image the
 * previous one gave (see `callHook`).
 *
 * @param bakeLast Whether the last hook's sharp object is baked: not at
 * `beforeFormat`, whose operations run in the encode.
 * @returns The image the hooks gave, or undefined when none changed it.
 * @throws HookError when a hook throws or returns something else.
 */
const run = async <P extends Exclude<HookPoint, 'beforeFileWrite'>>(
  point: P,
  hooks: readonly Hook[],
  input: HookInput,
  context: PointContext<P>,
  label: string,
  bakeLast: boolean
): Promise<RawImage | Sharp | undefined> => {
  const { recorded, ...shared } = context;
  let current = input;
  let changed: RawImage | undefined;
  for (const [index, hook] of hooks.entries()) {
    if (hook[point] === undefined) continue;
    const toPixels = bakeLast || index < hooks.length - 1;
    const given = current;
    const result = await callHook(
      hook,
      point,
      given.create,
      {
        ...shared,
        point,
        width: given.width,
        height: given.height,
        channels: given.channels,
        pixels: given.pixels,
      },
      recorded,
      label,
      async (returned): Promise<RawImage | Sharp | undefined> => {
        if (returned === undefined) return undefined;
        if (isRawImage(returned)) return checkRawImage(returned);
        if (isSharp(returned)) return toPixels ? bake(returned) : returned;
        throw new TypeError(
          `returned ${describe(returned)}: expected a sharp object, pixels as { data, info } or undefined.`
        );
      }
    );
    if (result === undefined) continue;
    if (!isRawImage(result)) return result;
    changed = result;
    current = rawInput(result);
  }
  return changed;
};

/**
 * Runs the hooks of a point before `beforeFormat`, see `run`: every image a
 * hook gives is baked, so the next hook and step get its pixels.
 *
 * @returns The image the hooks gave, or undefined when none changed it.
 */
export const runHooks = async <
  P extends Exclude<HookPoint, 'beforeFormat' | 'beforeFileWrite'>,
>(
  point: P,
  hooks: readonly Hook[],
  input: HookInput,
  context: PointContext<P>,
  label: string
): Promise<RawImage | undefined> =>
  (await run(point, hooks, input, context, label, true)) as
    RawImage | undefined;

/**
 * Runs the `beforeFormat` hooks, see `run`: the last hook's sharp object is
 * returned as is, its operations run in the file's encode.
 *
 * @returns The sharp object to encode, or undefined when no hook changed
 * the image.
 */
export const runFormatHooks = async (
  hooks: readonly Hook[],
  input: HookInput,
  context: PointContext<'beforeFormat'>,
  label: string
): Promise<Sharp | undefined> => {
  const result = await run('beforeFormat', hooks, input, context, label, false);
  return result === undefined || isSharp(result) ? result : fromRaw(result);
};

/**
 * Runs the `beforeFileWrite` hooks on the file's own sharp object, its
 * format and options set, one after the other (see `callHook`): each gets
 * what the previous one returned, or the same object. Nothing is baked: the
 * object is what gets written, with its encoder options.
 *
 * @param image The file's sharp object, after `toFormat`.
 * @param input The size's image, for the context's size and `pixels()`.
 * @returns The sharp object to write.
 * @throws HookError when a hook throws or returns anything but a sharp
 * object or nothing.
 */
export const runFileWriteHooks = async (
  hooks: readonly Hook[],
  image: Sharp,
  input: HookInput,
  context: PointContext<'beforeFileWrite'>,
  label: string
): Promise<Sharp> => {
  const { recorded, ...shared } = context;
  let current = image;
  for (const hook of hooks) {
    if (hook.beforeFileWrite === undefined) continue;
    const given = current;
    current = await callHook(
      hook,
      'beforeFileWrite',
      () => given,
      {
        ...shared,
        point: 'beforeFileWrite',
        width: input.width,
        height: input.height,
        channels: input.channels,
        pixels: input.pixels,
      },
      recorded,
      label,
      (returned) => {
        if (returned === undefined) return given;
        if (isSharp(returned)) return returned;
        throw new TypeError(
          `returned ${describe(returned)}: expected a sharp object or undefined, as pixels have no format.`
        );
      }
    );
  }
  return current;
};
