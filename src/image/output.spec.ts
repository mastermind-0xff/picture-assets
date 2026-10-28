import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { generateAssets } from '../lib/generate-assets.js';
import { generateSingleSourceAssets } from '../lib/generate-single-source-assets.js';
import {
  createTempDir,
  opaqueImage,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import { ssim } from '../test-utils/ssim.js';
import type { Hook } from '../types/hooks.js';
import type { OutputSetting } from '../types/output.js';
import { decodesFirst, type SourcePlan } from './output.js';
import type { ResolvedOutputSettings } from './resolve-settings.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());

const outDir = () => path.join(dir, 'out', `${++testIndex}`) + path.sep;

/** A 4000x3000 source's plan, its sizes from the largest. */
const plan = (...sizes: Partial<ResolvedOutputSettings>[]): SourcePlan => ({
  width: 4000,
  height: 3000,
  hasAlpha: false,
  settings: sizes as ResolvedOutputSettings[],
  encoders: [],
});

describe('decodesFirst', () => {
  test('JPEG: below a 3x shrink of the first size, where shrink-on-load gains nothing', () => {
    expect(decodesFirst('jpeg', plan({ width: 2560, height: 1920 }))).toBe(
      true
    );
    expect(decodesFirst('jpeg', plan({ width: 1400, height: 1050 }))).toBe(
      true
    );
    expect(decodesFirst('jpeg', plan({ width: 1333, height: 1000 }))).toBe(
      false
    );
    // a crop: the axis shrunk least decides
    expect(decodesFirst('jpeg', plan({ width: 1000, height: 1500 }))).toBe(
      true
    );
    // skipped sizes are not made
    expect(
      decodesFirst(
        'jpeg',
        plan(
          { width: 5000, height: 3750, skipped: true },
          { width: 1000, height: 750 }
        )
      )
    ).toBe(false);
    expect(
      decodesFirst('jpeg', plan({ width: 5000, height: 3750, skipped: true }))
    ).toBe(false);
  });

  test('formats without a scaled decode always, WebP and others never', () => {
    const small = plan({ width: 100, height: 75 });
    for (const format of ['png', 'heif', 'gif', 'tiff'])
      expect(decodesFirst(format, small), format).toBe(true);
    for (const format of ['webp', 'svg', 'pdf', 'jp2'])
      expect(
        decodesFirst(format, plan({ width: 2560, height: 1920 })),
        format
      ).toBe(false);
  });
});

describe('sources decoded first', () => {
  const decoded = async (
    source: string,
    sizes: OutputSetting[],
    formats = ['png'] as const
  ) => {
    const { logger, messages } = createRecordingLogger();
    const out = outDir();
    await generateSingleSourceAssets(file(source), out, sizes, [...formats], {
      logger,
    });
    return {
      out,
      decoded: messages('verbose').some((message) =>
        message.startsWith('Decoded ')
      ),
    };
  };

  test('decoded when the first size gains nothing from the file', async () => {
    expect((await decoded('landscape.jpg', [{ width: 400 }])).decoded).toBe(
      true
    );
    expect((await decoded('landscape.jpg', [{ width: 200 }])).decoded).toBe(
      false
    );
    expect((await decoded('transparent.png', [{ width: 100 }])).decoded).toBe(
      true
    );
    expect((await decoded('small.webp', [{ width: 150 }])).decoded).toBe(false);
  });

  test('the same image as resized from the file, every size, EXIF orientation applied', async () => {
    const { out } = await decoded('portrait-exif.jpg', [
      { width: 450 },
      { width: 150 },
    ]);
    for (const width of [450, 150]) {
      const written = await fs.readFile(`${out}portrait-exif@${width}w.png`);
      expect(await sharp(written).metadata()).toMatchObject({
        width,
        height: (width * 4) / 3,
      });
      const fromFile = await sharp(await fs.readFile(file('portrait-exif.jpg')))
        .autoOrient()
        .resize(width)
        .png()
        .toBuffer();
      expect(await ssim(written, fromFile)).toBeGreaterThan(0.99);
    }
  });

  test("an afterSourceLoad hook's decode is reused: decoded once", async () => {
    const readsPixels: Hook = {
      name: 'detector',
      afterSourceLoad: async (_image, { pixels }) => {
        await pixels();
      },
    };
    const run = async (source: string, width: number) => {
      const { logger, messages } = createRecordingLogger();
      const raw = vi.spyOn(sharp.prototype, 'raw');
      await generateSingleSourceAssets(
        file(source),
        outDir(),
        [{ width }],
        ['png'],
        {
          logger,
          hooks: [readsPixels],
        }
      );
      const calls = raw.mock.calls.length;
      raw.mockRestore();
      return {
        calls,
        reused: messages('verbose').some((message) =>
          /^Decoded .* for its hooks: its sizes resize from its pixels$/.test(
            message
          )
        ),
      };
    };
    // decoded once for the hook, then one resize: no second decode
    expect(await run('landscape.jpg', 400)).toEqual({ calls: 2, reused: true });
    // a WebP is never decoded first, but once decoded, its pixels serve
    expect(await run('small.webp', 150)).toEqual({ calls: 2, reused: true });
  });

  test("a source decoded for its alpha: decoded once, for its sizes and its hooks' pixels", async () => {
    const source = path.join(dir, 'opaque-alpha.png');
    await opaqueImage(400, 300).ensureAlpha().png().toFile(source);
    const run = async (hooks: Hook[]) => {
      const { logger, messages } = createRecordingLogger();
      const raw = vi.spyOn(sharp.prototype, 'raw');
      await generateSingleSourceAssets(
        source,
        outDir(),
        [{ width: 200 }],
        ['fallback'],
        { logger, hooks }
      );
      const calls = raw.mock.calls.length;
      raw.mockRestore();
      return {
        calls,
        reused: messages('verbose').some((message) =>
          /^Decoded .* for its alpha: its sizes resize from its pixels$/.test(
            message
          )
        ),
      };
    };
    // the check's decode, then one resize
    expect(await run([])).toEqual({ calls: 2, reused: true });
    expect(
      await run([
        {
          name: 'detector',
          afterSourceLoad: async (_image, { pixels }) => {
            await pixels();
          },
        },
      ])
    ).toEqual({ calls: 2, reused: true });
  });

  test('transparency kept', async () => {
    const { out } = await decoded('transparent.png', [{ width: 200 }]);
    const { data, info } = await sharp(
      await fs.readFile(`${out}transparent@200w.png`)
    )
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    // a corner is transparent, the middle opaque red
    expect(data[3]).toBe(0);
    const middle = (100 * 200 + 100) * 4;
    expect([...data.subarray(middle, middle + 4)]).toEqual([220, 30, 30, 255]);
  });
});

describe('removeOpaqueAlpha', () => {
  const read = (image: string) => fs.readFile(image);
  const metadata = async (image: string) => sharp(await read(image)).metadata();
  const rgb = async (image: string) =>
    sharp(await read(image))
      .removeAlpha()
      .raw()
      .toBuffer();

  test('off by default: an opaque alpha channel is kept; on: left out, the same pixels', async () => {
    const source = path.join(dir, 'opaque-rgba.png');
    await opaqueImage(400, 300).ensureAlpha().png().toFile(source);
    const run = async (options: { removeOpaqueAlpha?: boolean }) => {
      const out = outDir();
      await generateSingleSourceAssets(
        source,
        out,
        [{ width: 200 }],
        ['png', 'avif'],
        { logger: 'silent', ...options }
      );
      return (format: string) => `${out}opaque-rgba@200w.${format}`;
    };
    const kept = await run({});
    const removed = await run({ removeOpaqueAlpha: true });
    expect(await metadata(kept('png'))).toMatchObject({ channels: 4 });
    expect(await metadata(kept('avif'))).toMatchObject({ hasAlpha: true });
    expect(await metadata(removed('png'))).toMatchObject({ channels: 3 });
    expect(await metadata(removed('avif'))).toMatchObject({ hasAlpha: false });
    expect(await rgb(removed('png'))).toEqual(await rgb(kept('png')));
  });

  test("on: a transparent source keeps its alpha; a hook's opaque one is left out, from generateAssets' config", async () => {
    const transparent = outDir();
    await generateSingleSourceAssets(
      file('transparent.png'),
      transparent,
      [{ width: 200 }],
      ['png'],
      { logger: 'silent', removeOpaqueAlpha: true }
    );
    expect(await metadata(`${transparent}transparent@200w.png`)).toMatchObject({
      channels: 4,
    });

    const output = outDir();
    await generateAssets({
      input: file('landscape.jpg'),
      output,
      sizes: [200],
      formats: ['png'],
      removeOpaqueAlpha: true,
      logger: 'silent',
      hooks: [
        {
          name: 'mark',
          // sharp's composite adds an alpha channel, opaque all over
          beforeEncode: (image) =>
            image.composite([
              {
                input: {
                  create: {
                    width: 8,
                    height: 8,
                    channels: 3,
                    background: '#f00',
                  },
                },
              },
            ]),
        },
      ],
    });
    expect(
      await metadata(path.join(output, 'landscape@200w.png'))
    ).toMatchObject({ channels: 3 });
  });
});
