import sharp, { type AvailableFormatInfo, type FormatEnum } from 'sharp';

import type { OutputFormat, OutputFormatsOptions } from '../types/output.js';

/** Sharp's format id of each output format; aliases share their format's. */
const SHARP_FORMAT_IDS = {
  avif: 'heif',
  gif: 'gif',
  heif: 'heif',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  jp2: 'jp2',
  jxl: 'jxl',
  png: 'png',
  tiff: 'tiff',
  tif: 'tiff',
  webp: 'webp',
} as const satisfies Record<OutputFormat, keyof FormatEnum>;

/** Output formats, in the order of `OutputFormatsOptions`. */
export const OUTPUT_FORMATS = Object.keys(SHARP_FORMAT_IDS) as OutputFormat[];

/** Formats whose options are shared by an alias: `jpg` uses `jpeg`'s. */
const OPTIONS_FORMAT: Partial<Record<OutputFormat, OutputFormat>> = {
  jpg: 'jpeg',
  tif: 'tiff',
};

/** Formats without an alpha channel: transparent images are flattened. */
const OPAQUE_FORMATS: ReadonlySet<OutputFormat> = new Set(['jpeg', 'jpg']);

/**
 * Default options per format, tuned for the web: small files that look the
 * same as the source at screen sizes.
 *
 * - `jpeg`: mozjpeg (trellis quantisation, progressive scans), about 10%
 *   smaller than libjpeg at the same quality.
 * - `avif`, `heif`: AVIF at quality 50 looks like JPEG at 80, at about half
 *   the size.
 * - `png`: lossless at the highest zlib compression. Its `quality` option
 *   is not set on purpose: it turns on a lossy palette.
 */
export const DEFAULT_FORMAT_OPTIONS = {
  avif: { quality: 50 },
  gif: {},
  heif: { quality: 50, compression: 'av1' },
  jpeg: { quality: 80, mozjpeg: true },
  jpg: {},
  jp2: {},
  jxl: {},
  png: { compressionLevel: 9 },
  tiff: {},
  tif: {},
  webp: { quality: 80 },
} as const satisfies OutputFormatsOptions;

/** Checks the value is an output format known by this library. */
export const isOutputFormat = (value: unknown): value is OutputFormat =>
  typeof value === 'string' && Object.hasOwn(SHARP_FORMAT_IDS, value);

/**
 * Checks the installed sharp can write the format: `jp2` and `jxl` need a
 * custom libvips build.
 */
export const canWriteFormat = (format: OutputFormat): boolean =>
  sharp.format[SHARP_FORMAT_IDS[format]].output.file;

/**
 * Name of the format for sharp's `toFormat`, which takes `avif` but not the
 * `jpg` and `tif` aliases.
 */
export const toSharpFormat = (
  format: OutputFormat
): keyof FormatEnum | 'avif' =>
  format === 'jpg' ? 'jpeg'
  : format === 'tif' ? 'tiff'
  : format;

/** Checks the format keeps transparency. */
export const supportsAlpha = (format: OutputFormat): boolean =>
  !OPAQUE_FORMATS.has(format);

/**
 * Options of a format: the defaults, then `formatOptions` and the options
 * given with the format, each merged over the previous. Aliases (`jpg`,
 * `tif`) read their format's options first.
 */
export const resolveFormatOptions = <F extends OutputFormat>(
  format: F,
  formatOptions: { readonly [K in OutputFormat]?: OutputFormatsOptions[K] },
  callOptions?: OutputFormatsOptions[F]
): OutputFormatsOptions[F] => {
  const base = OPTIONS_FORMAT[format];
  return {
    ...(base && DEFAULT_FORMAT_OPTIONS[base]),
    ...DEFAULT_FORMAT_OPTIONS[format],
    ...(base && formatOptions[base]),
    ...formatOptions[format],
    ...callOptions,
  };
};

/**
 * File extensions, lower case without the dot, that the installed sharp can
 * read: `jpg`, `jpeg`, `png`, `webp`, `avif`, `tif`, `gif`, `svg`, ….
 */
export const INPUT_EXTENSIONS: ReadonlySet<string> = new Set(
  (Object.values(sharp.format) as AvailableFormatInfo[]).flatMap(({ input }) =>
    input.file ?
      (input.fileSuffix?.map((suffix) => suffix.slice(1).toLowerCase()) ?? [])
    : []
  )
);

/** Checks sharp can read a file, from its name. */
export const isInputFile = (fileName: string): boolean => {
  const name = fileName.toLowerCase();
  for (const extension of INPUT_EXTENSIONS)
    if (name.endsWith(`.${extension}`)) return true;
  return false;
};
