/**
 * The library's pipeline against plain sharp: one 3901x2926 photo to 3
 * sizes in 2 formats, with the same encoder options in every case.
 *
 * - `sharp, naive`: one sharp call per output file, so the photo is decoded
 *   and resized 6 times (the unoptimized case of the old min-max benchmark).
 * - `sharp, decode per size`: each size resized once to a raw buffer, its
 *   formats encoded from it in parallel (the old optimized case).
 * - `generateSingleSourceAssets`: the photo read once, each size resized from the previous
 *   one, formats in parallel.
 *
 * Run: npm run build && node bench/pipeline.js [--quick]
 */
import { bench, compare } from '@mmutils/bench';
import sharp from 'sharp';

import {
  LIBRARY,
  PHOTO,
  measureOptions,
  outputDir,
  reporter,
} from './shared.js';

const { generateSingleSourceAssets, DEFAULT_FORMAT_OPTIONS } = await import(
  LIBRARY.href
);

const WIDTHS = [2048, 1024, 512];
const FORMATS = [
  { format: 'webp', extension: 'webp', options: DEFAULT_FORMAT_OPTIONS.webp },
  { format: 'jpeg', extension: 'jpg', options: DEFAULT_FORMAT_OPTIONS.jpeg },
];

const naiveDir = outputDir('pipeline', 'naive');
const perSizeDir = outputDir('pipeline', 'per-size');
const libraryDir = outputDir('pipeline', 'library');

await compare(
  bench('sharp, naive', async () => {
    const files = [];
    for (const width of WIDTHS)
      for (const { format, extension, options } of FORMATS)
        files.push(
          await sharp(PHOTO)
            .autoOrient()
            .resize(width)
            .toFormat(format, options)
            .toFile(`${naiveDir}house-01@${width}w.${extension}`)
        );
    return files;
  }),

  bench('sharp, decode per size', async () => {
    const files = [];
    for (const width of WIDTHS) {
      const { data, info } = await sharp(PHOTO)
        .autoOrient()
        .resize(width)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const { channels, height } = info;
      const resized = sharp(data, { raw: { width, height, channels } });
      files.push(
        ...(await Promise.all(
          FORMATS.map(({ format, extension, options }) =>
            resized
              .clone()
              .toFormat(format, options)
              .toFile(`${perSizeDir}house-01@${width}w.${extension}`)
          )
        ))
      );
    }
    return files;
  }),

  bench('generateSingleSourceAssets', () =>
    generateSingleSourceAssets(
      PHOTO,
      libraryDir,
      WIDTHS.map((width) => ({ width })),
      FORMATS.map(({ extension }) => extension),
      { logger: 'silent' }
    )
  ),

  { ...measureOptions(), output: reporter() }
);
