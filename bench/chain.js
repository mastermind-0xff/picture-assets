/**
 * Chained sizes against every size from the source: the photo to the 6
 * widths of a typical srcset, in WebP.
 *
 * - `chained (default)`: each size is resized from the previous one, the
 *   largest from the photo.
 * - `from the source`: every size is resized from the photo
 *   (`generateFromSource: true`), decoding it each time; sharp's JPEG
 *   shrink-on-load makes the small sizes cheaper to decode.
 *
 * After the timing, the main thread checks what each costs in quality, on 3
 * photos: the SSIM (1 is identical) of each size against a reference
 * resized once from the photo's full resolution pixels. Chaining resamples
 * small sizes more than once; from the source, sharp's JPEG shrink-on-load
 * decodes small sizes approximately.
 *
 * Run: npm run build && node bench/chain.js [--quick]
 */
import path from 'node:path';

import { bench, compare, isWorker } from '@mmutils/bench';
import sharp from 'sharp';

import {
  IMAGES,
  LIBRARY,
  PHOTO,
  logger,
  measureOptions,
  outputDir,
  pixels,
  reporter,
  ssim,
  table,
} from './shared.js';

const { imageResize } = await import(LIBRARY.href);

const WIDTHS = [2560, 1920, 1280, 960, 640, 320];
const chainedDir = outputDir('chain', 'chained');
const sourceDir = outputDir('chain', 'source');
const run = (dir, generateFromSource) =>
  imageResize(
    PHOTO,
    dir,
    WIDTHS.map((width) => ({ width, generateFromSource })),
    ['webp'],
    { logger: 'silent' }
  );

await compare(
  bench('chained (default)', () => run(chainedDir, false)),
  bench('from the source', () => run(sourceDir, true)),
  { ...measureOptions(), output: reporter() }
);

if (!isWorker()) {
  logger.info(
    'Quality: SSIM against one resize from the full resolution pixels'
  );
  // 3 photos: their heights round differently at each width
  const photos = [
    [PHOTO, WIDTHS],
    [path.join(IMAGES, 'group-2', 'house-10.jpg'), [1920, 1280, 960, 640, 320]],
    [path.join(IMAGES, 'group-1', 'house-03.jpg'), [1600, 1200, 800, 400]],
  ];
  const rows = [['photo', 'width', 'chained', 'from the source']];
  for (const [photo, widths] of photos) {
    const name = path.basename(photo, '.jpg');
    // PNG: lossless, so only the resizing differs
    const write = (dir, generateFromSource) =>
      imageResize(
        photo,
        dir,
        widths.map((width) => ({ width, generateFromSource })),
        ['png'],
        { logger: 'silent' }
      );
    await write(chainedDir, false);
    await write(sourceDir, true);
    const full = await sharp(photo)
      .autoOrient()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const width of widths) {
      const score = async (dir) => {
        const output = await pixels(sharp, `${dir}${name}@${width}w.png`);
        // the same size, each side scaled to it, like the library does
        const reference = await pixels(
          sharp,
          await sharp(full.data, { raw: full.info })
            .resize(output.info.width, output.info.height, { fit: 'fill' })
            .png()
            .toBuffer()
        );
        return Number(
          ssim(reference.data, output.data, output.info).toFixed(4)
        );
      };
      rows.push([
        name,
        `${width}w`,
        await score(chainedDir),
        await score(sourceDir),
      ]);
    }
  }
  for (const line of table(rows)) console.log(line);
}
