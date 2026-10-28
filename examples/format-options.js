/**
 * Format options, from the most general to the most specific, each merged
 * over the previous one field by field:
 *
 * 1. the library's defaults (`DEFAULT_FORMAT_OPTIONS`);
 * 2. `PICTURE_ASSETS_FORMAT_OPTIONS`, JSON in the environment;
 * 3. `formatOptions` of the call: for every call of a build script;
 * 4. options given with the formats: for this call only.
 *
 * `jpg` uses `jpeg`'s options too, so one setting covers both extensions.
 * Options sharp rejects (`quality: 120`) throw before any image is touched.
 *
 * Run: npm run build && node examples/format-options.js
 */
import path from 'node:path';

import {
  DEFAULT_FORMAT_OPTIONS,
  generateSingleSourceAssets,
} from 'picture-assets';

console.log('defaults:', JSON.stringify(DEFAULT_FORMAT_OPTIONS.webp));

// shared by the build: smaller WebP and AVIF with more effort, a longer
// build (AVIF keeps its default quality: options merge field by field)
const formatOptions = { webp: { quality: 72, effort: 6 }, avif: { effort: 4 } };

const result = await generateSingleSourceAssets(
  path.join(import.meta.dirname, 'images', 'house-01.jpg'),
  path.join(import.meta.dirname, 'output', 'format-options') + path.sep,
  [{ width: 1280 }],
  // this call, a hero image: WebP at quality 90 (effort 6 still applies),
  // AVIF with the build's options
  { webp: { quality: 90 }, avif: {} },
  { formatOptions, logger: 'warning' }
);

for (const file of result.outputsBySetting[0]?.files ?? [])
  if (file.status === 'succeed')
    console.log(`${file.format}: ${file.fileData.size} bytes`);

try {
  await generateSingleSourceAssets('any.jpg', 'out/', [{ width: 100 }], {
    webp: { quality: 120 },
  });
} catch (error) {
  console.log(`rejected before any work: ${error.message}`);
}
