/**
 * Multipliers: sizes for 1x, 2x and 3x screens, with the multiplier in the
 * file name. What `x1` is depends on `resizeStrategyHint`:
 *
 * - `'downsample'` (default): the photo is the largest size, so it is `x3`
 *   here, the highest multiplier: 3901, 2601 and 1300 pixels wide.
 * - `{ width, height }`: `x1` is that size, here a 640x480 slot: 640, 1280
 *   and 1920 pixels wide, whatever the size of the photo.
 * - `'upsample'` or `'x1'`: the photo is `x1`; larger sizes are upscaled.
 *
 * Suffix wildcards: `{w}`, `{h}`, `{sm}` (size multiplier), `{wm}`, `{hm}`.
 *
 * Run: npm run build && node examples/multipliers.js
 */
import path from 'node:path';

import { imageResize } from 'image-assets-generator';

const source = path.join(import.meta.dirname, 'images', 'house-01.jpg');
const output = path.join(import.meta.dirname, 'output', 'multipliers');
const settings = [
  { width: 'x3', suffix: '@3x' },
  { width: 'x2', suffix: '@2x' },
  { width: 'x1', suffix: '@1x' },
];

const sizes = (result) =>
  result.outputsBySetting.map(({ size }) => size).join(', ');

const downsampled = await imageResize(
  source,
  path.join(output, 'downsample', 'hero'),
  settings,
  ['webp'],
  { logger: 'warning' }
);
console.log(`downsample: ${sizes(downsampled)}`);

const slot = await imageResize(
  source,
  path.join(output, 'slot', 'hero'),
  // the suffix wildcards show what was computed: hero_x2_1280x960.webp
  settings.map((setting) => ({ ...setting, suffix: '_x{sm}_{w}x{h}' })),
  ['webp'],
  { logger: 'warning', resizeStrategyHint: { width: 640, height: 480 } }
);
console.log(`640x480 slot: ${sizes(slot)}`);
