/**
 * planAssets, as is: what generateAssets would write for a folder, printed
 * whole. Nothing is written.
 *
 * Run: npm run build && node examples/plan-simple.js
 */
import path from 'node:path';

import { planAssets } from 'picture-assets';

const plan = await planAssets({
  input: path.join(import.meta.dirname, 'images', 'group-2'),
  output: path.join(import.meta.dirname, 'output', 'plan-simple'),
});

console.dir(plan, { depth: null });
