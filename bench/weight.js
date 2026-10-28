/**
 * Quality against weight: what each format and quality gives for its bytes.
 * Three photos (landscape, portrait, square) resized to 1280 pixels wide,
 * encoded with each setting, decoded again and compared with the resized
 * pixels (SSIM, 1 is identical). Not a timing benchmark: the encode times
 * are single runs, see bench/formats.js for measured ones.
 *
 * The library's defaults are marked: they should give the smallest files at
 * a quality close to JPEG at 80, the usual web baseline.
 *
 * Run: npm run build && node bench/weight.js
 */
import path from 'node:path';

import sharp from 'sharp';

import {
  describeOptions,
  IMAGES,
  LIBRARY,
  logger,
  pixels,
  ssim,
  table,
} from './shared.js';

const { DEFAULT_FORMAT_OPTIONS: DEFAULTS } = await import(LIBRARY.href);

const PHOTOS = [
  'house-01.jpg',
  'group-2/house-09.jpg',
  'group-2/set-2/house-11.jpg',
];
const WIDTH = 1280;

// format, options, the library's default; named after their options. The
// first is the baseline.
const SETTINGS = [
  ['jpeg', { quality: 80 }],
  ['jpeg', DEFAULTS.jpeg, true],
  ['jpeg', { quality: 80, mozjpeg: true }],
  ['jpeg', { quality: 86, mozjpeg: true }],
  ['webp', DEFAULTS.webp, true],
  ['webp', { ...DEFAULTS.webp, quality: 75 }],
  // sharp's effort: the same SSIM, fewer bytes, 4 times the encode time
  ['avif', { ...DEFAULTS.avif, quality: 60, effort: 4 }],
  ['avif', DEFAULTS.avif, true],
  ['avif', { ...DEFAULTS.avif, quality: 50 }],
  ['png', { compressionLevel: 6 }],
  ['png', DEFAULTS.png, true],
];

const resized = await Promise.all(
  PHOTOS.map((photo) =>
    sharp(path.join(IMAGES, photo))
      .autoOrient()
      .resize(WIDTH)
      .raw()
      .toBuffer({ resolveWithObject: true })
  )
);

logger.info(
  `${PHOTOS.length} photos at ${WIDTH}w, ${SETTINGS.length} settings: averages`
);
const baseline = { bytes: 0 };
const rows = [['format', 'setting', 'kB', 'vs baseline', 'SSIM', 'encode ms']];
for (const [index, [format, options, isDefault]] of SETTINGS.entries()) {
  let bytes = 0;
  let quality = 0;
  let time = 0;
  for (const { data, info } of resized) {
    const start = performance.now();
    const encoded = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .toFormat(format, options)
      .toBuffer();
    time += performance.now() - start;
    bytes += encoded.length;
    const decoded = await pixels(sharp, encoded);
    quality += ssim(data, decoded.data, info);
  }
  bytes /= resized.length;
  if (baseline.bytes === 0) baseline.bytes = bytes;
  rows.push([
    format,
    `${describeOptions(options)}${isDefault ? ' (default)' : ''}${index === 0 ? ' baseline' : ''}`,
    Number((bytes / 1000).toFixed(1)),
    `${Math.round((bytes / baseline.bytes) * 100)}%`,
    Number((quality / resized.length).toFixed(4)),
    Math.round(time / resized.length),
  ]);
}
for (const line of table(rows)) console.log(line);
