/**
 * Hooks with pixels: what a hook gives is the image from then on, its size
 * and transparency included.
 *
 * - `upscaler` at `source`: a stand-in for an AI upscaler (onnxruntime, an
 *   external binary), which takes pixels and gives back pixels twice the
 *   size. The sizes are planned after it: the 1300 pixels wide photo gets
 *   the `responsive` preset's 2560 and 1920, which the preset skips without
 *   the hook (`upscale: false` is its default).
 * - `vignette` at `source`, after the upscaler: a loop over the pixels that
 *   fades the edges to transparent. The source has alpha from then on, so
 *   every size keeps it, and `'fallback'` writes PNG instead of JPEG.
 *
 * Run: npm run build && node examples/hooks-pixels.js
 */
import path from 'node:path';

import { generateAssets } from 'picture-assets';
import sharp from 'sharp';

const input = path.join(
  import.meta.dirname,
  'images',
  'house-01-low-res@1300w.jpg'
);
const output = path.join(import.meta.dirname, 'output', 'hooks-pixels');

/** The model's stand-in: pixels in, pixels twice the size out. */
const upscale2x = async ({ data, info }) => {
  const { width, height, channels } = info;
  const result = await sharp(data, { raw: info })
    .resize(width * 2, height * 2, { kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: result.data,
    info: { width: width * 2, height: height * 2, channels },
  };
};

/** @type {import('picture-assets').Hook} */
const upscaler = {
  name: 'upscaler',
  // in the manifest's hash: change it with the model
  key: 'stand-in-2x',
  source: async (_image, { pixels, signal }) => {
    const upscaled = await upscale2x(await pixels());
    // a long job checks the run's signal: Ctrl+C stops it
    signal.throwIfAborted();
    return upscaled;
  },
};

/** @type {import('picture-assets').Hook} */
const vignette = {
  name: 'vignette',
  source: async (_image, { pixels }) => {
    const { data, info } = await pixels();
    const { width, height, channels } = info;
    const rgba = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const from = (y * width + x) * channels;
        const to = (y * width + x) * 4;
        // 0 in the middle, 1 in the corners
        const distance =
          Math.hypot(x / width - 0.5, y / height - 0.5) * Math.SQRT2;
        rgba[to] = data[from];
        rgba[to + 1] = data[from + 1];
        rgba[to + 2] = data[from + 2];
        rgba[to + 3] = Math.round(
          255 * Math.min(1, Math.max(0, (1 - distance) / 0.35))
        );
      }
    return { data: rgba, info: { width, height, channels: 4 } };
  },
};

const run = async (name, hooks) => {
  const batch = await generateAssets({
    input,
    output: path.join(output, name),
    formats: ['webp', 'fallback'],
    logger: 'warning',
    hooks,
  });
  const [source] = batch.sources;
  console.log(`${name}: a ${source?.width}x${source?.height} source`);
  for (const { size, status, files } of source?.outputsBySetting ?? [])
    console.log(
      `  ${size.padEnd(9)} ${
        status === 'skipped' ?
          'skipped: larger than the source'
        : files.map((file) => path.basename(file.file)).join(', ')
      }`
    );
};

await run('plain', []);
await run('hooked', [upscaler, vignette]);
