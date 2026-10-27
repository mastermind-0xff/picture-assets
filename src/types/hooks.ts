import type { Channels, Sharp } from 'sharp';

import type { AssetsLogger } from '../log/logger.js';
import type {
  OutputFormat,
  OutputFormatsOptions,
  OutputSetting,
} from './output.js';

/**
 * Where a hook runs, in the order of a source's run:
 *
 * - `'afterSourceLoad'`: once per source, after it is read (EXIF orientation
 *   applied), before its sizes are planned.
 * - `'beforeResize'`: per size, on the image the size is resized from (the
 *   source or the previous size).
 * - `'afterResize'`: per size, after the resize, before the size is handed
 *   to the next sizes: the image the hook gives goes down the chain.
 * - `'beforeEncode'`: per size, after the next sizes took it: the hook
 *   changes every file of this size, not the chain (a watermark).
 * - `'beforeFormat'`: per file, before the run sets its format.
 * - `'beforeFileWrite'`: per file, after the run set its format and encoder
 *   options, right before it is written: the hook can change them.
 */
export type HookPoint =
  | 'afterSourceLoad'
  | 'beforeResize'
  | 'afterResize'
  | 'beforeEncode'
  | 'beforeFormat'
  | 'beforeFileWrite';

/**
 * Decoded pixels: 8 bits per channel, channels interleaved, rows from the
 * top. 4 or 2 channels have alpha.
 */
export interface RawImage {
  readonly data: Buffer;
  readonly info: {
    readonly width: number;
    readonly height: number;
    readonly channels: Channels;
  };
}

/**
 * What a hook gives back:
 *
 * - `undefined`, or nothing: no change. A hook may only log, write to a
 *   database or detect something.
 * - a sharp object: the image from now on. Its operations run once, when it
 *   is baked to pixels, before the next hook or step.
 * - `RawImage`: the image from now on, as is.
 *
 * `void` is what TypeScript calls the return of a function without a
 * `return`: with it, such a function written apart from its hook object (a
 * shared module, a `--hooks` file) is a valid point. Numbers, `null` or
 * encoded bytes still aren't.
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- a function without a return returns void
export type HookResult = Sharp | RawImage | undefined | void;

/** A hook's return value, or a promise of it. */
export type HookReturn = HookResult | Promise<HookResult>;

/**
 * A value JSON writes and reads back as it is. A value typed by an
 * interface needs a spread to be one (`{ ...point }`): TypeScript gives
 * interfaces no index signature.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * What hooks recorded (see `HookContext.record`), by hook name, then by
 * key: `{ placeholder: { color: '#a3b1c2' } }`.
 */
export type HookData = Readonly<
  Record<string, Readonly<Record<string, JsonValue>>>
>;

/** A size as planned, multipliers resolved. */
export interface HookSetting {
  /** Planned size in pixels, before `resizeOptions` and `extractRegion`. */
  readonly width: number;
  readonly height: number;
  /** The size's multiplier: 2 for `'x2'`, 1 for the `'x1'` resolution. */
  readonly sizeMultiplier: number;
  /** The setting's own suffix, if any. */
  readonly suffix?: string | undefined;
  readonly resizeOptions?: OutputSetting['resizeOptions'];
  readonly extractRegion?: OutputSetting['extractRegion'];
}

/** What a hook is told about its call, at every point. */
export interface HookContext {
  readonly point: HookPoint;
  /** Path of the source image. */
  readonly source: string;
  /** Size of the image the hook gets. */
  readonly width: number;
  readonly height: number;
  /** Channels of the image the hook gets: 4 or 2 have alpha. */
  readonly channels: Channels;
  /**
   * The image's pixels, as a copy the hook owns: change them and return
   * them. Free where the run has them (after a resize, a copy), decoded on
   * the first call at the source.
   */
  readonly pixels: () => Promise<RawImage>;
  /** The run's signal: a long hook can stop when the run is stopped. */
  readonly signal: AbortSignal;
  readonly logger: AssetsLogger;
  /**
   * Records data in the results and the manifest, under the hook's name:
   * `record('color', '#a3b1c2')` gives `data: { placeholder: { color:
   * '#a3b1c2' } }`. At `afterSourceLoad` the data is the source's; at the
   * other points it is each file's: a size point's on every file of its
   * size, a file's own value winning over its size's. The same key again
   * replaces the value. Kept as a JSON copy: a value JSON can't write (a
   * BigInt, a circular object) throws, failing the hook; JSON writes the
   * rest its way (a `Map` as `{}`, a `Date` as its string). Only during
   * the hook's call: a call after it ended throws.
   */
  readonly record: (key: string, value: JsonValue) => void;
}

/** Context of the size points: `beforeResize`, `afterResize`, `beforeEncode`. */
export interface SizeHookContext extends HookContext {
  readonly setting: HookSetting;
}

/**
 * Context of the file points: `beforeFormat`, `beforeFileWrite`. At
 * `beforeFileWrite`, `width`, `height`, `channels` and `pixels()` are those
 * of the size's image, before the `beforeFormat` hooks.
 */
export interface FormatHookContext extends SizeHookContext {
  readonly format: OutputFormat;
  /** The format's complete encoder options, as the run sets them. */
  readonly options: Readonly<OutputFormatsOptions[OutputFormat]>;
  /** The file it will write. */
  readonly file: string;
}

/**
 * Functions run in the resize chain, at the points they implement (see
 * `HookPoint`). Each gets a new sharp object over the image, never one the
 * run uses (but `beforeFileWrite`: the file's own), and returns the image to
 * go on with (see `HookResult`). Points without hooks cost nothing.
 *
 * ```ts
 * const colorGrade: Hook = {
 *   name: 'colorGrade',
 *   afterSourceLoad: (image) => image.modulate({ saturation: 1.1 }),
 * };
 * ```
 */
export interface Hook {
  /** Names the hook in logs and errors. Unique in `hooks`. */
  readonly name: string;
  /**
   * Version of the hook's work, in the manifest's hash with the name:
   * change it to remake the sources a manifest skips as unchanged. Without
   * a key the hook's code is hashed instead, so editing it remakes them;
   * settings it closes over (a factory's options) and external models are
   * not in its code: give those a key, and change it with them.
   */
  readonly key?: string;
  /**
   * Calls of this hook running at once, at most: for a GPU model or a rate
   * limited API. Counted across its points and every run in the process;
   * the other calls wait their turn while the rest of the run goes on. A
   * whole number from 1. Default: no limit (as many as the sources and
   * formats in progress).
   */
  readonly concurrency?: number;
  readonly afterSourceLoad?: (image: Sharp, context: HookContext) => HookReturn;
  readonly beforeResize?: (
    image: Sharp,
    context: SizeHookContext
  ) => HookReturn;
  readonly afterResize?: (image: Sharp, context: SizeHookContext) => HookReturn;
  readonly beforeEncode?: (
    image: Sharp,
    context: SizeHookContext
  ) => HookReturn;
  /**
   * Its sharp object is encoded as returned, not baked: its operations run
   * in the file's encode, and its time is in the encode. The run sets the
   * format and its options after it (`toFormat`), over the encoder options
   * a hook sets here: set those at `beforeFileWrite`.
   */
  readonly beforeFormat?: (
    image: Sharp,
    context: FormatHookContext
  ) => HookReturn;
  /**
   * Gets the file's own sharp object, its format and encoder options set,
   * right before it is written: what the hook sets wins, e.g.
   * `image.avif({ quality: 45 })` for a 2x size. What it calls on the
   * object counts, returned or not. Returns that object, another sharp
   * object or nothing; not pixels, which have no format. The file's name
   * and the format in the results and manifest stay the run's: a format
   * changed here (`toFormat('png')`) writes its bytes under that name.
   */
  readonly beforeFileWrite?: (
    image: Sharp,
    context: FormatHookContext
  ) => HookReturn;
}
