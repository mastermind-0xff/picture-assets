/**
 * Quick start: one photo to a responsive set, 3 widths in AVIF, WebP and
 * JPEG, named after the photo: `house-01@1920w.avif`, ….
 *
 * The defaults do the rest: the photo is auto-oriented, every format gets
 * web-tuned options (AVIF q60, WebP q80, progressive JPEG q80), and each
 * size is resized from the previous one, the formats of a size encoded in
 * parallel.
 *
 * Run: npm run build && node examples/quick-start.js
 */
import path from 'node:path';

import { generateSingleSourceAssets } from 'picture-assets';

const result = await generateSingleSourceAssets(
  path.join(import.meta.dirname, 'images', 'house-01.jpg'),
  // a trailing separator: a directory, files named after the source
  path.join(import.meta.dirname, 'output', 'quick-start') + path.sep,
  [{ width: 1920 }, { width: 1280 }, { width: 640 }],
  ['avif', 'webp', 'jpg']
);

// the result has every size and file, with its dimensions and weight
for (const { size, files } of result.outputsBySetting)
  for (const file of files)
    if (file.status === 'succeed')
      console.log(
        `${size} ${file.format.padEnd(4)} ${String(file.fileData.size).padStart(7)} bytes`
      );
