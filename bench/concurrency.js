/**
 * Batch concurrency: the 10 photos of examples/images/group-* (12 to
 * 40 megapixels) to 2 sizes in WebP, 1, 2, 4 and all cores' worth of sources
 * at a time.
 *
 * Sharp runs each operation on a thread of libuv's pool (`UV_THREADPOOL_SIZE`,
 * 4 by default), and libvips spreads its pixels over its own threads. So
 * sources beyond the pool size only wait for a thread: run it again with
 * `UV_THREADPOOL_SIZE` set to the number of cores to see if a larger pool
 * helps on your machine. It must be set before the process starts.
 *
 * Run: npm run build && node bench/concurrency.js [--quick]
 *      UV_THREADPOOL_SIZE=12 node bench/concurrency.js
 */
import os from 'node:os';
import path from 'node:path';

import { bench, compare, isWorker } from '@mmutils/bench';

import {
  IMAGES,
  LIBRARY,
  logger,
  measureOptions,
  reporter,
  outputDir,
} from './shared.js';

const { batchImageResize } = await import(LIBRARY.href);

const SOURCES = `${IMAGES.replaceAll(path.sep, '/')}/group-*/**/*.jpg`;
const CONCURRENCY = [1, 2, 4, 'max'];

if (!isWorker())
  logger.info(
    `UV_THREADPOOL_SIZE: ${process.env.UV_THREADPOOL_SIZE ?? '4 (default)'}, available parallelism: ${os.availableParallelism()}`
  );

await compare(
  ...CONCURRENCY.map((concurrency) => {
    const dir = outputDir('concurrency', String(concurrency));
    return bench(`concurrency ${concurrency}`, () =>
      batchImageResize(
        SOURCES,
        dir,
        [{ width: 1024 }, { width: 512 }],
        ['webp'],
        {
          logger: 'silent',
          concurrency,
        }
      )
    );
  }),
  {
    ...measureOptions(),
    output: reporter(['distribution', 'cores', 'machine']),
  }
);
