/**
 * Batch: every photo of a directory tree, the tree mirrored in the
 * destination, so `group-1/set-1/house-06.jpg` gives
 * `output/batch/group-1/set-1/house-06@1280w.webp`.
 *
 * The source can also be a glob (`'images/**\/house-0*.jpg'`, rooted at its
 * part before the first wildcard) or `{ root, pattern }`. Files sharp can't
 * read are skipped, and outputs written inside the source tree are never
 * picked up again.
 *
 * `concurrency: 'auto'` processes as many photos at a time as libuv has
 * threads (`UV_THREADPOOL_SIZE`, 4 by default): see bench/concurrency.js.
 *
 * Run: npm run build && node examples/batch.js
 */
import path from 'node:path';

import { batchImageResize } from 'image-assets-generator';

const batch = await batchImageResize(
  path.join(import.meta.dirname, 'images'),
  path.join(import.meta.dirname, 'output', 'batch'),
  [{ width: 1280 }, { width: 640 }],
  ['webp']
);

// one entry per photo, in path order
const statuses = Object.groupBy(batch.sources, ({ status }) => status);
console.log(
  `${batch.status}: ${statuses.succeed?.length ?? 0} succeeded, ${statuses.failed?.length ?? 0} failed`
);
