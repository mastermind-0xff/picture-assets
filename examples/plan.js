/**
 * The plan against the run it plans. `planAssets`, the command's
 * `--dry-run`, tells what `generateAssets` would write, from the sources'
 * headers and the manifest, without writing. Here each scenario is
 * planned, then run for real, and the two are compared size by size and
 * file by file:
 *
 * 1. A first run. 2. Nothing changed, with a manifest. 3. One source
 * replaced. 4. A size added. 5. A small source: larger sizes skipped.
 * 6. Multipliers. 7. A transparent source and `'fallback'`. 8. Sources
 * that fail. 9. Hooks, which the plan doesn't run. 10. The whole example
 * folder: the plan's cost against the run's.
 *
 * Prints the command's own `--dry-run` for the first scenario, then a
 * verdict for each. Writes examples/output/plan/index.html: plan and run
 * side by side, the files written as thumbnails, what the plan got wrong
 * in red. Open it in a browser.
 *
 * Run: npm run build && node examples/plan.js
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAssets, planAssets } from 'picture-assets';
import sharp from 'sharp';

const IMAGES = path.join(import.meta.dirname, 'images');
const ROOT = path.join(import.meta.dirname, 'output', 'plan');
const COMMAND = fileURLToPath(new URL('../dist/esm/cli.js', import.meta.url));
const DRY_RUN = ['sources', '-o', 'out', '--manifest', 'out/assets.json'];

/** A copy of an image with rounded, transparent corners. */
const rounded = (image, width, height) =>
  image.ensureAlpha().composite([
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${Math.round(Math.min(width, height) / 6)}"/></svg>`
      ),
      blend: 'dest-in',
    },
  ]);

/** @type {import('picture-assets').Hook} */
const square = {
  name: 'square',
  // the middle square of every source
  afterSourceLoad: (image, { width, height }) => {
    const side = Math.min(width, height);
    return image.extract({
      left: Math.floor((width - side) / 2),
      top: Math.floor((height - side) / 2),
      width: side,
      height: side,
    });
  },
};

/** @type {import('picture-assets').Hook} */
const roundedChart = {
  name: 'roundedChart',
  // rounded corners for the chart: it becomes transparent
  afterSourceLoad: (image, { source, width, height }) =>
    source.endsWith('chart.png') ? rounded(image, width, height) : undefined,
};

const SCENARIOS = [
  {
    title: 'A first run',
    note: 'Every file the plan names is written, at the size it planned.',
    sources: ['house-01.jpg', 'portrait.jpg', 'chart.png'],
    config: { sizes: [1280, 640] },
    command: ['-s', '1280,640'],
  },
  {
    title: 'Nothing changed, with a manifest',
    note: 'The plan reads the manifest: every source unchanged, and the run skips them.',
    sources: ['house-01.jpg', 'portrait.jpg', 'chart.png'],
    config: { sizes: [1280, 640] },
    before: async ({ config }) => generateAssets(config),
  },
  {
    title: 'One source replaced',
    note: 'portrait.jpg is replaced by a landscape photo after a run: only it is planned, at its new size.',
    sources: ['house-01.jpg', 'portrait.jpg', 'chart.png'],
    config: { sizes: [1280, 640] },
    before: async ({ config, input }) => {
      await generateAssets(config);
      await fs.copyFile(
        path.join(IMAGES, 'dark-scene.jpg'),
        path.join(input, 'portrait.jpg')
      );
    },
  },
  {
    title: 'A size added',
    note: "After a run with 1280 and 640, 320 is added: the options are in each source's hash, so every source is planned again.",
    sources: ['house-01.jpg', 'chart.png'],
    config: { sizes: [1280, 640, 320] },
    before: async ({ config }) =>
      generateAssets({ ...config, sizes: [1280, 640] }),
  },
  {
    title: 'A small source',
    note: 'With the responsive preset, sizes larger than the source are not made: 2560 and 1920 are skipped for the 1300 pixel photo.',
    sources: ['house-01-low-res@1300w.jpg', 'house-01.jpg'],
    config: { sizes: 'responsive' },
  },
  {
    title: 'Multipliers',
    note: 'x1, x2 and x3, the source being x3 (resizeStrategyHint): the plan resolves them to pixels.',
    sources: ['house-01.jpg'],
    config: { sizes: ['x1', 'x2', 'x3'], resizeStrategyHint: 'x3' },
  },
  {
    title: "A transparent source and 'fallback'",
    note: "The web formats end with 'fallback': JPEG for an opaque source, PNG for a transparent one. The plan reads the alpha channel from the header.",
    sources: ['house-01.jpg'],
    config: { sizes: [1280, 640] },
    before: async ({ input }) => {
      const chart = sharp(path.join(IMAGES, 'chart.png')).resize(1600);
      const { width, height } = await sharp(
        await chart.clone().toBuffer()
      ).metadata();
      await rounded(chart, width, height)
        .png()
        .toFile(path.join(input, 'badge.png'));
    },
  },
  {
    title: 'Sources that fail',
    note: 'A file that is not an image, an input that does not exist, a photo over limitInputPixels: each fails alone, in the plan as in the run.',
    sources: ['house-01.jpg', 'portrait.jpg'],
    config: { sizes: [640], limitInputPixels: 15_000_000 },
    before: async ({ config, input }) => {
      await fs.writeFile(path.join(input, 'broken.jpg'), 'not a JPEG');
      config.input = [input, path.join(input, 'missing.jpg')];
    },
  },
  {
    title: "Hooks the plan doesn't run",
    note: "Two afterSourceLoad hooks: a square crop of every source, rounded corners for the chart. The plan reads the sources as they are, the run the hooks' images: other sizes, other names ({w}x{h} in the suffix), and the chart's fallback is PNG.",
    sources: ['house-01.jpg', 'portrait.jpg', 'chart.png'],
    config: {
      sizes: [1280, 640],
      suffix: '-{w}x{h}',
      hooks: [square, roundedChart],
    },
  },
  {
    title: 'The whole example folder',
    note: '17 sources, the responsive sizes in WebP. The plan reads each file and its header; the run decodes, resizes and encodes.',
    folder: true,
    config: { formats: ['webp'] },
    collapsed: true,
  },
];

// what the run should report for each status of the plan
const SOURCE_STATUS = {
  planned: 'succeed',
  unchanged: 'skipped',
  failed: 'failed',
};
const SIZE_STATUS = { planned: 'succeed', skipped: 'skipped' };

const message = (error) =>
  error instanceof Error ? error.message : String(error);

/** Plan and run side by side, each difference named. */
const compare = (plan, batch) => {
  const runs = new Map(batch.sources.map((source) => [source.source, source]));
  const sources = [];
  for (const planned of plan.sources) {
    const done = runs.get(planned.source);
    runs.delete(planned.source);
    const differences = [];
    if (done?.status !== SOURCE_STATUS[planned.status])
      differences.push(
        `planned ${planned.status}, the run: ${done?.status ?? 'nothing'}`
      );
    const count = Math.max(
      planned.sizes.length,
      done?.outputsBySetting.length ?? 0
    );
    const sizes = Array.from({ length: count }, (_, index) => {
      const plannedSize = planned.sizes[index];
      const doneSize = done?.outputsBySetting[index];
      const written = (doneSize?.files ?? [])
        .filter((file) => file.status === 'succeed')
        .map((file) => ({ file: file.file, bytes: file.fileData.size }));
      const plannedFiles = plannedSize?.files ?? [];
      const notWritten = plannedFiles.filter(
        (file) => !written.some((done) => done.file === file)
      );
      const notPlanned = written.filter(
        ({ file }) => !plannedFiles.includes(file)
      );
      const sizeDifferences = [];
      if (plannedSize?.size !== doneSize?.size)
        sizeDifferences.push(
          `planned ${plannedSize?.size ?? 'nothing'}, made ${doneSize?.size ?? 'nothing'}`
        );
      if (
        plannedSize &&
        doneSize &&
        SIZE_STATUS[plannedSize.status] !== doneSize.status
      )
        sizeDifferences.push(
          `planned ${plannedSize.status}, the run: ${doneSize.status}`
        );
      for (const file of notWritten)
        sizeDifferences.push(`${path.basename(file)} planned, not written`);
      for (const { file } of notPlanned)
        sizeDifferences.push(`${path.basename(file)} written, not planned`);
      return {
        plannedSize,
        doneSize,
        written,
        notWritten,
        notPlanned,
        differences: sizeDifferences,
      };
    });
    sources.push({ planned, done, differences, sizes });
  }
  for (const done of runs.values())
    sources.push({
      planned: undefined,
      done,
      differences: [`run, not planned: ${done.status}`],
      sizes: [],
    });
  // a source whose status differs, a size whose size, status or files do
  const differences = sources.reduce(
    (sum, source) =>
      sum +
      source.differences.length +
      source.sizes.filter((size) => size.differences.length > 0).length,
    0
  );
  return { sources, differences };
};

const time = async (work) => {
  const start = performance.now();
  const result = await work();
  return { result, ms: performance.now() - start };
};

await fs.rm(ROOT, { recursive: true, force: true });
const results = [];
let dryRun = '';
for (const [index, scenario] of SCENARIOS.entries()) {
  const dir = path.join(ROOT, String(index + 1));
  const input = scenario.folder ? IMAGES : path.join(dir, 'sources');
  const output = path.join(dir, 'out');
  await fs.mkdir(input, { recursive: true });
  for (const name of scenario.sources ?? [])
    await fs.copyFile(path.join(IMAGES, name), path.join(input, name));
  const config = {
    input,
    output,
    manifest: path.join(output, 'assets.json'),
    logger: 'silent',
    ...scenario.config,
  };
  await scenario.before?.({ config, input });

  // the same config, as the command line: the paths of DRY_RUN
  if (scenario.command)
    dryRun = execFileSync(
      process.execPath,
      [COMMAND, ...DRY_RUN, ...scenario.command, '--dry-run'],
      { cwd: dir, encoding: 'utf8' }
    );

  const plan = await time(() => planAssets(config));
  const run = await time(() => generateAssets(config));
  const comparison = compare(plan.result, run.result);
  results.push({ index, scenario, config, plan, run, comparison });
}

// the terminal

const color = (code) => (text) =>
  process.stdout.isTTY === true ? `\x1b[${code}m${text}\x1b[0m` : text;
const green = color(32);
const red = color(31);
const seconds = (ms) =>
  ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

const command = `$ picture-assets ${[...DRY_RUN, ...SCENARIOS[0].command].join(' ')} --dry-run`;
console.log(command);
console.log(dryRun);
for (const { index, scenario, plan, run, comparison } of results) {
  const verdict =
    comparison.differences === 0 ?
      green('plan = run')
    : red(`${comparison.differences} difference(s)`);
  console.log(
    `${index + 1}. ${scenario.title}: ${verdict} (${plan.result.sources.length} source(s), ${plan.result.files} file(s) planned; plan ${seconds(plan.ms)}, run ${seconds(run.ms)})`
  );
  for (const source of comparison.sources) {
    const name = path.basename(source.planned?.source ?? source.done.source);
    for (const difference of source.differences)
      console.log(red(`   ${name}: ${difference}`));
    const names = (files) =>
      files.map((file) => path.basename(file.file ?? file)).join(', ');
    for (const size of source.sizes.filter(
      ({ differences }) => differences.length > 0
    ))
      console.log(
        red(
          `   ${name} ${size.plannedSize?.size ?? '-'} -> ${size.doneSize?.size ?? '-'}: ${[
            size.notWritten.length > 0 &&
              `not written ${names(size.notWritten)}`,
            size.notPlanned.length > 0 &&
              `not planned ${names(size.notPlanned)}`,
          ]
            .filter(Boolean)
            .join('; ')}`
        )
      );
  }
  if (plan.result.hooksNotRun.length > 0)
    console.log(
      `   hooks not run by the plan: ${plan.result.hooksNotRun.join(', ')}`
    );
}

// the page

const escape = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]
  );
const href = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const shown = (config) =>
  JSON.stringify(
    {
      ...config,
      input: undefined,
      output: undefined,
      manifest: undefined,
      logger: undefined,
      hooks: config.hooks?.map((hook) => hook.name),
    },
    (key, value) => (value === undefined ? undefined : value)
  );

const sizeRows = (source) => {
  const name = path.basename(source.planned?.source ?? source.done.source);
  const status = `${source.planned?.status ?? 'not planned'} → ${source.done?.status ?? 'not run'}`;
  const error =
    (source.planned?.error ?? source.done?.error) ?
      `<div class="error">${escape(message(source.planned?.error ?? source.done?.error))}</div>`
    : '';
  const size =
    source.planned?.width ?
      ` ${source.planned.width}x${source.planned.height}`
    : '';
  const head = `<th rowspan="${Math.max(1, source.sizes.length)}" class="${source.differences.length > 0 ? 'bad' : ''}">${escape(name)}<div class="dim">${escape(size)}</div><div class="status">${escape(status)}</div>${error}</th>`;
  if (source.sizes.length === 0)
    return `<tr>${head}<td colspan="4" class="dim">no sizes</td></tr>`;
  return source.sizes
    .map((size, row) => {
      const planned = size.plannedSize;
      const done = size.doneSize;
      const sizeBad = planned?.size !== done?.size ? ' bad' : '';
      const files = (planned?.files ?? [])
        .map(
          (file) =>
            `<div class="${size.notWritten.includes(file) ? 'bad' : ''}">${escape(path.basename(file))}</div>`
        )
        .join('');
      const thumbs = size.written
        .map(
          ({ file, bytes }) =>
            `<figure class="${size.notPlanned.some((other) => other.file === file) ? 'bad' : ''}"><img src="${escape(href(file))}" loading="lazy" alt=""><figcaption>${escape(path.basename(file))}<br><span class="dim">${(bytes / 1000).toFixed(1)} kB</span></figcaption></figure>`
        )
        .join('');
      return `<tr>${row === 0 ? head : ''}<td class="size${sizeBad}">${escape(planned ? `${planned.size} ${planned.status}` : '—')}</td><td>${files || '<span class="dim">none</span>'}</td><td class="size${sizeBad}">${escape(done ? `${done.size} ${done.status}` : '—')}</td><td class="thumbs">${thumbs || '<span class="dim">none</span>'}</td></tr>`;
    })
    .join('');
};

const sections = results
  .map(({ index, scenario, config, plan, run, comparison }) => {
    const ok = comparison.differences === 0;
    const table = `<table><thead><tr><th>source</th><th>plan: size</th><th>plan: files</th><th>run: size</th><th>run: files written</th></tr></thead><tbody>${comparison.sources.map(sizeRows).join('')}</tbody></table>`;
    return `<section id="s${index + 1}">
<h2>${index + 1}. ${escape(scenario.title)} <span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'plan = run' : `${comparison.differences} difference(s)`}</span></h2>
<p>${escape(scenario.note)}</p>
<p class="meta"><code>${escape(shown(config))}</code> · ${plan.result.sources.length} source(s), ${plan.result.files} file(s) planned · plan ${seconds(plan.ms)}, run ${seconds(run.ms)}${plan.result.hooksNotRun.length > 0 ? ` · <span class="warn">hooks not run by the plan: ${escape(plan.result.hooksNotRun.join(', '))}</span>` : ''}</p>
${scenario.collapsed ? `<details><summary>The ${comparison.sources.length} sources</summary>${table}</details>` : table}
</section>`;
  })
  .join('\n');

const summary = results
  .map(
    ({ index, scenario, comparison }) =>
      `<li><a href="#s${index + 1}">${escape(scenario.title)}</a> <span class="badge ${comparison.differences === 0 ? 'ok' : 'bad'}">${comparison.differences === 0 ? 'plan = run' : `${comparison.differences} difference(s)`}</span></li>`
  )
  .join('');

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The plan and the run</title>
<style>
:root { --bg: #fff; --fg: #1d1d1f; --dim: #6e6e73; --line: #d2d2d7; --ok: #1a7f37; --bad: #c62828; --bad-bg: #fdecea; --code: #f5f5f7; --warn: #8a5a00; --link: #0a58ca; }
@media (prefers-color-scheme: dark) { :root { --bg: #161618; --fg: #f2f2f7; --dim: #9a9aa0; --line: #3a3a3c; --ok: #4ac26b; --bad: #ff6b6b; --bad-bg: #3b1d1d; --code: #232326; --warn: #e3b341; --link: #6cb6ff; } }
body { margin: 0 auto; max-width: 1200px; padding: 24px 16px 64px; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, sans-serif; }
h1 { font-size: 26px; margin: 0 0 8px; } h2 { font-size: 19px; margin: 40px 0 6px; }
p { margin: 6px 0; max-width: 80ch; } code, pre { font: 13px/1.45 ui-monospace, Consolas, monospace; background: var(--code); border-radius: 6px; }
code { padding: 1px 5px; } pre { padding: 12px 14px; overflow-x: auto; }
.meta { color: var(--dim); font-size: 13px; max-width: none; } .dim { color: var(--dim); font-weight: normal; } .warn { color: var(--warn); }
.badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; vertical-align: middle; border: 1px solid currentColor; }
.badge.ok { color: var(--ok); } .badge.bad { color: var(--bad); }
table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 13px; }
th, td { border-top: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
thead th { color: var(--dim); font-weight: 600; border-top: none; }
tbody th { width: 170px; } .status { color: var(--dim); font-weight: normal; font-size: 12px; } .error { color: var(--bad); font-weight: normal; font-size: 12px; max-width: 220px; }
td.size { white-space: nowrap; } .bad { color: var(--bad); background: var(--bad-bg); }
.thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
figure { margin: 0; padding: 4px; border: 1px solid var(--line); border-radius: 6px; font-size: 11px; background-image: conic-gradient(#8884 25%, transparent 0 50%, #8884 0 75%, transparent 0); background-size: 12px 12px; }
figure.bad { border-color: var(--bad); border-width: 2px; }
figure img { display: block; height: 72px; width: auto; max-width: 160px; object-fit: contain; }
figcaption { margin-top: 2px; background: var(--bg); padding: 0 2px; }
a { color: var(--link); } ul { padding-left: 20px; } li { margin: 3px 0; }
details summary { cursor: pointer; margin-top: 8px; }
</style>
</head>
<body>
<h1>The plan and the run</h1>
<p>Each scenario is planned with <code>planAssets</code> (the command's <code>--dry-run</code>), then run with <code>generateAssets</code>. Red: what the plan got wrong. Thumbnails on a checkerboard, so transparency shows. Written by <code>examples/plan.js</code>.</p>
<ul>${summary}</ul>
<h2>The command's <code>--dry-run</code>, scenario 1</h2>
<pre>${escape(command)}
${escape(dryRun)}</pre>
${sections}
</body>
</html>
`;
await fs.writeFile(path.join(ROOT, 'index.html'), page);
console.log(`\nOpen ${path.join(ROOT, 'index.html')}`);
