/**
 * Runs every example, one after the other, each in its own process.
 *
 * Run: npm run examples (builds first)
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const EXAMPLES = [
  'quick-start.js',
  'multipliers.js',
  'art-direction.js',
  'picture.js',
  'format-options.js',
  'batch.js',
  'errors.js',
  'logging.js',
  'generate.js',
  'abort.js',
  'cli.js',
];

for (const example of EXAMPLES) {
  console.log(`\n=== ${example}\n`);
  execFileSync(process.execPath, [path.join(import.meta.dirname, example)], {
    stdio: 'inherit',
  });
}
