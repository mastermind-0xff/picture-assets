import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { ResultBatchError } from '../errors/result-errors.js';
import {
  createTempDir,
  listFiles,
  opaqueImage,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { createRecordingLogger } from '../test-utils/logger.js';
import type { ResultBatch } from '../types/output.js';
import {
  generateBatchAssets,
  computeConcurrency,
} from './generate-batch-assets.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());

const outDir = () => path.join(dir, 'out', `${++testIndex}`);
const silent = { logger: 'silent' } as const;

/** Sources relative to the fixtures, with `/`, and their statuses. */
const sourceStatuses = (batch: ResultBatch) =>
  batch.sources.map(({ source, status }) => [
    path.relative(dir, source).replaceAll('\\', '/'),
    status,
  ]);

describe('computeConcurrency', () => {
  const parallelism = os.availableParallelism();

  test('auto: the libuv pool size, at most the parallelism', () => {
    expect(computeConcurrency('auto', 100, {})).toBe(Math.min(4, parallelism));
    expect(computeConcurrency('auto', 100, { UV_THREADPOOL_SIZE: '2' })).toBe(
      Math.min(2, parallelism)
    );
    expect(
      computeConcurrency('auto', 100, { UV_THREADPOOL_SIZE: '1000' })
    ).toBe(parallelism);
    expect(computeConcurrency('auto', 100, { UV_THREADPOOL_SIZE: 'x' })).toBe(
      Math.min(4, parallelism)
    );
  });

  test('max and numbers, never more than the sources', () => {
    expect(computeConcurrency('max', 1000, {})).toBe(parallelism);
    expect(computeConcurrency(3, 1000, {})).toBe(3);
    expect(computeConcurrency(8, 2, {})).toBe(2);
    expect(computeConcurrency('max', 1, {})).toBe(1);
  });
});

describe('generateBatchAssets', () => {
  test('a directory: the tree mirrored, results in path order', async () => {
    const out = outDir();
    const { logger, messages } = createRecordingLogger('info');
    const batch = await generateBatchAssets(
      file('tree'),
      out,
      [{ width: 200 }, { width: 100 }],
      ['webp'],
      { logger }
    );

    expect(batch.status).toBe('succeed');
    expect(batch.duration).toBeGreaterThan(0);
    expect(sourceStatuses(batch)).toEqual([
      ['tree/a.jpg', 'succeed'],
      ['tree/sub/b.png', 'succeed'],
      ['tree/sub/deeper/c.webp', 'succeed'],
    ]);
    expect(await listFiles(out)).toEqual([
      'a@100w.webp',
      'a@200w.webp',
      'sub/b@100w.webp',
      'sub/b@200w.webp',
      'sub/deeper/c@100w.webp',
      'sub/deeper/c@200w.webp',
    ]);
    expect(messages('info')[0]).toMatch(/^Found 3 source image\(s\) in .*tree/);
    expect(messages('info').at(-1)).toMatch(
      /^Batch done: 3 of 3 sources, 6 files, .* in .*, CPU [\d.]+%\.$/
    );
    // no performance probes below debug
    expect(logger.debugGraph).not.toHaveBeenCalled();
  });

  test('logs: the run and each source at info, settings and details at debug', async () => {
    const { logger, logs, messages } = createRecordingLogger('debug');
    await generateBatchAssets(
      file('tree'),
      outDir(),
      [{ width: 200 }, { width: 100 }],
      ['webp', 'fallback'],
      { logger, concurrency: 1 }
    );
    const info = messages('info');
    expect(info[0]).toMatch(
      /^Found 3 source image\(s\) in .*tree: 2 size\(s\) each, in webp, fallback, into .*, 1 at a time\.$/
    );
    // each source starts and ends, one at a time here
    expect(info.slice(1, -1)).toEqual([
      expect.stringMatching(
        /^Processing .*a\.jpg \(400x300\): 2 size\(s\) in 2 format\(s\)$/
      ),
      expect.stringMatching(/a\.jpg: 4 files, /),
      expect.stringMatching(/^Processing .*b\.png/),
      expect.stringMatching(/b\.png: 4 files, /),
      expect.stringMatching(/^Processing .*c\.webp/),
      expect.stringMatching(/c\.webp: 4 files, /),
    ]);
    expect(info.at(-1)).toMatch(/^Batch done: 3 of 3 sources, 12 files/);

    const debug = logs.filter(({ type }) => type === 'debug');
    expect(debug[0]?.data).toMatchObject({
      sizes: [{ width: 200 }, { width: 100 }],
      formats: 'webp, fallback',
      'fallback options': {
        jpg: { quality: 80 },
        png: { compressionLevel: 9 },
      },
      concurrency: 1,
    });
    // after the summary, the details
    const summary = logs.findIndex(
      ({ data }) => typeof data === 'string' && data.startsWith('Batch done')
    );
    expect(
      logs.slice(summary + 1).find(({ type }) => type === 'debug')?.data
    ).toEqual({
      sources: '3 done',
      webp: expect.stringMatching(/^6 files, .*B$/) as unknown,
      jpg: expect.stringMatching(/^6 files, /) as unknown,
      'time per source': expect.stringMatching(
        / on average, the slowest .* in \d/
      ) as unknown,
      'peak memory': expect.stringMatching(/MB$/) as unknown,
    });
  });

  test('without formats: each source in its own format', async () => {
    const out = outDir();
    await generateBatchAssets(
      file('tree'),
      out,
      [{ width: 50 }],
      undefined,
      silent
    );
    expect(await listFiles(out)).toEqual([
      'a@50w.jpg',
      'sub/b@50w.png',
      'sub/deeper/c@50w.webp',
    ]);
  });

  test('a glob and a root with a pattern', async () => {
    const out = outDir();
    const glob = `${dir.replaceAll('\\', '/')}/tree/**/*.png`;
    await generateBatchAssets(
      glob,
      `${out}/glob`,
      [{ width: 50 }],
      ['png'],
      silent
    );
    await generateBatchAssets(
      { root: file('tree/sub'), pattern: '**/*.webp' },
      `${out}/root`,
      [{ width: 50 }],
      ['png'],
      silent
    );
    expect(await listFiles(out)).toEqual([
      'glob/sub/b@50w.png',
      'root/deeper/c@50w.png',
    ]);
  });

  test("'..' after the root: those sources fail, nothing is written outside the destination", async () => {
    const out = outDir();
    const batch = await generateBatchAssets(
      { root: file('tree/sub'), pattern: '../*.jpg' },
      out,
      [{ width: 50 }],
      ['png'],
      silent
    );
    expect(sourceStatuses(batch)).toEqual([['tree/a.jpg', 'failed']]);
    expect(String(batch.sources[0]?.error)).toMatch(
      /tree\/a\.jpg is outside its input's root \(\.\.\): its files would be written outside .*Leave '\.\.' out of the pattern\.$/
    );
    // its directory mirrored: the destination's parent
    await expect(
      fs.access(path.join(out, '..', 'a@50w.png'))
    ).rejects.toThrow();
  });

  test('outputs inside the source tree are not processed again', async () => {
    const root = path.join(dir, `inside-${++testIndex}`);
    await fs.mkdir(root);
    await fs.copyFile(file('tree/a.jpg'), path.join(root, 'a.jpg'));
    const out = path.join(root, 'out');
    for (let run = 0; run < 2; run++) {
      const batch = await generateBatchAssets(
        root,
        out,
        [{ width: 50 }],
        ['png'],
        silent
      );
      expect(batch.sources).toHaveLength(1);
    }
  });

  test('sources that would write the same files: the later one fails', async () => {
    const root = path.join(dir, `collision-${++testIndex}`);
    await fs.mkdir(root);
    await opaqueImage(100, 100).jpeg().toFile(path.join(root, 'x.jpg'));
    await opaqueImage(100, 100).png().toFile(path.join(root, 'x.png'));
    const batch = await generateBatchAssets(
      root,
      outDir(),
      [{ width: 50 }],
      ['webp'],
      silent
    );
    expect(batch.status).toBe('failed');
    expect(batch.sources.map(({ status }) => status)).toEqual([
      'succeed',
      'failed',
    ]);
    expect(String(batch.sources[1]?.error)).toMatch(
      /x\.png and .*x\.jpg would write the same files/
    );
  });

  test("a broken source with 'none': the others go on", async () => {
    const batch = await generateBatchAssets(
      `${dir.replaceAll('\\', '/')}/*.jpg`,
      outDir(),
      [{ width: 50 }],
      ['webp'],
      silent
    );
    expect(batch.status).toBe('failed');
    expect(sourceStatuses(batch)).toEqual([
      ['corrupt.jpg', 'failed'],
      ['landscape.jpg', 'succeed'],
      ['portrait-exif.jpg', 'succeed'],
    ]);
  });

  test("a broken source with 'batch': rejects, the rest aborted", async () => {
    const promise = generateBatchAssets(
      `${dir.replaceAll('\\', '/')}/*.jpg`,
      outDir(),
      [{ width: 50 }],
      ['webp'],
      { ...silent, abortScope: 'batch', concurrency: 1 }
    );
    await expect(promise).rejects.toBeInstanceOf(ResultBatchError);
    const error = (await promise.catch(
      (error: unknown) => error
    )) as ResultBatchError;
    expect(error.resultBatch.status).toBe('failed');
    // every source found is in the result
    expect(sourceStatuses(error.resultBatch)).toEqual([
      ['corrupt.jpg', 'failed'],
      ['landscape.jpg', 'aborted'],
      ['portrait-exif.jpg', 'aborted'],
    ]);
    expect(error.cause).toBeInstanceOf(Error);
  });

  test('no sources: failed, with a warning', async () => {
    const { logger, messages } = createRecordingLogger();
    const batch = await generateBatchAssets(
      file('tree/**/*.gif'),
      outDir(),
      [{ width: 50 }],
      ['webp'],
      { logger }
    );
    expect(batch).toMatchObject({ status: 'failed', sources: [] });
    expect(messages('warning')).toEqual([
      expect.stringMatching(/^No source images found in /) as unknown,
    ]);
  });

  test('performance graphs at debug level', async () => {
    const { logger } = createRecordingLogger('debug');
    // the probes run every 100ms of fake time, while sharp works in real time
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const state = { settled: false };
      const promise = generateBatchAssets(
        file('tree'),
        outDir(),
        [{ width: 400 }],
        ['png'],
        { logger, concurrency: 1 }
      ).finally(() => {
        state.settled = true;
      });
      while (!state.settled) await vi.advanceTimersByTimeAsync(100);
      await promise;
    } finally {
      vi.useRealTimers();
    }

    const graphs = logger.debugGraph.mock.calls.map(([values, settings]) => ({
      title: settings?.title,
      samples: values.length,
    }));
    expect(graphs.map(({ title }) => title)).toEqual([
      'CPU usage',
      'Memory (RSS)',
      'Sources processed',
    ]);
    expect(graphs[0]?.samples).toBeGreaterThan(0);
    const [processed] = logger.debugGraph.mock.calls[2] ?? [];
    expect(processed?.at(-1)).toBeLessThanOrEqual(3);
  });

  test('no graphs for a logger without them', async () => {
    const { logger } = createRecordingLogger('debug');
    const { debugGraph, ...withoutGraphs } = logger;
    const batch = await generateBatchAssets(
      file('tree'),
      outDir(),
      [{ width: 50 }],
      ['png'],
      { logger: withoutGraphs }
    );
    expect(batch.status).toBe('succeed');
    expect(debugGraph).not.toHaveBeenCalled();
  });

  test('a signal stops the batch: the sources not started are aborted', async () => {
    const controller = new AbortController();
    const { logger } = createRecordingLogger('info');
    const info = logger.info;
    // stop when the first source is done
    logger.info = (data) => {
      info(data);
      if (typeof data === 'string' && data.includes('a.jpg: '))
        controller.abort();
    };
    const batch = await generateBatchAssets(
      file('tree'),
      outDir(),
      [{ width: 50 }],
      ['png'],
      { logger, concurrency: 1, signal: controller.signal }
    );
    expect(batch.status).toBe('aborted');
    expect(sourceStatuses(batch)).toEqual([
      ['tree/a.jpg', 'succeed'],
      ['tree/sub/b.png', 'aborted'],
      ['tree/sub/deeper/c.webp', 'aborted'],
    ]);
  });

  test('invalid arguments throw before any work', async () => {
    await expect(
      generateBatchAssets(file('tree'), outDir(), [{ width: 1 }], ['webp'], {
        concurrency: 0,
      })
    ).rejects.toThrow(RangeError);
    await expect(
      generateBatchAssets(file('tree'), outDir(), [{ width: 1 }], {
        webp: { quality: 101 },
      })
    ).rejects.toThrow(TypeError);
    await expect(
      generateBatchAssets({ root: dir } as never, outDir(), [{ width: 1 }])
    ).rejects.toThrow(TypeError);
    await expect(
      generateBatchAssets(file('tree'), '', [{ width: 1 }])
    ).rejects.toThrow(TypeError);
    // a variable passes the type check when it shares a key with the options
    const options = { concurency: 2, logger: 'error' as const };
    await expect(
      generateBatchAssets(file('tree'), outDir(), [{ width: 1 }], [], options)
    ).rejects.toThrow(
      /^Unknown option 'concurency': expected resizeStrategyHint, .*, hooks, concurrency, signal\.$/
    );
    await expect(
      generateBatchAssets(
        file('tree'),
        outDir(),
        [{ width: 1 }],
        [],
        null as never
      )
    ).rejects.toThrow('Options must be an object, got null.');
  });
});
