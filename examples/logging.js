/**
 * Logging with @mmutils/logger.
 *
 * - `logger: 'debug'`: the default logger at another level. `'info'` (the
 *   default) logs a line per source and the batch's summary, `'debug'` a
 *   line per file and, for batches, graphs of the CPU, the memory and the
 *   progress; `'silent'` nothing. `IMAGE_RESIZE_LOG_LEVEL` sets it too.
 * - `logger: yourLogger`: share your application's logger. Here one writing
 *   JSON lines (one object per log) to a log file, for CI or a collector.
 *   Any object with `error`, `warning`, `info`, `debug` and `verbose`
 *   methods works.
 *
 * Run: npm run build && node examples/logging.js
 */
import fs from 'node:fs';
import path from 'node:path';

import { batchImageResize } from 'image-assets-generator';
import { jsonPlugin, Logger } from '@mmutils/logger';

const images = path.join(import.meta.dirname, 'images', 'group-1');
const output = path.join(import.meta.dirname, 'output', 'logging');
fs.mkdirSync(output, { recursive: true });

// the default logger at debug level: files, then graphs
await batchImageResize(
  images,
  path.join(output, 'debug'),
  [{ width: 640 }],
  ['webp'],
  {
    logger: 'debug',
  }
);

// JSON lines to a file
const logFile = path.join(output, 'assets.log');
const lines = [];
const jsonLogger = new Logger({
  level: 'debug',
  plugins: [jsonPlugin({ write: (line) => lines.push(line) })],
});
await batchImageResize(
  images,
  path.join(output, 'json'),
  [{ width: 640 }],
  ['webp'],
  {
    logger: jsonLogger,
  }
);
fs.writeFileSync(logFile, `${lines.join('\n')}\n`);
console.log(
  `${lines.length} JSON lines in ${logFile}, the first:\n${lines[0]}`
);
