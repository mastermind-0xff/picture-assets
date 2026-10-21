import sharp, {
  OutputOptions,
  AvifOptions,
  GifOptions,
  HeifOptions,
  JpegOptions,
  Jp2Options,
  JxlOptions,
  PngOptions,
  TiffOptions,
  WebpOptions,
  Region,
  ResizeOptions,
} from 'sharp';
import { ResizeResolution } from './size';
import type { AtLeastOneItem, AtLeastOneProperty } from '@mmtypes/common';

/** List of available output file types and their corresponding options.*/
export type OutputFormatsOptions = {
  [K in keyof sharp.FormatEnum]: OutputOptions;
} & {
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
};

/** List of available output file types. */
export type OutputFormat = keyof OutputFormatsOptions;

/**
 * List of output filetype strings or object, containing filetype as key and
 * options object as value.
 */
export type AtLeastOneOutputFormat =
  | AtLeastOneItem<(keyof OutputFormatsOptions)[]>
  | AtLeastOneProperty<OutputFormatsOptions>;

/** Image processing result completion type. */
export type ResultStatus = 'succeed' | 'failed' | 'aborted';

/** Result from a batch source images processing. */
export type ResultBatch = {
  status: ResultStatus;
  sources: ResultSource[] | undefined;
};

/** Result from a single source image processing. */
export type ResultSource = {
  status: ResultStatus;
  source: string;
  outputsBySetting: ResultSetting[] | undefined;
};

/** Result from a single source's output setting processing. */
export type ResultSetting = {
  status: ResultStatus;
  size: `${number}x${number}`;
  files: ResultFormat[] | undefined;
};

/** Result from a single source's output format processing. */
export type ResultFormat = {
  status: ResultStatus;
  format: OutputFormat;
  file: string;
} & (
  | { status: 'aborted' }
  | { status: 'failed'; error: unknown }
  | { status: 'succeed'; fileData: sharp.OutputInfo }
);

/**
 *  Settings for the output files. Width or height is required for each setting.
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
  /** Sharp advanced resize options. */
  resizeOptions?: ResizeOptions;

  /** Sharp extract region. Extraction is based on current iteration dimensions
   * and is preformed after the resize. */
  extractRegion?: Region;

  /**
   * File name suffix. Can contain wildcards.
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
