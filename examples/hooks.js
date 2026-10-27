/**
 * Hooks: functions in the resize chain, at the points they implement.
 *
 * - `afterSourceLoad`: a color grade, once per source, before the sizes
 *   are planned: the cheapest place for heavy work.
 * - `beforeResize`: a hero crop. Sizes with another aspect ratio are cut
 *   around a focal point before they are resized, where the built-in crop
 *   keeps the middle (or, with `position: 'attention'`, what sharp finds
 *   interesting).
 * - `beforeEncode`: a watermark on every file, at each size's own scale.
 *   The next sizes are resized from the image without it: the chain splits
 *   before the files.
 * - `beforeFormat`: a little sharpening for AVIF only, which smooths fine
 *   detail.
 * - `beforeFileWrite`: a lower AVIF quality for the 1600 wide files, which
 *   a 2x screen (two device pixels per CSS pixel) shows at half their
 *   pixels. The run set the format and its options before this point: the
 *   hook's quality wins.
 *
 * Two hooks `record` what they did: the hero crop its box, on each file of
 * the size it cut, and the quality hook its quality, on the file it set it
 * for. The data is in the results, and in the manifest with
 * `generateAssets`.
 *
 * `logger: 'debug'` logs when each hook starts and ends, with its time, and
 * the default logger's timestamps have milliseconds.
 *
 * Run: npm run build && node examples/hooks.js
 */
import path from 'node:path';

import { generateSingleSourceAssets } from 'picture-assets';

/** What matters in house-01.jpg, as fractions of its size: the house. */
const FOCAL_POINT = { x: 0.62, y: 0.55 };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** @type {import('picture-assets').Hook} */
const colorGrade = {
  name: 'colorGrade',
  // in the manifest's hash: change it when the grade changes
  key: 'warm-1',
  afterSourceLoad: (image) =>
    image.modulate({ saturation: 1.12, brightness: 1.02 }).linear(1.04, -4),
};

/** @type {import('picture-assets').Hook} */
const heroCrop = {
  name: 'heroCrop',
  beforeResize: (image, { setting, width, height, record }) => {
    const ratio = setting.width / setting.height;
    // the image's own shape: nothing to cut
    if (Math.abs(ratio - width / height) < 0.01) return undefined;
    const cropWidth = Math.min(width, Math.round(height * ratio));
    const cropHeight = Math.min(height, Math.round(cropWidth / ratio));
    const box = {
      left: clamp(
        Math.round(FOCAL_POINT.x * width - cropWidth / 2),
        0,
        width - cropWidth
      ),
      top: clamp(
        Math.round(FOCAL_POINT.y * height - cropHeight / 2),
        0,
        height - cropHeight
      ),
      width: cropWidth,
      height: cropHeight,
    };
    record('box', box);
    return image.extract(box);
  },
};

/** @type {import('picture-assets').Hook} */
const watermark = {
  name: 'watermark',
  beforeEncode: (image, { width, height }) => {
    const size = Math.max(12, Math.round(width / 40));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="${width - size}" y="${height - size}" text-anchor="end"
        font-family="sans-serif" font-size="${size}" fill="#fff"
        fill-opacity="0.7">© picture-assets</text>
    </svg>`;
    return image.composite([{ input: Buffer.from(svg) }]);
  },
};

/** @type {import('picture-assets').Hook} */
const avifSharpen = {
  name: 'avifSharpen',
  beforeFormat: (image, { format }) =>
    format === 'avif' ? image.sharpen({ sigma: 0.5 }) : undefined,
};

/** @type {import('picture-assets').Hook} */
const largeAvifQuality = {
  name: 'largeAvifQuality',
  beforeFileWrite: (image, { format, width, record }) => {
    if (format !== 'avif' || width < 1600) return undefined;
    record('quality', 45);
    return image.avif({ quality: 45 });
  },
};

const result = await generateSingleSourceAssets(
  path.join(import.meta.dirname, 'images', 'house-01.jpg'),
  path.join(import.meta.dirname, 'output', 'hooks', 'house'),
  [
    { width: 1600 },
    { width: 800 },
    { width: 600, height: 800, suffix: '-mobile@{w}w' },
  ],
  ['avif', 'webp', 'jpg'],
  {
    logger: 'debug',
    hooks: [colorGrade, heroCrop, watermark, avifSharpen, largeAvifQuality],
  }
);

console.log();
for (const { size, files } of result.outputsBySetting)
  console.log(
    `${size.padEnd(9)} ${files.map((file) => path.basename(file.file)).join(', ')}`
  );

// what the hooks recorded, by file
console.log();
for (const file of result.outputsBySetting.flatMap(({ files }) => files))
  if (file.data)
    console.log(`${path.basename(file.file)}: ${JSON.stringify(file.data)}`);
