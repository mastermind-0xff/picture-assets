/**
 * Art direction: other aspect ratios and crops of the same photo.
 *
 * - A width and a height with another aspect ratio crop the photo to fill
 *   them (`fit: 'cover'`); `resizeOptions.position` picks what to keep,
 *   `'attention'` the most interesting part.
 * - `fit: 'contain'` keeps the whole photo and pads it with `background`.
 * - `extractRegion` cuts a region out of the resized image: a 400x400 detail
 *   of the 1600 pixels wide photo.
 *
 * Crops and other aspect ratios are never reused for the next size, so they
 * can't distort it.
 *
 * Run: npm run build && node examples/art-direction.js
 */
import path from 'node:path';

import { generateSingleSourceAssets } from 'picture-assets';

const result = await generateSingleSourceAssets(
  path.join(import.meta.dirname, 'images', 'house-01.jpg'),
  path.join(import.meta.dirname, 'output', 'art-direction', 'house'),
  [
    { width: 1200 },
    {
      width: 1200,
      height: 400,
      suffix: '-banner',
      resizeOptions: { position: 'attention' },
    },
    { width: 600, height: 600, suffix: '-square' },
    {
      width: 600,
      height: 600,
      suffix: '-contained',
      resizeOptions: { fit: 'contain', background: '#f4f1ea' },
    },
    {
      width: 1600,
      extractRegion: { left: 700, top: 500, width: 400, height: 400 },
      suffix: '-detail',
    },
  ],
  ['webp']
);

for (const { size, files } of result.outputsBySetting)
  console.log(`${size.padEnd(9)} ${path.basename(files[0]?.file ?? '')}`);
