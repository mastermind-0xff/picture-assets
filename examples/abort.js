/**
 * Stopping a run with an AbortSignal, then finishing it.
 *
 * The signal fires on Ctrl+C or after a time limit, 2 seconds here, with
 * one photo at a time so the limit falls in the middle of the run. The
 * files in progress are finished, so none is left half written, and nothing
 * new starts. The call resolves (it doesn't reject) with the batch
 * `'aborted'`: the photos done have `'succeed'`, the others `'aborted'`.
 *
 * With a manifest, the next run makes only what the stopped one didn't: the
 * photos done are `'skipped'`, unchanged.
 *
 * `batchImageResize` takes the same `signal`, and the command line stops
 * the same way on Ctrl+C.
 *
 * Run: npm run build && node examples/abort.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { generateAssets } from '@mmutils/image-assets';

const output = path.join(import.meta.dirname, 'output', 'abort');
// start from nothing, so the first run has work to stop
await fs.rm(output, { recursive: true, force: true });

const config = {
  input: path.join(import.meta.dirname, 'images'),
  output,
  sizes: [1280, 640],
  formats: ['webp'],
  concurrency: 1,
  manifest: path.join(output, 'assets.json'),
  logger: 'error',
};

// Ctrl+C stops the run cleanly instead of killing the process
const controller = new AbortController();
process.once('SIGINT', () => {
  controller.abort();
});

const count = ({ status, duration, sources }) => {
  const statuses = Object.groupBy(sources, (source) => source.status);
  const counts = Object.entries(statuses).map(
    ([name, list]) => `${list.length} ${name}`
  );
  return `${status} in ${duration}ms, photos: ${counts.join(', ')}`;
};

const stopped = await generateAssets({
  ...config,
  signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2000)]),
});
console.log(`stopped run: ${count(stopped)}`);

const finished = await generateAssets(config);
console.log(`next run: ${count(finished)}`);
