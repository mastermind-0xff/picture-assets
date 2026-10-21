/**
 * The `image-assets` command, run from this folder: it finds
 * image-assets.config.json here, whose paths are relative to it, and flags
 * win over it. Once the package is installed, `npx image-assets` runs the
 * same.
 *
 * 1. `-s 800,400 --dry-run`: what would be written with the file's config
 *    and these sizes over its own; nothing is written.
 * 2. The same run, for real.
 * 3. The same again: the manifest tells every photo is unchanged.
 *
 * Run: npm run build && node examples/cli.js
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../dist/esm/cli.js', import.meta.url));
const run = (...args) => {
  console.log(`\n$ image-assets ${args.join(' ')}`);
  execFileSync(process.execPath, [command, ...args], {
    cwd: import.meta.dirname,
    stdio: 'inherit',
  });
};

run('-s', '800,400', '--dry-run');
run('-s', '800,400');
run('-s', '800,400');
