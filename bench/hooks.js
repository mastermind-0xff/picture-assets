/**
 * What hooks cost: one 3901x2926 photo to 3 sizes in 2 formats, as in
 * pipeline.js, with a hook at one point per case.
 *
 * - `no hooks`: the baseline. A point without hooks does no work.
 * - `every point, no change`: a hook at all 6 points returning undefined,
 *   so nothing is baked: the cost of calling hooks (and their debug logs,
 *   filtered here).
 * - `afterSourceLoad: modulate`: a color grade, baked once at the source's
 *   full size.
 * - `afterSourceLoad: pixels() loop`: the same place in JS: a copy of the
 *   decoded source (32.7 MB), a gain on every byte, the pixels returned as
 *   they are.
 * - `afterResize: sharpen`: baked once per size, before the next size.
 * - `beforeEncode: overlay`: a translucent band composited on every size,
 *   baked once per size, for all its formats.
 * - `beforeFormat: sharpen WebP`: not baked, the sharpen runs in the WebP
 *   encode.
 * - `beforeFileWrite: WebP options`: the WebP files' own options set again
 *   on their sharp object, as a hook changing the quality would: the same
 *   bytes, so the time is the point's own. Nothing is baked.
 *
 * Run: npm run build && node bench/hooks.js [--quick]
 */
import { bench, compare } from '@mmutils/bench';

import {
  LIBRARY,
  PHOTO,
  measureOptions,
  outputDir,
  reporter,
} from './shared.js';

const { generateSingleSourceAssets } = await import(LIBRARY.href);

const SIZES = [2048, 1024, 512].map((width) => ({ width }));
const FORMATS = ['webp', 'jpg'];

const none = () => undefined;

const CASES = {
  'no hooks': [],
  'every point, no change': [
    {
      name: 'none',
      afterSourceLoad: none,
      beforeResize: none,
      afterResize: none,
      beforeEncode: none,
      beforeFormat: none,
      beforeFileWrite: none,
    },
  ],
  'afterSourceLoad: modulate': [
    {
      name: 'grade',
      afterSourceLoad: (image) =>
        image.modulate({ saturation: 1.1, brightness: 1.02 }),
    },
  ],
  'afterSourceLoad: pixels() loop': [
    {
      name: 'gain',
      afterSourceLoad: async (_image, { pixels }) => {
        const image = await pixels();
        const { data } = image;
        for (let index = 0; index < data.length; index++)
          data[index] = Math.min(255, data[index] * 1.05);
        return image;
      },
    },
  ],
  'afterResize: sharpen': [
    { name: 'sharpen', afterResize: (image) => image.sharpen({ sigma: 0.6 }) },
  ],
  'beforeEncode: overlay': [
    {
      name: 'overlay',
      beforeEncode: (image, { width, height }) =>
        image.composite([
          {
            input: {
              create: {
                width,
                height: Math.round(height / 12),
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.4 },
              },
            },
            gravity: 'south',
          },
        ]),
    },
  ],
  'beforeFormat: sharpen WebP': [
    {
      name: 'sharpenWebp',
      beforeFormat: (image, { format }) =>
        format === 'webp' ? image.sharpen({ sigma: 0.6 }) : undefined,
    },
  ],
  'beforeFileWrite: WebP options': [
    {
      name: 'webpOptions',
      beforeFileWrite: (image, { format, options }) =>
        format === 'webp' ? image.webp(options) : undefined,
    },
  ],
};

await compare(
  ...Object.entries(CASES).map(([name, hooks], index) => {
    const dir = outputDir('hooks', `case-${index}`);
    return bench(name, () =>
      generateSingleSourceAssets(PHOTO, dir, SIZES, FORMATS, {
        logger: 'silent',
        hooks,
      })
    );
  }),
  { ...measureOptions(), output: reporter() }
);
