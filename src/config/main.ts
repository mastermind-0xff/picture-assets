import { OutputFormatsOptions, SizeMultiplier } from '../lib/image-resize';

/**
 * Multiplier behavior allowed values.
 */
export type SourceMultiplierBehavior =
  | 'auto'
  | 'downsample'
  | 'upscale'
  | SizeMultiplier;

/**
 * Configuration object type.
 */
export type ImageResizeOptions = {
  /**
   * Default options for each filetype.
   */
  readonly OUTPUT_FORMATS_OPTIONS_DEFAULT: OutputFormatsOptions;
  /**
   * When using size multiplier for output image width or height **downsample**
   * means the source is considered the highest resolution image and all other
   * sizes are downsampled. With **upscale** source is considered the lowest
   * resolution image and all other sizes are scaled up. When source multiplier
   * is hardcoded all other sizes are calculated accordingly.
   *
   * **default:** 'downsample'
   *
   * **examples**
   * ```typescript
   * // source @ 300x300px
   * console.log(imageResizeAsync(
   *  'image.jpg',
   *  './dest/',
   *  [
   *    { width: 'x3', suffix: '@3x({w}w)' },
   *    { width: 'x2', suffix: '@2x({w}w)' },
   *    { width: 'x1', suffix: '@1x({w}w)' },
   *  ],
   *  ['webp']))
   * // downsample will output
   * // {in:'image.jpg',
   * //  out:[
   * //   './dest/image@3x(300w).webp',
   * //   './dest/image@2x(200w).webp',
   * //   './dest/image@1x(100w).webp'
   * //  ]}
   *
   * // upscale will output
   * // {in:'image.jpg',
   * //  out:[
   * //   './dest/image@3x(900w).webp',
   * //   './dest/image@2x(600w).webp',
   * //   './dest/image@1x(300w).webp'
   * //  ]}
   *
   * // x2 will output
   * // {in:'image.jpg',
   * //  out:[
   * //   './dest/image@3x(450w).webp',
   * //   './dest/image@2x(300w).webp',
   * //   './dest/image@1x(150w).webp'
   * //  ]}
   * ```
   *
   */
  readonly SOURCE_MULTIPLIER_BEHAVIOR: SourceMultiplierBehavior;

  /**
   * Default suffix for all outputted file names. Use '{w}' for output width and
   * '{h}' for output height. Strips slashes. Accounts for '0' and empty input.
   * @default string '@{w}w'
   */
  readonly SUFFIX_DEFAULT: string;
  /**
   * Enable or disable console messages. Provide truthful value to enable.
   */
  readonly DEBUG: boolean;
};

/** Configuration object. */
export const ImageResizeConfig: ImageResizeOptions = {
  OUTPUT_FORMATS_OPTIONS_DEFAULT: {
    avif: { quality: 80 },
    gif: { colors: 256 },
    heif: { quality: 80 },
    jpeg: { quality: 80 },
    jpg: { quality: 80 },
    jp2: { quality: 80 },
    jxl: { quality: 80 },
    png: { quality: 80 },
    tiff: { quality: 80 },
    tif: { quality: 80 },
    webp: { quality: 80 },
    dz: {},
    fits: {},
    input: {},
    magick: {},
    openslide: {},
    pdf: {},
    ppm: {},
    raw: {},
    svg: {},
    v: {},
  },

  SOURCE_MULTIPLIER_BEHAVIOR: (() => {
    switch (process.env.SIZE_MULTIPLIER_BEHAVIOR) {
      case 'x1':
      case 'x2':
      case 'x3':
      case 'x4':
      case 'x5':
      case 'upscale':
        return process.env.SIZE_MULTIPLIER_BEHAVIOR;
      default:
        return 'downsample';
    }
  })(),
  SUFFIX_DEFAULT:
    typeof process.env.IMAGE_RESIZE_SUFFIX_DEFAULT !== 'undefined' ?
      process.env.IMAGE_RESIZE_SUFFIX_DEFAULT.replace(/[/\\]+/g, '')
    : '@{w}w',

  DEBUG:
    (
      process.env.IMAGE_RESIZE_DEBUG === '1' ||
      process.env.IMAGE_RESIZE_DEBUG === 'true'
    ) ?
      true
    : false,
};
