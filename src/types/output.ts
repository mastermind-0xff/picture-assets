import type {
  AvifOptions,
  GifOptions,
  HeifOptions,
  Jp2Options,
  JpegOptions,
  JxlOptions,
  OutputInfo,
  PngOptions,
  Region,
  ResizeOptions,
  TiffOptions,
  WebpOptions,
} from 'sharp';
import type { HookData } from './hooks.js';
import type { ResizeResolution } from './size.js';

/**
 * Output formats and their sharp options. Each format is also the file
 * extension of its outputs. `jp2` and `jxl` need a sharp build with their
 * libraries; the prebuilt binaries can't write them.
 */
export interface OutputFormatsOptions {
  avif: AvifOptions;
  gif: GifOptions;
  heif: HeifOptions;
  jpeg: JpegOptions;
  jpg: JpegOptions;
  jp2: Jp2Options;
  jxl: JxlOptions;
  png: PngOptions;
  tiff: TiffOptions;
  tif: TiffOptions;
  webp: WebpOptions;
}

/** Output format, also the extension of the output files. */
export type OutputFormat = keyof OutputFormatsOptions;

/**
 * Output formats: a list of formats, or an object with formats as keys and
 * their options as values, e.g. `['avif', 'webp']` or
 * `{ webp: { quality: 70 }, jpg: {} }`. Options are merged over the defaults
 * of the format (see `formatOptions`).
 */
export type OutputFormats =
  | readonly FormatSelector[]
  | { readonly [F in OutputFormat]?: OutputFormatsOptions[F] };

/**
 * An output format, or `'fallback'`: JPEG, or PNG for transparent sources
 * (a pixel with an alpha below 255, not an alpha channel opaque all over),
 * chosen per source. The format for older browsers next to AVIF and WebP.
 */
export type FormatSelector = OutputFormat | 'fallback';

/** Image processing result completion type. */
export type ResultStatus = 'succeed' | 'failed' | 'aborted' | 'skipped';

/**
 * Result of one output file.
 * - `'succeed'`: written; `fileData` has its size and dimensions.
 * - `'failed'`: not written; `error` tells why.
 */
export type ResultFormat = {
  format: OutputFormat;
  file: string;
  /**
   * What hooks recorded for the file, at its size's points and its own;
   * absent when none did. See `HookContext.record`.
   */
  data?: HookData;
} & (
  | { status: 'succeed'; fileData: OutputInfo }
  | { status: 'failed'; error: unknown }
);

/**
 * Result of one output setting (one size) of a source.
 * - `'succeed'`: every format was written.
 * - `'failed'`: the resize failed (`error`) or some format failed (`files`).
 * - `'skipped'`: not written, being larger than the source with
 *   `upscale: false`.
 */
export interface ResultSetting {
  status: Exclude<ResultStatus, 'aborted'>;
  /** Width x height of the files. Planned size when the resize failed. */
  size: `${number}x${number}`;
  files: ResultFormat[];
  error?: unknown;
}

/**
 * Result of one source image.
 * - `'succeed'`: every setting succeeded or was skipped.
 * - `'failed'`: the source couldn't be read (`error`) or some setting failed.
 * - `'aborted'`: stopped before its settings were done, because another
 *   source failed with `abortScope: 'batch'` or the run was stopped (its
 *   `signal`). `outputsBySetting` has the settings done until then.
 * - `'skipped'`: unchanged since the run that wrote its files, see
 *   `generateAssets`' `manifest`.
 */
export interface ResultSource {
  status: ResultStatus;
  source: string;
  /** Size of the source as shown (auto-oriented), when it was read. */
  width?: number;
  height?: number;
  /**
   * What `afterSourceLoad` hooks recorded; absent when none did. A source
   * skipped as unchanged has none here: its data is the manifest's. See
   * `HookContext.record`.
   */
  data?: HookData;
  outputsBySetting: ResultSetting[];
  error?: unknown;
  /** Processing time in milliseconds. */
  duration: number;
}

/**
 * Result of a batch: one entry per source found, in path order.
 * - `'succeed'`: every source succeeded or was skipped.
 * - `'failed'`: no source was found, or some source failed or was aborted
 *   by another's failure.
 * - `'aborted'`: the run was stopped by its `signal`.
 */
export interface ResultBatch {
  status: Exclude<ResultStatus, 'skipped'>;
  sources: ResultSource[];
  /** Processing time in milliseconds. */
  duration: number;
}

/**
 * Settings of one output size. Width or height is required: omit one to keep
 * the source's aspect ratio.
 */
export type OutputSetting = (
  | {
      /** Fixed resolution or resolution multiplier. */
      width?: ResizeResolution;
      /** Fixed resolution or resolution multiplier. */
      height: ResizeResolution;
    }
  | {
      width: ResizeResolution;
      height?: ResizeResolution;
    }
) & {
  /**
   * Sharp advanced resize options: `fit`, `position`, `background`,
   * `kernel`, `withoutEnlargement`, …. Width and height come from the
   * setting.
   */
  resizeOptions?: Omit<ResizeOptions, 'width' | 'height'>;

  /**
   * Sharp extract region. Extraction is based on current iteration dimensions
   * and is performed after the resize.
   */
  extractRegion?: Region;

  /**
   * File name suffix. Can contain wildcards. Default: the `suffix` option.
   *
   * - wildcards:\
   * **`'{w}'`** for width in pixels;\
   * **`'{h}'`** for height in pixels;\
   * **`'{x}'`** for the size's multiplier, the `2` of `2x`;\
   * **`'{wx}'`** for the width's multiplier;\
   * **`'{hx}'`** for the height's multiplier.
   *
   * - example:
   * ```
   * // { width: 'x2' } of a 3072x2304 source, the source being x3,
   * // writes 'some-file@2x(2048x1536).webp'
   * '@{x}x({w}x{h})'
   * ```
   */
  suffix?: string;

  /** Force usage of source image for current size buffer and all formats for
   * it. */
  generateFromSource?: boolean;

  /** Force current buffer as source for the next size in the chain. */
  useAsNextResizeIteration?: boolean;
};
