/**
 * Failures and `abortScope`. A directory with two photos and a file that
 * only looks like one:
 *
 * - `'none'` (default): best effort. Every output is attempted, the failure
 *   is logged and in the result: the batch is `'failed'`, the broken source
 *   too, with its `error`; the photos are written.
 * - `'source'`: a failure stops the rest of its source, other sources go on.
 * - `'batch'`: fail fast. The batch stops as soon as the work in progress is
 *   done and rejects with a `ResultBatchError`, whose `resultBatch` tells
 *   what was done: the sources not started are `'aborted'`.
 *
 * Invalid arguments (`{ width: 'big' }`) always throw, before any work.
 *
 * Run: npm run build && node examples/errors.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { batchImageResize, ResultBatchError } from '@mmutils/image-assets';

const output = path.join(import.meta.dirname, 'output', 'errors');
const sources = path.join(output, 'sources');
await fs.mkdir(sources, { recursive: true });
await fs.writeFile(path.join(sources, 'a-broken.jpg'), 'not a JPEG');
for (const photo of ['house-01-low-res@1300w.jpg', 'house-02.jpg'])
  await fs.copyFile(
    path.join(import.meta.dirname, 'images', photo),
    path.join(sources, photo)
  );

const summary = (batch) =>
  batch.sources.map(
    ({ source, status }) => `${path.basename(source)} ${status}`
  );

const bestEffort = await batchImageResize(
  sources,
  path.join(output, 'best-effort'),
  [{ width: 640 }],
  ['webp'],
  { logger: 'error' }
);
console.log(`'none': ${bestEffort.status}`, summary(bestEffort));

try {
  await batchImageResize(
    sources,
    path.join(output, 'fail-fast'),
    [{ width: 640 }],
    ['webp'],
    {
      logger: 'silent',
      abortScope: 'batch',
      concurrency: 1,
    }
  );
} catch (error) {
  if (!(error instanceof ResultBatchError)) throw error;
  console.log(`'batch': ${error.message}`, summary(error.resultBatch));
  console.log(`  cause: ${error.cause?.message}`);
}

try {
  await batchImageResize(sources, output, [{ width: 'big' }]);
} catch (error) {
  console.log(`invalid settings: ${error.message}`);
}
