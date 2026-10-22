/**
 * From files to markup: the result has everything a `<picture>` element
 * needs, each file's format, path and dimensions. This writes the assets of
 * a hero image and prints its HTML: AVIF and WebP sources, a JPEG fallback,
 * every width in a srcset, and the intrinsic size so the page doesn't
 * shift while it loads.
 *
 * Run: npm run build && node examples/picture.js
 */
import path from 'node:path';

import { generateSingleSourceAssets } from 'picture-assets';

const output = path.join(import.meta.dirname, 'output', 'picture');
const result = await generateSingleSourceAssets(
  path.join(import.meta.dirname, 'images', 'house-02.jpg'),
  path.join(output, 'hero'),
  [{ width: 2560 }, { width: 1920 }, { width: 1280 }, { width: 640 }],
  ['avif', 'webp', 'jpg'],
  { logger: 'warning' }
);
if (result.status !== 'succeed') throw new Error('Some files failed.');

// files by format, from the largest; URLs relative to the output directory
const files = result.outputsBySetting.flatMap((setting) => setting.files);
const srcset = (format) =>
  files
    .filter((file) => file.format === format && file.status === 'succeed')
    .map(({ file, fileData }) => `${path.basename(file)} ${fileData.width}w`)
    .join(', ');
// for the rare browser without srcset: a middle size
const fallback = files.find(
  (file) =>
    file.format === 'jpg' &&
    file.status === 'succeed' &&
    file.fileData.width <= 1280
);

console.log(`<picture>
  <source type="image/avif" srcset="${srcset('avif')}" sizes="100vw">
  <source type="image/webp" srcset="${srcset('webp')}" sizes="100vw">
  <img src="${path.basename(fallback.file)}" srcset="${srcset('jpg')}" sizes="100vw"
    width="${fallback.fileData.width}" height="${fallback.fileData.height}"
    alt="" loading="lazy" decoding="async">
</picture>`);
