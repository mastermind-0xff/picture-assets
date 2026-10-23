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
 * - `'source'`: once per source, after it is read (EXIF orientation
 *   applied), before its sizes are planned.
 * - `'beforeResize'`: per size, on the image the size is resized from (the
 *   source or the previous size).
 * - `'afterResize'`: per size, after the resize, before the size is handed
 *   to the next sizes: the image the hook gives goes down the chain.
 * - `'beforeEncode'`: per size, after the next sizes took it: the hook
 *   changes every file of this size, not the chain (a watermark).
 * - `'beforeFormat'`: per file, before it is encoded.
 */
export type HookPoint =
  'source' | 'beforeResize' | 'afterResize' | 'beforeEncode' | 'beforeFormat';

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
 * - `undefined`: no change.
 * - a sharp object: the image from now on. Its operations run once, when it
 *   is baked to pixels, before the next hook or step.
 * - `RawImage`: the image from now on, as is.
 */
export type HookResult = Sharp | RawImage | undefined;

/** A hook's return value, or a promise of it. */
export type HookReturn = HookResult | Promise<HookResult>;

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
}

/** Context of the size points: `beforeResize`, `afterResize`, `beforeEncode`. */
export interface SizeHookContext extends HookContext {
  readonly setting: HookSetting;
}

/** Context of `beforeFormat`. */
export interface FormatHookContext extends SizeHookContext {
  readonly format: OutputFormat;
  /** The format's complete encoder options. */
  readonly options: Readonly<OutputFormatsOptions[OutputFormat]>;
  /** The file it will write. */
  readonly file: string;
}

/**
 * Functions run in the resize chain, at the points they implement (see
 * `HookPoint`). Each gets a new sharp object over the image, never one the
 * run uses, and returns the image to go on with (see `HookResult`). Points
 * without hooks cost nothing.
 *
 * ```ts
 * const colorGrade: Hook = {
 *   name: 'colorGrade',
 *   source: (image) => image.modulate({ saturation: 1.1 }),
 * };
 * ```
 */
export interface Hook {
  /** Names the hook in logs and errors. Unique in `hooks`. */
  readonly name: string;
  /**
   * Version of the hook's work, in the manifest's hash with the name:
   * change it to remake the sources a manifest skips as unchanged. Hooks
   * are functions, their changes can't be told otherwise.
   */
  readonly key?: string;
  readonly source?: (image: Sharp, context: HookContext) => HookReturn;
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
   * in the file's encode, and its time is in the encode. The format is set
   * after it: a hook can't change it.
   */
  readonly beforeFormat?: (
    image: Sharp,
    context: FormatHookContext
  ) => HookReturn;
}
