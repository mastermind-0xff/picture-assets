/**
 * generateAssets: a folder of photos with one config, a manifest, and a
 * second run that skips every unchanged photo.
 *
 * Without `sizes` and `formats` it would make the widths of a responsive
 * srcset (2560 to 320, never enlarged) in AVIF, WebP and JPEG; two widths
 * keep this example quick. The manifest lists every file, relative to it:
 * what a template needs to write `<picture>` and `srcset`.
 *
 * Run: npm run build && node examples/generate.js
 */
import path from 'node:path';

import { generateAssets, readManifest } from 'picture-assets';

const output = path.join(import.meta.dirname, 'output', 'generate');
const config = {
  input: path.join(import.meta.dirname, 'images', 'group-2'),
  output,
  sizes: [1280, 640],
  manifest: path.join(output, 'assets.json'),
  logger: 'warning',
};

const first = await generateAssets(config);
console.log(`first run: ${first.status}, ${first.duration}ms`);

const second = await generateAssets(config);
const unchanged = second.sources.filter(({ status }) => status === 'skipped');
console.log(
  `second run: ${unchanged.length} of ${second.sources.length} unchanged, ${second.duration}ms`
);

const { manifest } = await readManifest(config.manifest);
const [source, entry] = Object.entries(manifest.sources)[0];
console.log(
  `${source} (${entry.width}x${entry.height}):`,
  entry.outputs.map(({ file, bytes }) => `${file} ${bytes} bytes`)
);
