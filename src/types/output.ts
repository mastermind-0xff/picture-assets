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
  | readonly OutputFormat[]
  | { readonly [F in OutputFormat]?: OutputFormatsOptions[F] };

/** Image processing result completion type. */
export type ResultStatus = 'succeed' | 'failed' | 'aborted';

/**
 * Result of one output file.
 * - `'succeed'`: written; `fileData` has its size and dimensions.
 * - `'failed'`: not written; `error` tells why.
 */
export type ResultFormat = { format: OutputFormat; file: string } & (
  | { status: 'succeed'; fileData: OutputInfo }
  | { status: 'failed'; error: unknown }
);

/**
 * Result of one output setting (one size) of a source.
 * - `'succeed'`: every format was written.
 * - `'failed'`: the resize failed (`error`) or some format failed (`files`).
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
 * - `'succeed'`: every setting succeeded.
 * - `'failed'`: the source couldn't be read (`error`) or some setting failed.
 * - `'aborted'`: stopped before its settings were done, because another
 *   source failed with `abortScope: 'batch'`. `outputsBySetting` has the
 *   settings done until then.
 */
export interface ResultSource {
  status: ResultStatus;
  source: string;
  outputsBySetting: ResultSetting[];
  error?: unknown;
  /** Processing time in milliseconds. */
  duration: number;
}

/**
 * Result of a batch: one entry per source found, in path order.
 * - `'succeed'`: every source succeeded.
 * - `'failed'`: no source was found, or some source failed or was aborted.
 */
export interface ResultBatch {
  status: Exclude<ResultStatus, 'aborted'>;
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
   * **`'{w}'`** for width;\
   * **`'{h}'`** for height;\
   * **`'{sm}'`** for size multiplier;\
   * **`'{wm}'`** for width's multiplier;\
   * **`'{hm}'`** for height's multiplier.
   *
   * - example:
   * ```
   * // with source at x3 and width: 2048, height: 1536\
   * // parsed as 'some-file@x2(1024x768).webp'
   * '@x{sm}({w}x{h})'
   * ```
   */
  suffix?: string;

  /** Force usage of source image for current size buffer and all formats for
   * it. */
  generateFromSource?: boolean;

  /** Force current buffer as source for the next size in the chain. */
  useAsNextResizeIteration?: boolean;
};
