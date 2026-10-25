import fs from 'node:fs/promises';
import path from 'node:path';

import sharp, { type Sharp } from 'sharp';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { HookError } from '../errors/hook-error.js';
import { generateAssets } from '../lib/generate-assets.js';
import { generateBatchAssets } from '../lib/generate-batch-assets.js';
import { generateSingleSourceAssets } from '../lib/generate-single-source-assets.js';
import {
  createTempDir,
  listFiles,
  opaqueImage,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import { displayPath } from '../utils/helpers.js';
import { ssim } from '../test-utils/ssim.js';
import type {
  Hook,
  HookContext,
  HookPoint,
  RawImage,
  SizeHookContext,
} from '../types/hooks.js';
import {
  bake,
  encodedInput,
  groupHooks,
  rawInput,
  runFormatHooks,
  runHooks,
} from './hooks.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());

/** A fresh output directory per test, with a trailing separator. */
const outDir = () => path.join(dir, 'out', `${++testIndex}`) + path.sep;

const silent = { logger: 'silent' } as const;

/** 4x2 RGB pixels, each byte its index. */
const smallPixels = (): RawImage => ({
  data: Buffer.from(Array.from({ length: 24 }, (_, index) => index)),
  info: { width: 4, height: 2, channels: 3 },
});

const pointContext = () => ({
  source: 'a.jpg',
  signal: new AbortController().signal,
  logger: createRecordingLogger().logger,
});

/**
 * Reads an output through its bytes: libvips' file cache would keep the
 * file open, and Windows can't delete open files.
 */
const read = (image: string) => fs.readFile(image);

const metadata = async (image: string) => sharp(await read(image)).metadata();

const pixel = async (image: string, x = 0, y = 0) => {
  const { data, info } = await sharp(await read(image))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * info.channels;
  return [...data.subarray(offset, offset + info.channels)];
};

describe('runHooks', () => {
  test('undefined from every hook: no change, nothing baked', async () => {
    const calls: string[] = [];
    const hooks: Hook[] = [
      { name: 'a', afterResize: () => void calls.push('a') },
      { name: 'b', afterResize: () => void calls.push('b') },
    ];
    expect(
      await runHooks(
        'afterResize',
        hooks,
        rawInput(smallPixels()),
        {
          ...pointContext(),
          setting: { width: 4, height: 2, sizeMultiplier: 1 },
        },
        'a.jpg at 4x2'
      )
    ).toBeUndefined();
    expect(calls).toEqual(['a', 'b']);
  });

  test('in order, each on the image the previous one gave', async () => {
    const seen: number[] = [];
    const hooks: Hook[] = [
      {
        name: 'wider',
        source: (image, { width }) => {
          seen.push(width);
          return image.extend({ right: 4 });
        },
      },
      {
        name: 'taller',
        source: (image, { width, height }) => {
          seen.push(width, height);
          return image.extend({ bottom: 2 });
        },
      },
    ];
    const result = await runHooks(
      'source',
      hooks,
      rawInput(smallPixels()),
      pointContext(),
      'a.jpg'
    );
    expect(seen).toEqual([4, 8, 2]);
    expect(result?.info).toEqual({ width: 8, height: 4, channels: 3 });
  });

  test('pixels returned are used as they are', async () => {
    const pixels = smallPixels();
    const result = await runHooks(
      'source',
      [{ name: 'raw', source: () => pixels }],
      rawInput(smallPixels()),
      pointContext(),
      'a.jpg'
    );
    expect(result?.data).toBe(pixels.data);
  });

  test("a new sharp object per hook: changes not returned don't count", async () => {
    const images: Sharp[] = [];
    const hooks: Hook[] = [
      {
        name: 'forgets',
        source: (image) => {
          images.push(image);
          image.negate();
        },
      },
      {
        name: 'checks',
        source: (image) => {
          images.push(image);
        },
      },
    ];
    expect(
      await runHooks(
        'source',
        hooks,
        rawInput(smallPixels()),
        pointContext(),
        'a.jpg'
      )
    ).toBeUndefined();
    expect(images[0]).not.toBe(images[1]);
  });

  test('pixels(): a copy the hook owns', async () => {
    const input = smallPixels();
    const result = await runHooks(
      'source',
      [
        {
          name: 'invert',
          source: async (_image, { pixels }) => {
            const own = await pixels();
            for (let index = 0; index < own.data.length; index++)
              own.data[index] = 255 - own.data[index]!;
            return own;
          },
        },
      ],
      rawInput(input),
      pointContext(),
      'a.jpg'
    );
    expect(input.data).toEqual(smallPixels().data);
    expect(result?.data[0]).toBe(255);
  });

  test('an encoded source: auto-oriented, decoded once for every pixels() call', async () => {
    const bytes = await fs.readFile(file('portrait-exif.jpg'));
    const input = encodedInput(bytes, { width: 600, height: 800, channels: 3 });
    const toBuffer = vi.spyOn(sharp.prototype, 'toBuffer');
    const [first, second] = await Promise.all([input.pixels(), input.pixels()]);
    expect(toBuffer).toHaveBeenCalledTimes(1);
    toBuffer.mockRestore();
    expect(first.info).toEqual({ width: 600, height: 800, channels: 3 });
    expect(first.data).toEqual(second.data);
    expect(first.data).not.toBe(second.data);
    expect(await input.create().metadata()).toMatchObject({ width: 800 });
    expect((await bake(input.create())).info.width).toBe(600);
  });

  test('a hook implemented by a class gets its this', async () => {
    class Brighten {
      readonly name = 'brighten';
      readonly amount = 1.2;
      source(image: Sharp) {
        return image.modulate({ brightness: this.amount });
      }
    }
    const result = await runHooks(
      'source',
      [new Brighten()],
      rawInput(smallPixels()),
      pointContext(),
      'a.jpg'
    );
    expect(result?.info.width).toBe(4);
  });

  test('a throw or another return fails with a HookError naming the hook', async () => {
    const run = (source: NonNullable<Hook['source']>) =>
      runHooks(
        'source',
        [{ name: 'broken', source }],
        rawInput(smallPixels()),
        pointContext(),
        'a.jpg'
      );
    const cause = new Error('model not found');
    const error = await run(() => {
      throw cause;
    }).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(HookError);
    expect(error).toMatchObject({
      hook: 'broken',
      point: 'source',
      cause,
      message: 'Hook broken failed at source of a.jpg: model not found',
    });

    await expect(run(() => 'done' as never)).rejects.toThrow(
      "returned 'done': expected a sharp object, pixels as { data, info } or undefined."
    );
    await expect(
      run(() => ({ data: Buffer.alloc(5), info: smallPixels().info }))
    ).rejects.toThrow('returned 5 bytes of pixels for 4x2 with 3 channels');
    await expect(
      run(() => ({
        data: Buffer.alloc(8),
        info: { width: 4, height: 2, channels: 5 as never },
      }))
    ).rejects.toThrow('channels from 1 to 4');
    // sharp's own errors, when the image is baked
    await expect(
      run((image) => image.extract({ left: 9, top: 0, width: 1, height: 1 }))
    ).rejects.toThrow(HookError);
  });

  test('debug logs when each hook starts and ends, its bake included', async () => {
    const { logger, messages } = createRecordingLogger();
    await runHooks(
      'beforeEncode',
      [
        { name: 'mark', beforeEncode: (image) => image.negate() },
        { name: 'none', beforeEncode: () => undefined },
      ],
      rawInput(smallPixels()),
      {
        ...pointContext(),
        logger,
        setting: { width: 4, height: 2, sizeMultiplier: 1 },
      },
      'a.jpg at 4x2'
    );
    const logs = messages('debug');
    expect(logs).toHaveLength(4);
    expect(logs[0]).toBe('Hook mark start: beforeEncode of a.jpg at 4x2');
    expect(logs[1]).toMatch(
      /^Hook mark end: beforeEncode of a\.jpg at 4x2 in \d+ms$/
    );
    expect(logs[2]).toBe('Hook none start: beforeEncode of a.jpg at 4x2');
    expect(logs[3]).toMatch(/^Hook none end: /);
  });
});

describe('runFormatHooks', () => {
  const context = () => ({
    ...pointContext(),
    setting: { width: 4, height: 2, sizeMultiplier: 1 },
    format: 'webp' as const,
    options: { quality: 80 },
    file: 'a@4w.webp',
  });

  test("the last hook's sharp object is encoded as is, earlier ones baked", async () => {
    let last: Sharp | undefined;
    const hooks: Hook[] = [
      { name: 'first', beforeFormat: (image) => image.extend({ right: 4 }) },
      {
        name: 'last',
        beforeFormat: (image, { width }) => {
          expect(width).toBe(8);
          return (last = image.negate());
        },
      },
    ];
    expect(
      await runFormatHooks(hooks, rawInput(smallPixels()), context(), 'f')
    ).toBe(last);
  });

  test('no change: undefined; pixels: a sharp object over them', async () => {
    expect(
      await runFormatHooks(
        [{ name: 'none', beforeFormat: () => undefined }],
        rawInput(smallPixels()),
        context(),
        'f'
      )
    ).toBeUndefined();
    const image = await runFormatHooks(
      [{ name: 'raw', beforeFormat: () => smallPixels() }],
      rawInput(smallPixels()),
      context(),
      'f'
    );
    expect(await image?.metadata()).toMatchObject({ width: 4, height: 2 });
  });
});

describe('groupHooks', () => {
  test('by point, in order', () => {
    const a: Hook = { name: 'a', source: () => undefined };
    const b: Hook = {
      name: 'b',
      source: () => undefined,
      afterResize: () => undefined,
    };
    expect(groupHooks([a, b])).toMatchObject({
      source: [a, b],
      afterResize: [b],
      beforeResize: [],
    });
  });
});

/** A hook at every point that changes nothing. */
const noOpHook: Hook = {
  name: 'noop',
  source: () => undefined,
  beforeResize: () => undefined,
  afterResize: () => undefined,
  beforeEncode: () => undefined,
  beforeFormat: () => undefined,
};

describe('hooks in the pipeline', () => {
  const sizes = [{ width: 400 }, { width: 200 }, { width: 100 }];

  test('no hooks, no hooks at a point, hooks without changes: the same bytes', async () => {
    const runs = [undefined, [], [noOpHook]];
    const outs: string[] = [];
    for (const hooks of runs) {
      const out = outDir();
      outs.push(out);
      await generateSingleSourceAssets(
        file('landscape.jpg'),
        out,
        sizes,
        ['webp', 'jpg', 'png'],
        { ...silent, ...(hooks && { hooks }) }
      );
    }
    const names = await listFiles(outs[0]!);
    expect(names).toHaveLength(9);
    for (const out of outs.slice(1)) {
      expect(await listFiles(out)).toEqual(names);
      for (const name of names)
        expect(
          (await fs.readFile(path.join(out, name))).equals(
            await fs.readFile(path.join(outs[0]!, name))
          ),
          name
        ).toBe(true);
    }
  });

  test('the points, in order: per source, per size, per file', async () => {
    const calls: string[] = [];
    const record =
      (point: HookPoint) =>
      (_image: Sharp, context: HookContext | SizeHookContext) => {
        const at = 'setting' in context ? ` ${context.setting.width}` : '';
        const format =
          'format' in context && typeof context.format === 'string' ?
            ` ${context.format}`
          : '';
        calls.push(`${point}${at}${format}`);
        return undefined;
      };
    const hook: Hook = {
      name: 'record',
      source: record('source'),
      beforeResize: record('beforeResize'),
      afterResize: record('afterResize'),
      beforeEncode: record('beforeEncode'),
      beforeFormat: record('beforeFormat'),
    };
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 200 }, { width: 400 }],
      ['webp', 'png'],
      { ...silent, hooks: [hook] }
    );
    // the formats of a size are encoded at the same time
    const sorted = (from: number) => calls.slice(from, from + 2).sort();
    expect(calls.slice(0, 4)).toEqual([
      'source',
      'beforeResize 400',
      'afterResize 400',
      'beforeEncode 400',
    ]);
    expect(sorted(4)).toEqual([
      'beforeFormat 400 png',
      'beforeFormat 400 webp',
    ]);
    expect(calls.slice(6, 9)).toEqual([
      'beforeResize 200',
      'afterResize 200',
      'beforeEncode 200',
    ]);
    expect(sorted(9)).toEqual([
      'beforeFormat 200 png',
      'beforeFormat 200 webp',
    ]);
    expect(calls).toHaveLength(11);
  });

  test('what hooks are told', async () => {
    const contexts: SizeHookContext[] = [];
    const formats: unknown[] = [];
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${outDir()}house`,
      [{ width: 'x2', suffix: '@2x' }],
      { webp: { quality: 70 } },
      {
        ...silent,
        hooks: [
          {
            name: 'context',
            beforeResize: async (_image, context) => {
              contexts.push(context);
              expect((await context.pixels()).info).toEqual({
                width: 800,
                height: 600,
                channels: 3,
              });
            },
            beforeFormat: (_image, { format, options, file: target }) => {
              formats.push({ format, options, file: path.basename(target) });
            },
          },
        ],
      }
    );
    expect(contexts[0]).toMatchObject({
      point: 'beforeResize',
      source: file('landscape.jpg'),
      width: 800,
      height: 600,
      channels: 3,
      setting: { width: 800, height: 600, sizeMultiplier: 2, suffix: '@2x' },
    });
    expect(contexts[0]?.signal).toBeInstanceOf(AbortSignal);
    expect(formats).toMatchObject([
      { format: 'webp', options: { quality: 70 }, file: 'house@2x.webp' },
    ]);
  });

  test('afterResize goes down the chain, beforeEncode stays in its files', async () => {
    const negateAt =
      (width: number) =>
      (image: Sharp, { setting }: SizeHookContext) =>
        setting.width === width ? image.negate() : undefined;
    const run = async (hook: Hook) => {
      const out = outDir();
      await generateSingleSourceAssets(
        file('landscape.jpg'),
        out,
        [{ width: 400 }, { width: 200 }],
        ['png'],
        { ...silent, hooks: [hook] }
      );
      return out;
    };
    const plain = await run(noOpHook);
    const chained = await run({ name: 'chain', afterResize: negateAt(400) });
    const split = await run({ name: 'split', beforeEncode: negateAt(400) });

    const [r] = await pixel(`${plain}landscape@200w.png`, 100, 75);
    const inverted = (value: number | undefined) => 255 - (value ?? 0);
    // both negate the 400w files
    for (const out of [chained, split])
      expect((await pixel(`${out}landscape@400w.png`, 200, 150))[0]).toBe(
        inverted((await pixel(`${plain}landscape@400w.png`, 200, 150))[0])
      );
    // only afterResize's reaches the 200w size, resized from the 400w one
    expect((await pixel(`${chained}landscape@200w.png`, 100, 75))[0]).toBe(
      inverted(r)
    );
    expect((await pixel(`${split}landscape@200w.png`, 100, 75))[0]).toBe(r);
  });

  test('a source hook changes the source: sizes are planned from its image', async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 1200 }, { width: 400 }],
      ['webp'],
      {
        ...silent,
        upscale: false,
        hooks: [
          {
            name: 'upscale',
            source: (image, { width, height }) =>
              image.resize(width * 2, height * 2),
          },
        ],
      }
    );
    // 1200 isn't larger than the 1600x1200 source the hook made
    expect(result).toMatchObject({
      status: 'succeed',
      width: 1600,
      height: 1200,
    });
    expect(result.outputsBySetting.map(({ size }) => size)).toEqual([
      '1200x900',
      '400x300',
    ]);
  });

  test("dimensions follow: a size's new size names its files and feeds the next", async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 400 }, { width: 200 }],
      ['png'],
      {
        ...silent,
        hooks: [
          {
            name: 'square',
            afterResize: (image, { setting, width }) =>
              setting.width === 400 ?
                image.extend({ bottom: width - 300, background: '#000' })
              : undefined,
          },
        ],
      }
    );
    expect(result.outputsBySetting.map(({ size }) => size)).toEqual([
      '400x400',
      '200x150',
    ]);
    // the 200w size is cut from the 400x400 square (its black band cropped
    // out, half of it), not squashed from it
    expect(await metadata(`${out}landscape@200w.png`)).toMatchObject({
      width: 200,
      height: 150,
    });
    expect((await pixel(`${out}landscape@200w.png`, 100, 149))[1]).toBeLessThan(
      40
    );
  });

  test('beforeResize: another aspect ratio is cropped to the size, not stretched', async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 400 }],
      ['png'],
      {
        ...silent,
        hooks: [
          {
            name: 'leftHalf',
            beforeResize: (image) =>
              image.extract({ left: 0, top: 0, width: 400, height: 600 }),
          },
        ],
      }
    );
    const covered = await sharp(await read(file('landscape.jpg')))
      .extract({ left: 0, top: 0, width: 400, height: 600 })
      .resize(400, 300)
      .png()
      .toBuffer();
    const stretched = await sharp(await read(file('landscape.jpg')))
      .extract({ left: 0, top: 0, width: 400, height: 600 })
      .resize(400, 300, { fit: 'fill' })
      .png()
      .toBuffer();
    expect(
      await ssim(await read(`${out}landscape@400w.png`), covered)
    ).toBeGreaterThan(0.98);
    expect(
      await ssim(await read(`${out}landscape@400w.png`), stretched)
    ).toBeLessThan(0.9);
  });

  test("transparency follows: 'fallback' is PNG once a hook adds alpha, JPEG once one removes it", async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${out}added`,
      [{ width: 400 }],
      ['fallback'],
      {
        ...silent,
        hooks: [{ name: 'alpha', source: (image) => image.ensureAlpha(0.5) }],
      }
    );
    await generateSingleSourceAssets(
      file('transparent.png'),
      `${out}removed`,
      [{ width: 200 }],
      ['fallback'],
      {
        ...silent,
        hooks: [
          {
            name: 'flatten',
            source: (image) => image.flatten({ background: '#fff' }),
          },
        ],
      }
    );
    // per size: the 100w files only
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${out}size`,
      [{ width: 200 }, { width: 100 }],
      ['fallback', 'webp'],
      {
        ...silent,
        hooks: [
          {
            name: 'alpha',
            beforeEncode: (image, { setting }) =>
              setting.width === 100 ? image.ensureAlpha(0.5) : undefined,
          },
        ],
      }
    );
    expect(await listFiles(out)).toEqual([
      'added@400w.png',
      'removed@200w.jpg',
      'size@100w.png',
      'size@100w.webp',
      'size@200w.jpg',
      'size@200w.webp',
    ]);
    expect((await metadata(`${out}size@100w.webp`)).hasAlpha).toBe(true);
  });

  test("beforeFormat changes one format's file, never its format", async () => {
    const run = async (hook: Hook) => {
      const out = outDir();
      await generateSingleSourceAssets(
        file('landscape.jpg'),
        out,
        [{ width: 200 }],
        ['webp', 'png'],
        { ...silent, hooks: [hook] }
      );
      return out;
    };
    const plain = await run(noOpHook);
    const hooked = await run({
      name: 'webpOnly',
      beforeFormat: (image, { format }) =>
        format === 'webp' ? image.negate().png() : undefined,
    });
    expect(
      (await fs.readFile(`${hooked}landscape@200w.png`)).equals(
        await fs.readFile(`${plain}landscape@200w.png`)
      )
    ).toBe(true);
    expect(await metadata(`${hooked}landscape@200w.webp`)).toMatchObject({
      format: 'webp',
    });
    expect(
      (await pixel(`${hooked}landscape@200w.webp`, 100, 75))[2]
    ).toBeGreaterThan(0);
    expect(
      await ssim(
        await read(`${hooked}landscape@200w.webp`),
        await read(`${plain}landscape@200w.webp`)
      )
    ).toBeLessThan(0.5);
  });

  test("failures: a size's hook fails its size, a source's hook its source, a format's hook its file", async () => {
    const fail = () => {
      throw new Error('no model');
    };
    const sizeResult = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 400 }, { width: 200 }],
      ['webp'],
      {
        ...silent,
        hooks: [
          {
            name: 'flaky',
            afterResize: (_image, { setting }) =>
              setting.width === 400 ? fail() : undefined,
          },
        ],
      }
    );
    expect(sizeResult.status).toBe('failed');
    expect(sizeResult.outputsBySetting).toMatchObject([
      {
        status: 'failed',
        size: '400x300',
        files: [],
        error: { name: 'HookError', hook: 'flaky', point: 'afterResize' },
      },
      { status: 'succeed', size: '200x150' },
    ]);

    const sourceResult = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 400 }],
      ['webp'],
      { ...silent, hooks: [{ name: 'grade', source: fail }] }
    );
    expect(sourceResult).toMatchObject({
      status: 'failed',
      outputsBySetting: [],
      error: { hook: 'grade', point: 'source' },
    });

    const fileResult = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 400 }],
      ['webp', 'png'],
      {
        ...silent,
        hooks: [
          {
            name: 'webpOnly',
            beforeFormat: (_image, { format }) =>
              format === 'webp' ? fail() : undefined,
          },
        ],
      }
    );
    expect(fileResult.outputsBySetting[0]?.files).toMatchObject([
      { status: 'failed', format: 'webp', error: { hook: 'webpOnly' } },
      { status: 'succeed', format: 'png' },
    ]);
  });

  test('with abortScope source, a failed hook stops its source', async () => {
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 400 }, { width: 200 }],
      ['webp'],
      {
        ...silent,
        abortScope: 'source',
        hooks: [
          {
            name: 'broken',
            beforeResize: () => {
              throw new Error('broken');
            },
          },
        ],
      }
    );
    expect(result.outputsBySetting.map(({ status }) => status)).toEqual([
      'failed',
    ]);
  });

  test('generateAssets takes hooks, and logs each call at debug level', async () => {
    const { logger, messages } = createRecordingLogger('debug');
    const out = outDir();
    const images = path.join(dir, 'hook-input');
    await fs.mkdir(images, { recursive: true });
    await opaqueImage(300, 200).png().toFile(path.join(images, 'a.png'));
    const batch = await generateAssets({
      input: images,
      output: out,
      sizes: [200],
      formats: ['webp'],
      logger,
      hooks: [
        {
          name: 'grade',
          source: (image) => image.modulate({ saturation: 1.2 }),
        },
      ],
    });
    expect(batch.status).toBe('succeed');
    expect(
      messages('debug').filter((message) => message.startsWith('Hook grade'))
    ).toEqual([
      `Hook grade start: source of ${displayPath(path.join(images, 'a.png'))}`,
      expect.stringMatching(/^Hook grade end: source of .+a\.png in \d+ms$/),
    ]);
  });
});

describe('hook concurrency', () => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /** A hook taking its time, counting its calls running at once. */
  const counting = (extra: Partial<Hook> = {}) => {
    const stats = { max: 0, calls: 0 };
    let active = 0;
    const busy = async (): Promise<undefined> => {
      stats.calls++;
      active++;
      stats.max = Math.max(stats.max, active);
      await delay(60);
      active--;
      return undefined;
    };
    const hook: Hook = { name: 'model', source: busy, ...extra };
    return { hook, stats, busy };
  };

  /** The 3 sources of tree/, all at once. */
  const batch = (hooks: Hook[], options: object = {}) =>
    generateBatchAssets(file('tree'), outDir(), [{ width: 50 }], ['webp'], {
      ...silent,
      concurrency: 3,
      hooks,
      ...options,
    });

  test('no limit: a call per source in progress; a limit: at most that many', async () => {
    const free = counting();
    await batch([free.hook]);
    expect(free.stats).toEqual({ max: 3, calls: 3 });

    const one = counting({ concurrency: 1 });
    await batch([one.hook]);
    expect(one.stats).toEqual({ max: 1, calls: 3 });

    const two = counting({ concurrency: 2 });
    await batch([two.hook]);
    expect(two.stats).toEqual({ max: 2, calls: 3 });
  });

  test('one limit for all the points of a hook, and for every run', async () => {
    const { hook, stats, busy } = counting({ concurrency: 1 });
    const both: Hook = { ...hook, afterResize: busy };
    await Promise.all([batch([both]), batch([both])]);
    expect(stats).toEqual({ max: 1, calls: 12 });
  });

  test('a failed call gives its turn to the next', async () => {
    let calls = 0;
    const result = await batch([
      {
        name: 'flaky',
        concurrency: 1,
        source: async () => {
          await delay(20);
          if (++calls === 1) throw new Error('out of GPU memory');
        },
      },
    ]);
    expect(calls).toBe(3);
    expect(result.sources.map(({ status }) => status).sort()).toEqual([
      'failed',
      'succeed',
      'succeed',
    ]);
  });

  test('waiting is logged; a waiting call never starts once the run is stopped', async () => {
    const { logger, messages } = createRecordingLogger('debug');
    const controller = new AbortController();
    let calls = 0;
    const result = await batch(
      [
        {
          name: 'model',
          concurrency: 1,
          source: async () => {
            calls++;
            controller.abort(new Error('stopped'));
            await delay(60);
          },
        },
      ],
      { logger, signal: controller.signal }
    );
    expect(calls).toBe(1);
    expect(result.status).toBe('aborted');
    expect(
      messages('debug').filter((message) =>
        message.startsWith('Hook model waiting: source of ')
      )
    ).toHaveLength(2);
  });
});
