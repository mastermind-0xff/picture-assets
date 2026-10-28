/**
 * Encoding cost per format: the photo resized once to 1280 pixels wide
 * (prepared at the top level, so every worker has it), then encoded to a
 * buffer with the library's default options, and with the options they
 * replace. Only the encoder is measured: no decoding, resizing or writing.
 *
 * What the bytes buy is in bench/weight.js.
 *
 * Run: npm run build && node bench/formats.js [--quick]
 */
import { bench, compare } from '@mmutils/bench';
import sharp from 'sharp';

import {
  describeOptions,
  LIBRARY,
  PHOTO,
  reporter,
  timedMeasureOptions,
} from './shared.js';

const { DEFAULT_FORMAT_OPTIONS: DEFAULTS } = await import(LIBRARY.href);

const { data, info } = await sharp(PHOTO)
  .autoOrient()
  .resize(1280)
  .raw()
  .toBuffer({ resolveWithObject: true });
const image = () =>
  sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  });

await compare(
  bench('jpeg q80 baseline', () => image().jpeg({ quality: 80 }).toBuffer()),
  bench(`jpeg ${describeOptions(DEFAULTS.jpeg)} (default)`, () =>
    image().jpeg(DEFAULTS.jpeg).toBuffer()
  ),
  bench('jpeg q86 mozjpeg', () =>
    image().jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  ),
  bench(`webp ${describeOptions(DEFAULTS.webp)} (default)`, () =>
    image().webp(DEFAULTS.webp).toBuffer()
  ),
  bench(`avif ${describeOptions(DEFAULTS.avif)} (default)`, () =>
    image().avif(DEFAULTS.avif).toBuffer()
  ),
  // sharp's effort
  bench('avif q60 effort 4', () =>
    image()
      .avif({ ...DEFAULTS.avif, quality: 60, effort: 4 })
      .toBuffer()
  ),
  bench('png zlib 6', () => image().png().toBuffer()),
  bench(`png ${describeOptions(DEFAULTS.png)} (default)`, () =>
    image().png(DEFAULTS.png).toBuffer()
  ),
  { ...timedMeasureOptions(), output: reporter() }
);
