import sharp, { type Channels, type Sharp } from 'sharp';

import { describe, isPlainObject } from '../config/validate.js';
import { HookError } from '../errors/hook-error.js';
import type {
  FormatHookContext,
  Hook,
  HookContext,
  HookPoint,
  HookResult,
  HookReturn,
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
  source: [],
  beforeResize: [],
  afterResize: [],
  beforeEncode: [],
  beforeFormat: [],
});

/** Groups checked hooks by the points they implement, once per run. */
export const groupHooks = (hooks: readonly Hook[]): ResolvedHooks => {
  if (hooks.length === 0) return NO_HOOKS;
  const at = (point: HookPoint) =>
    hooks.filter((hook) => hook[point] !== undefined);
  return {
    all: hooks,
    source: at('source'),
    beforeResize: at('beforeResize'),
    afterResize: at('afterResize'),
    beforeEncode: at('beforeEncode'),
    beforeFormat: at('beforeFormat'),
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

/** What a point tells its hooks, beyond what each image tells. */
type PointContext<P extends HookPoint> = Omit<
  P extends 'source' ? HookContext
  : P extends 'beforeFormat' ? FormatHookContext
  : SizeHookContext,
  'point' | 'width' | 'height' | 'channels' | 'pixels'
>;

/**
 * Runs the hooks of a point, one after the other, each on the image the
 * previous one gave. Each call is logged at debug level when it starts and
 * when it ends, its sharp object baked: its time is the hook's work.
 *
 * @param label Where, for the logs: the source, its size or the file.
 * @param bakeLast Whether the last hook's sharp object is baked: not at
 * `beforeFormat`, whose operations run in the encode.
 * @returns The image the hooks gave, or undefined when none changed it.
 * @throws HookError when a hook throws or returns something else.
 */
const run = async <P extends HookPoint>(
  point: P,
  hooks: readonly Hook[],
  input: HookInput,
  context: PointContext<P>,
  label: string,
  bakeLast: boolean
): Promise<RawImage | Sharp | undefined> => {
  const { logger } = context;
  let current = input;
  let changed: RawImage | undefined;
  for (const [index, hook] of hooks.entries()) {
    const call = hook[point] as
      ((image: Sharp, context: HookContext) => HookReturn) | undefined;
    if (call === undefined) continue;
    const toPixels = bakeLast || index < hooks.length - 1;
    logger.debug(`Hook ${hook.name} start: ${point} of ${label}`);
    const start = performance.now();
    let result: RawImage | Sharp | undefined;
    try {
      const returned: HookResult = await call.call(hook, current.create(), {
        ...context,
        point,
        width: current.width,
        height: current.height,
        channels: current.channels,
        pixels: current.pixels,
      });
      if (returned === undefined) result = undefined;
      else if (isRawImage(returned)) result = checkRawImage(returned);
      else if (isSharp(returned))
        result = toPixels ? await bake(returned) : returned;
      else
        throw new TypeError(
          `returned ${describe(returned)}: expected a sharp object, pixels as { data, info } or undefined.`
        );
    } catch (error: unknown) {
      throw new HookError(
        `Hook ${hook.name} failed at ${point} of ${label}: ${error instanceof Error ? error.message : String(error)}`,
        hook.name,
        point,
        { cause: error }
      );
    }
    logger.debug(
      `Hook ${hook.name} end: ${point} of ${label} in ${formatDuration(performance.now() - start)}`
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
export const runHooks = async <P extends Exclude<HookPoint, 'beforeFormat'>>(
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
