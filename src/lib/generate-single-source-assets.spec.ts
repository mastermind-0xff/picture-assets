import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import { ResultSourceError } from '../errors/result-errors.js';
import {
  createTempDir,
  detailedImage,
  listFiles,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import { ssim } from '../test-utils/ssim.js';
import type { OutputSetting, ResultSource } from '../types/output.js';
import type { ResizeStrategyHint } from '../types/size.js';
import { generateSingleSourceAssets } from './generate-single-source-assets.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());
afterEach(() => {
  vi.unstubAllEnvs();
});

/** A fresh output directory per test, with a trailing separator. */
const outDir = () => path.join(dir, 'out', `${++testIndex}`) + path.sep;

const silent = { logger: 'silent' } as const;

const sizes = (result: ResultSource) =>
  result.outputsBySetting.map(({ size }) => size);

const pixel = async (image: string, x = 0, y = 0) => {
  const { data, info } = await sharp(image)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * info.channels;
  return [...data.subarray(offset, offset + info.channels)];
};

describe('generateSingleSourceAssets: destinations and formats', () => {
  test('a directory: files named after the source, every size and format', async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 200 }, { width: 400 }],
      ['webp', 'png'],
      silent
    );

    expect(await listFiles(out)).toEqual([
      'landscape@200w.png',
      'landscape@200w.webp',
      'landscape@400w.png',
      'landscape@400w.webp',
    ]);
    expect(result).toMatchObject({
      status: 'succeed',
      source: file('landscape.jpg'),
    });
    expect(result.duration).toBeGreaterThan(0);
    // ordered from the largest size, formats in the given order
    expect(sizes(result)).toEqual(['400x300', '200x150']);
    expect(result.outputsBySetting[0]?.files).toMatchObject([
      {
        status: 'succeed',
        format: 'webp',
        file: `${out}landscape@400w.webp`,
        fileData: { format: 'webp', width: 400, height: 300 },
      },
      {
        status: 'succeed',
        format: 'png',
        fileData: { width: 400, height: 300 },
      },
    ]);
    const { format, width } = await sharp(
      `${out}landscape@200w.webp`
    ).metadata();
    expect({ format, width }).toEqual({ format: 'webp', width: 200 });
  });

  test('a file with a format extension: its name, its format added', async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${out}new-name.tif`,
      [{ width: 100 }],
      ['webp'],
      silent
    );
    expect(await listFiles(out)).toEqual([
      'new-name@100w.tif',
      'new-name@100w.webp',
    ]);
  });

  test("an identifier without formats: the source's format", async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('small.webp'),
      `${out}icon`,
      [{ width: 50 }],
      undefined,
      silent
    );
    expect(await listFiles(out)).toEqual(['icon@50w.webp']);
  });

  test('no format to write: rejects before any work', async () => {
    const out = outDir();
    const noExtension = path.join(dir, 'no-extension');
    await fs.copyFile(file('landscape.jpg'), noExtension);
    await expect(
      generateSingleSourceAssets(
        noExtension,
        `${out}x`,
        [{ width: 100 }],
        undefined,
        silent
      )
    ).rejects.toThrow(/No output format/);
    await expect(fs.access(out)).rejects.toThrow();
  });

  test('default format options are applied: JPEGs are progressive', async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 100 }],
      ['jpg'],
      silent
    );
    expect(
      (await sharp(`${out}landscape@100w.jpg`).metadata()).isProgressive
    ).toBe(true);

    await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${out}plain`,
      [{ width: 100 }],
      { jpg: { progressive: false } },
      silent
    );
    expect((await sharp(`${out}plain@100w.jpg`).metadata()).isProgressive).toBe(
      false
    );
  });

  test('format options from the options, the call wins', async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [
        { width: 400, suffix: '-low' },
        { width: 400, suffix: '-high', generateFromSource: true },
      ],
      ['webp'],
      { ...silent, formatOptions: { webp: { quality: 5 } } }
    );
    const low = result.outputsBySetting[0]?.files[0];
    expect(low?.status).toBe('succeed');

    const high = await generateSingleSourceAssets(
      file('landscape.jpg'),
      `${out}call`,
      [{ width: 400 }],
      { webp: { quality: 100 } },
      { ...silent, formatOptions: { webp: { quality: 5 } } }
    );
    const lowSize = low?.status === 'succeed' ? low.fileData.size : 0;
    const highFile = high.outputsBySetting[0]?.files[0];
    const highSize =
      highFile?.status === 'succeed' ? highFile.fileData.size : 0;
    expect(highSize).toBeGreaterThan(lowSize * 2);
  });

  test('suffix from the environment', async () => {
    vi.stubEnv('PICTURE_ASSETS_SUFFIX', '_{w}x{h}');
    const out = outDir();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [{ width: 100 }],
      ['webp'],
      silent
    );
    expect(await listFiles(out)).toEqual(['landscape_100x75.webp']);
  });
});

describe('generateSingleSourceAssets: sizes', () => {
  test.each<[ResizeStrategyHint, OutputSetting[], string[]]>([
    ['downsample', [{ height: 'x3' }, { width: 'x2' }], ['800x600', '533x400']],
    ['x3', [{ height: 'x3' }, { width: 'x2' }], ['800x600', '533x400']],
    [
      'upsample',
      [{ height: 'x2' }, { width: 'x1.5' }],
      ['1600x1200', '1200x900'],
    ],
    ['x1', [{ height: 'x1' }, { width: 'x2' }], ['1600x1200', '800x600']],
    [{ width: 400, height: 300 }, [{ width: 'x1' }], ['400x300']],
  ])('multipliers with %j', async (resizeStrategyHint, settings, expected) => {
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      settings,
      ['webp'],
      { ...silent, resizeStrategyHint }
    );
    expect(sizes(result)).toEqual(expected);
  });

  test('EXIF orientation is applied: phone photos stay upright', async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('portrait-exif.jpg'),
      out,
      [{ width: 300 }],
      ['webp'],
      silent
    );
    // stored 800x600 with orientation 6: shown 600x800
    expect(sizes(result)).toEqual(['300x400']);
    const { width, height, orientation } = await sharp(
      `${out}portrait-exif@300w.webp`
    ).metadata();
    expect({ width, height, orientation }).toEqual({
      width: 300,
      height: 400,
      orientation: undefined,
    });
  });

  test('transparent sources: JPEG flattened on white, alpha kept elsewhere', async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('transparent.png'),
      out,
      [{ width: 200 }],
      ['jpg', 'webp', 'png'],
      silent
    );
    // the hidden color of the transparent corner is black
    const jpg = await pixel(`${out}transparent@200w.jpg`);
    expect(jpg.every((value) => value >= 250)).toBe(true);
    expect((await pixel(`${out}transparent@200w.png`))[3]).toBe(0);
    expect((await pixel(`${out}transparent@200w.webp`))[3]).toBe(0);
    // the disc itself stays red
    const [red, green] = await pixel(`${out}transparent@200w.jpg`, 100, 100);
    expect(red).toBeGreaterThan(200);
    expect(green).toBeLessThan(60);
  });

  test('colors converted to sRGB, profile and EXIF stripped', async () => {
    const out = outDir();
    await generateSingleSourceAssets(
      file('display-p3.png'),
      out,
      [{ width: 32 }],
      ['png', 'jpg'],
      silent
    );
    for (const format of ['png', 'jpg']) {
      const output = `${out}display-p3@32w.${format}`;
      const { icc, exif } = await sharp(output).metadata();
      expect({ icc, exif }).toEqual({ icc: undefined, exif: undefined });
      // stored as P3 values (187, 105, 62): read without the profile, the
      // colors would shift
      const [red = 0, green = 0, blue = 0] = await pixel(output, 16, 16);
      expect(Math.abs(red - 200)).toBeLessThanOrEqual(2);
      expect(Math.abs(green - 100)).toBeLessThanOrEqual(2);
      expect(Math.abs(blue - 50)).toBeLessThanOrEqual(2);
    }
  });

  test('a crop never leaks into the next size', async () => {
    const out = outDir();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      out,
      [
        {
          width: 400,
          extractRegion: { left: 0, top: 0, width: 100, height: 100 },
          suffix: '-crop',
        },
        { width: 200 },
      ],
      ['png'],
      silent
    );
    // the old pipeline applied the crop to 200w too
    expect(sizes(result)).toEqual(['100x100', '200x150']);
    expect((await sharp(`${out}landscape@200w.png`).metadata()).height).toBe(
      150
    );
  });

  test('chained sizes stay aligned with one resize from the source', async () => {
    const out = outDir();
    const source = path.join(dir, 'detailed.png');
    // 667 pixels high: every size's height is rounded
    await detailedImage(1000, 667).png().toFile(source);
    const widths = [800, 640, 480, 320, 160];
    const result = await generateSingleSourceAssets(
      source,
      out,
      widths.map((width) => ({ width })),
      ['png'],
      silent
    );
    for (const size of sizes(result)) {
      const [width = 0, height = 0] = size.split('x').map(Number);
      // one resize, scaling each side to the size like the library does
      const reference = await sharp(source)
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer();
      // with 'cover', each size cropped a fraction of a pixel more: 0.969 at 480
      expect(
        await ssim(reference, `${out}detailed@${width}w.png`),
        size
      ).toBeGreaterThan(0.98);
    }
  });

  test('a size is resized from the last buffer only if it is large enough', async () => {
    const { logger, messages } = createRecordingLogger();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 400 }, { width: 600, height: 100 }, { width: 200 }],
      ['png'],
      { logger }
    );
    const source = file('landscape.jpg');
    expect(
      messages('verbose').filter((message) => message.startsWith('Resizing'))
    ).toEqual([
      `Resizing ${source} to 400x300 from the source`,
      // 600x100 is wider than the 400x300 buffer: from the source, no upscale
      `Resizing ${source} to 600x100 from the source`,
      `Resizing ${source} to 200x150 from the 400x300 buffer`,
    ]);
  });

  test('two settings writing the same files: the second fails', async () => {
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [
        { width: 300, suffix: '-same' },
        { width: 200, suffix: '-same' },
      ],
      ['png'],
      silent
    );
    expect(result.status).toBe('failed');
    expect(result.outputsBySetting.map(({ status }) => status)).toEqual([
      'succeed',
      'failed',
    ]);
    expect(String(result.outputsBySetting[1]?.error)).toMatch(
      /Another setting already writes .*-same\.\*/
    );
  });
});

describe('generateSingleSourceAssets: failures and abortScope', () => {
  /** An output whose path is a directory, so writing it fails. */
  const blockedOutput = async () => {
    const out = outDir();
    await fs.mkdir(`${out}landscape@200w.webp`, { recursive: true });
    return out;
  };
  const settings: OutputSetting[] = [
    { width: 400 },
    { width: 200 },
    { width: 100 },
  ];
  const statuses = (result: ResultSource) =>
    result.outputsBySetting.map(({ status, files }) => [
      status,
      files.map((file) => file.status),
    ]);

  test("'none': every output is attempted, failures in the result", async () => {
    const { logger, logs } = createRecordingLogger();
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      await blockedOutput(),
      settings,
      ['webp', 'png'],
      { logger }
    );
    expect(result.status).toBe('failed');
    expect(statuses(result)).toEqual([
      ['succeed', ['succeed', 'succeed']],
      ['failed', ['failed', 'succeed']],
      ['succeed', ['succeed', 'succeed']],
    ]);
    const failed = result.outputsBySetting[1]?.files[0];
    expect(failed).toMatchObject({ status: 'failed', format: 'webp' });
    expect(failed?.status === 'failed' && failed.error).toBeInstanceOf(Error);
    expect(logs.filter(({ type }) => type === 'error')).toHaveLength(1);
    expect(logs.at(-1)).toMatchObject({
      type: 'warning',
      data: expect.stringMatching(/5 files, .* 1 failed$/) as unknown,
    });
  });

  test("'source': stops at the first failed setting", async () => {
    const result = await generateSingleSourceAssets(
      file('landscape.jpg'),
      await blockedOutput(),
      settings,
      ['webp', 'png'],
      { ...silent, abortScope: 'source' }
    );
    expect(result.status).toBe('failed');
    expect(statuses(result)).toEqual([
      ['succeed', ['succeed', 'succeed']],
      ['failed', ['failed', 'succeed']],
    ]);
  });

  test("'batch': rejects with the result", async () => {
    const promise = generateSingleSourceAssets(
      file('landscape.jpg'),
      await blockedOutput(),
      settings,
      ['webp', 'png'],
      { ...silent, abortScope: 'batch' }
    );
    await expect(promise).rejects.toBeInstanceOf(ResultSourceError);
    const error = (await promise.catch(
      (error: unknown) => error
    )) as ResultSourceError;
    expect(error.resultSource.status).toBe('failed');
    expect(error.resultSource.outputsBySetting).toHaveLength(2);
    // the chain of causes leads to sharp's error about the blocked file
    expect(error.cause).toBeInstanceOf(Error);
    expect((error.cause as Error).cause).toBeInstanceOf(Error);
  });

  test('a source that is not an image', async () => {
    const result = await generateSingleSourceAssets(
      file('corrupt.jpg'),
      outDir(),
      settings,
      ['webp'],
      silent
    );
    expect(result).toMatchObject({ status: 'failed', outputsBySetting: [] });
    expect(String(result.error)).toMatch(/unsupported image format/);

    await expect(
      generateSingleSourceAssets(
        file('corrupt.jpg'),
        outDir(),
        settings,
        ['webp'],
        {
          ...silent,
          abortScope: 'batch',
        }
      )
    ).rejects.toThrow(ResultSourceError);
  });

  test('a missing source', async () => {
    const result = await generateSingleSourceAssets(
      file('missing.jpg'),
      outDir(),
      settings,
      ['webp'],
      silent
    );
    expect(result.status).toBe('failed');
    expect(String(result.error)).toMatch(/ENOENT/);
  });
});

describe('generateSingleSourceAssets: invalid arguments throw before any work', () => {
  test.each([
    [
      'settings',
      () => generateSingleSourceAssets('a.jpg', 'out/', [], ['webp']),
    ],
    [
      'setting',
      () =>
        generateSingleSourceAssets('a.jpg', 'out/', [
          { width: 'big' } as never,
        ]),
    ],
    [
      'format',
      () =>
        generateSingleSourceAssets(
          'a.jpg',
          'out/',
          [{ width: 1 }],
          ['bmp' as never]
        ),
    ],
    [
      'format options',
      () =>
        generateSingleSourceAssets('a.jpg', 'out/', [{ width: 1 }], {
          avif: { quality: -1 },
        }),
    ],
    [
      'option',
      () =>
        generateSingleSourceAssets('a.jpg', 'out/', [{ width: 1 }], ['webp'], {
          abortScope: 'format' as never,
        }),
    ],
    [
      'source path',
      () => generateSingleSourceAssets('', 'out/', [{ width: 1 }]),
    ],
    [
      'destination',
      () => generateSingleSourceAssets('a.jpg', 5 as never, [{ width: 1 }]),
    ],
  ])('invalid %s', async (_, call) => {
    await expect(call()).rejects.toThrow(/./);
  });
});

describe('generateSingleSourceAssets: logs', () => {
  test('a summary per source, a debug line per file', async () => {
    const { logger, messages } = createRecordingLogger();
    await generateSingleSourceAssets(
      file('landscape.jpg'),
      outDir(),
      [{ width: 100 }],
      ['webp', 'png'],
      {
        logger,
      }
    );
    expect(messages('info')).toEqual([
      expect.stringMatching(/landscape\.jpg: 2 files, .* in \d/) as unknown,
    ]);
    expect(
      messages('debug').filter((message) => message.startsWith('Created'))
    ).toEqual([
      expect.stringMatching(/landscape@100w\.webp \(100x75, .*B\)$/) as unknown,
      expect.stringMatching(/landscape@100w\.png \(100x75, .*B\)$/) as unknown,
    ]);
  });
});
