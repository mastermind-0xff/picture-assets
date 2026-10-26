# Hooks: proposal and decisions

Written 2026-10-22 from a discussion with the author, while another
session finished the `cli` branch and renamed the package; kept as working
notes during the hooks work (branch `hooks`), and moved here on 2026-10-24
as the history of the decisions, like `docs/cli-proposal.md`. Sections 1 to
5 are the proposal as written before the work (line numbers of that time:
find the functions by name); 6 and 7 what was built and what is left; 8
the branch `hook-results`. The user documentation is the README's Hooks
section. Point names are those of their time: `source` is `afterSourceLoad`
since section 8.

Sections: what the author decided, what was measured, the suggested
design, open questions, order of work, what was built, what is left, the
names and the encoder options.

## 1. Decided by the author

- **What the tool is**: run once, at build time, on the backend (CPU and
  memory heavy). One big, good quality source becomes the sizes, formats
  and art-directed crops a `<picture>` element needs later in development.
  No live version, no `<picture>` / `srcset` markup: that is another
  tool's job, the manifest is the hand-off.
- **Name**: `picture-assets`, unscoped on npm, so `npx picture-assets`
  works and no placeholder package is needed. Free on 2026-10-22, and so
  were the look-alikes npm would block (`pictureassets`, `picture_assets`,
  `picture.assets`). The rename is done in the `cli` session.
- **Art direction stays built in**: settings with other aspect ratios,
  `resizeOptions` (`fit`, `position: 'attention'`, `background`),
  `extractRegion` (see `examples/art-direction.js`). Sharp has every tool
  it needs. Hooks are for crops that need logic, e.g. a hero shot
  centered on its subject, cut from the wide desktop header for mobile.
- **Hooks, not plugins**: functions that run in the resize chain, for
  color correction, AI upscaling, anything in between. A plugin system
  (registry, loading by name) is not needed now.
- **The hook points** (the author's list; the names are suggestions):
  1. after the source is loaded;
  2. before each resize;
  3. after the resize, before the buffer is prepared for the next size:
     the hook changes the chain downwards;
  4. after the buffer was passed to the next sizes: the hook changes all
     formats of this size, not the chain;
  5. before each single format export.
- **Hooks get the sharp object**, not only the pixels, so nothing has to be
  rebuilt (the author's performance concern; measured in section 2: they
  get both, and a sharp object over existing pixels is free).
- **Debug logs** (2026-10-23): a debug message before and after each hook
  call, start / end with the hook's name, to spot each hook's time; the
  logger's timestamps (with milliseconds) read it.
- **No hooks, no work** (2026-10-23): a point with 0 hooks does nothing
  extra.
- **The image follows** (2026-10-23): at each point the image becomes the
  hook's output. Alpha, width and height it adds or changes go down the
  chain. The chain splits before the formats (`beforeEncode`): a watermark
  goes into every format of the size, never down the resize chain.
- **Build it** (2026-10-23): a version to review and polish, with tests,
  bench and demos.

## 2. Measured (2026-10-22)

`examples/images/house-01.jpg` (3901x2926 JPEG, 1.8 MB), sharp 0.35.5,
libvips 8.18.7, Node 22.22.2, Windows, the i7-9750H laptop of
bench/README.md. Median of 9 runs after a warm-up, quick scripts, not
mm-bench: `hook-costs.mjs` (cache on: the encodes and the call order
checks) and `hook-costs-nocache.mjs` (`sharp.cache(false)`: the source and
size numbers below), local scripts removed on 2026-10-24, superseded by
`bench/hooks.js` and the measurements of the decode-first commit.

A 2560x1920 size, 14.1 MB of RGB pixels:

| Operation                                 | Time                      |
| ----------------------------------------- | ------------------------- |
| `sharp(pixels, { raw })`                  | 0.015 ms, the buffer is   |
|                                           | shared, not copied        |
| `.clone()` of that instance               | 10 ms, copies the 14.1 MB |
| bake: pixels -> sharp -> pixels, no op    | 4 ms                      |
| bake with `modulate`, with `sharpen(0.6)` | 76 ms, 81 ms              |
| a JS loop over every byte (a gain)        | 65 ms                     |
| encode jpeg + webp + avif (parallel)      | ~3.2 s                    |
| same, a hook's ops left in the instance   | 3.28 s (run once per      |
|                                           | format)                   |
| same, the hook's ops baked once first     | 2.92 s                    |

The last three are within noise of each other: AVIF dominates.

The source:

| 3901x2926 JPEG   | Resized from the JPEG | From decoded pixels       |
| ---------------- | --------------------- | ------------------------- |
| decode to pixels | (each resize decodes) | 138 ms once, holds 32.7MB |
| resize to 2560   | 339 ms                | 20.5 ms                   |
| resize to 1280   | 157 ms                | 12.6 ms                   |
| resize to 640    | 108 ms                | 9.1 ms                    |

Not understood yet: why the 2560 resize from the JPEG (under 2x, so no
shrink-on-load) costs more than decoding plus resizing the pixels. Check
with mm-bench before relying on it.

Call order:

- `.sharpen().resize(640)` gives the same bytes as
  `.resize(640).sharpen()`: sharp runs its operations in its own fixed
  order, not in call order. Sharpening baked to pixels first, then resized,
  gives other bytes.
- `.resize(1280).resize(640, 200)` gives 640x200: the last resize wins.

What follows from it:

- **A sharp object is a recipe, not an image.** Its operations run when an
  output is asked for, once per output. Keeping the instance saves nothing;
  keeping the pixels does. A new instance over pixels the tool already has
  costs nothing; `clone()` copies them (`structuredClone` of the options,
  input buffer included; see `clone` in
  `node_modules/sharp/dist/constructor.mjs`).
- **"Before the resize" can't mean adding operations to the pipeline the
  tool then resizes**: they would run after the resize, and a hook's
  `resize` / `extract` would be replaced by the tool's (or replace it).
  Hook points must be bake points.

## 3. Suggested design

### The hook object

```ts
interface Hook {
  /** In logs, errors and results. */
  name: string;
  /** In the manifest's settings hash: change it to rebuild the sources. */
  key?: string;
  source?: (image: Sharp, context: SourceContext) => HookReturn;
  beforeResize?: (image: Sharp, context: ResizeContext) => HookReturn;
  afterResize?: (image: Sharp, context: SizeContext) => HookReturn;
  beforeEncode?: (image: Sharp, context: SizeContext) => HookReturn;
  beforeFormat?: (image: Sharp, context: FormatContext) => HookReturn;
}

type RawImage = { data: Buffer; info: { width; height; channels } };
type HookReturn =
  Sharp | RawImage | undefined | Promise<Sharp | RawImage | undefined>;

// options: hooks: [colorGrade(), heroCrop({ ... }), avifSharpen()]
```

One object implements any of the points, so a "plugin" is a hook object
(or a function returning one) and needs no system of its own. `hooks: []`
run in array order at each point.

### The points

Order within one size: `beforeResize` -> resize / extract -> bake ->
`afterResize` -> the size is handed to the next sizes -> `beforeEncode` ->
per format: `beforeFormat` -> encode and write.

| Hook           | When                                   | Changes               |
| -------------- | -------------------------------------- | --------------------- |
| `source`       | once per source, after loading and     | every size            |
|                | EXIF orientation, before sizes are     |                       |
|                | planned                                |                       |
| `beforeResize` | each size; gets the start image (the   | this size, and the    |
|                | source or a previous size) and the     | sizes chained from it |
|                | setting                                |                       |
| `afterResize`  | after the resize, before the next size | this size's files and |
|                | takes the image                        | the sizes after it    |
| `beforeEncode` | after the next size took the image     | this size's files     |
| `beforeFormat` | each file; gets the format and options | this file             |

In the code: `source` after `sharp(input, { autoOrient: true })` and
before `planSource` in `sourceToSettings` (src/image/output.ts:238);
`beforeResize` on the `start` image before the pipeline; `afterResize`
between the raw `toBuffer` (output.ts:303) and
`if (setting.useAsNextResizeIteration) base = ...` (output.ts:341);
`beforeEncode` before `settingToFormats`; `beforeFormat` in
`settingToFormats` per encoder (output.ts:159).

### Rules

1. **Every point is a bake point.** When a hook returns a changed image,
   the tool bakes it to pixels before going on: the hook's own operations,
   plus ~4 ms and one buffer at that size. Several hooks at one point
   bake between each other, for the same call order reason.
   `beforeFormat` is the exception: it is the last step, its operations
   run inside that file's encode.
2. **No hooks, no cost**: a point without hooks is skipped, nothing is
   baked, the pipeline is today's. Acceptance: a run without hooks writes
   byte-identical files and benches the same (`bench/pipeline.js`).
3. **A fresh instance per hook, never the tool's own**: sharp methods
   change the instance they are called on and return it, so a hook
   calling `.resize()` or `.jpeg()` on the tool's pipeline would silently
   change its output. `sharp(pixels, { raw })` is free; at the source,
   before any pixels exist, a new `sharp(input, { autoOrient: true })`
   over the same file buffer (not `clone()`, which copies it).
4. **Pixels too**: `context.pixels()` resolves at once where the tool has
   them (after a resize: free), and decodes on the first call at the
   source (cached; the tool then resizes from those pixels). For AI
   upscalers (onnxruntime, external binaries) and JS loops, which want
   pixels, not sharp.
5. **Return**: `undefined` = no change, no bake; a `Sharp` = the tool bakes
   it; a `RawImage` = used as is, no bake.

### Per point

- **`source`**: color correction, denoise, AI upscale; once per source,
  so the cheapest place for heavy work. With a source hook the source is
  kept as pixels for the source's whole run, and sizes from the source
  resize from them (12-17x faster per size than from the JPEG, measured
  above). Memory: 32.7 MB for this 11.4 MP photo, ~92 MB for 24 MP RGBA,
  times the sources processed at once (`concurrency: 'auto'` follows the
  thread pool: 12 on the author's laptop with the re-spawn, ~1.1 GB).
  Sizes are planned after the hook: an upscale changes which sizes are
  skipped as enlargements (presets, `upscale: false`), the multipliers
  `resizeStrategyHint` infers, and the `{w}` / `{h}` in the names. A 4x
  upscale of 24 MP is 384 MP, over sharp's default `limitInputPixels`
  (268 MP): pass a limit through.
- **`beforeResize`**: the hero crop (a subject box from a detector, or
  focal points from a file, then `extract`). When start is the source,
  the bake is at the source's full size, per size. If the hook changes the
  aspect ratio, the size must stop feeding the next sizes, like built-in
  crops don't (`keepsAspectRatio` / `useAsNextResizeIteration`): the tool
  can tell from the baked dimensions against the planned ones.
- **`afterResize`**: changes the chain on purpose, so effects add up down
  the sizes (a sharpen here sharpens every later size again). Document it.
- **`beforeEncode`**: bake once instead of leaving the operations on the
  instance: left there, they run once per format (3x for the `web` preset;
  within noise next to AVIF for sharp ops, but 3x an AI step).
- **`beforeFormat`**: e.g. extra sharpening for AVIF only (it smooths fine
  detail), or a flatten for JPEG. The tool sets the format after the
  hook (`.avif(...)`), so a hook can't change the file's format.

### Across the points

- **Manifest**: a function can't be hashed reliably (`toString` misses
  closures, model versions): the hash includes each hook's `name` and
  `key`. Without a `key`, changing a hook's settings never rebuilds a
  skipped source: say so in the docs, or require `key`.
- **Config**: hooks are functions, not JSON. The proposal's "one JSON
  shape for code, config file and flags" holds for everything else; hooks
  come from code and `.js` config files only.
- **Errors**: a hook that throws fails its size (or its source, for
  `source`), under `abortScope` as any other failure; the error names the
  hook and the point.
- **Abort**: hooks get the run's `signal` in the context, so a long
  upscale can stop on Ctrl+C.
- **Concurrency**: a GPU upscaler or a paid API may need its own limit
  (`concurrency: 1` on the hook, the run waiting for it).
- **Dry run / `planAssets`**: sizes depend on what `source` hooks return.
  Either the dry run runs the source hooks (slow for AI) or a hook
  declares its scale (`scale: 4`).
- **Context**: source path, the setting, planned width / height, format
  and encoder options (`beforeFormat`), `signal`, `logger`, `pixels()`.

## 4. Open questions (the author's call)

- Hook names: `source`, `beforeResize`, `afterResize`, `beforeEncode`,
  `beforeFormat` are suggestions; `afterResize` (chain) vs `beforeEncode`
  (no chain) happen at the same moment and differ only in what they
  change, the names should make that clear.
- `beforeFormat` returning encoder options too (e.g. quality by size).
- A sixth point, `afterFormat`: the encoded bytes before writing (oxipng,
  jpegli, a check). Needs `toBuffer` + write instead of `toFile`.
  Suggested: later, if asked for.
- `key` optional or required.
- The CLI: a `--hook ./file.js` flag, or hooks only through a `.js`
  config file.
- Dry run: run `source` hooks, or a declared `scale`.
- Whether results list the hooks that ran per size.

## 5. Order of work

1. **Clones** (independent of hooks; may be done in `cli` first):
   `settingToFormats` clones the size once per format (output.ts:159:
   three 14.1 MB copies, ~30 ms at 2560w with `web`), and
   `sourceToSettings` clones the start image per size (output.ts:297).
   Use `sharp(data, { raw })` over the same buffer (and a new
   `sharp(input, { autoOrient: true })` for the source).
2. **Bench first**: move the hook-costs scripts to `bench/` as
   mm-bench cases. Add to `bench/chain.js` a "from the source's decoded
   pixels" case: it may remove why "every size from the source" is 59%
   slower, and its SSIM dip (0.956, JPEG shrink-on-load), at a memory cost.
3. Types (`Hook`, contexts, `HookReturn`), validation of `hooks` (names
   unique, functions), a runner that bakes per rule 1.
4. The points in `sourceToSettings` / `settingToFormats`; planning after
   `source`; the chain rule for changed aspect ratios.
5. Tests: order of points and of hooks; chain vs output-only (a marker
   pixel or a sharpen, compared down the sizes); no hooks = byte-identical
   files; returns (`undefined`, `Sharp`, `RawImage`); errors and
   `abortScope`; abort; the manifest rebuilds when a `key` changes.
6. `examples/hooks.js`: a color grade (`source`), a hero crop from a focal
   point (`beforeResize`), sharpening for AVIF only (`beforeFormat`).
7. README section, CHANGELOG; bench with and without hooks.

## 6. Built (2026-10-23, branch `hooks`)

Commits: `90c09ee` feat: hooks; `d442ff5` perf: decode a source once;
`5abca18` feat: logs by level; `8d11d7e` fix: fixed width timestamps. Files: `src/types/hooks.ts` (public
types), `src/image/hooks.ts` (runner), `src/errors/hook-error.ts`,
`parseHooks` + `HOOK_POINTS` in `src/config/validate.ts`, the points in
`sourceToSettings` / `settingToFormats` (`src/image/output.ts`),
`src/log/describe.ts`. `examples/hooks.js`, `examples/hooks-pixels.js`,
`bench/hooks.js`.

Decided by the author (2026-10-23): point names OK; the end log's
duration OK; timestamps with ms at every level OK; the logger's elapsed
format (`E`, `+1s 241ms`) was tried and reverted (2026-10-24): its width
grows, so the lines don't align; a hook stopped by the
signal fails its size ('failed') OK; planAssets notes that hooks aren't
run (done: `hooksNotRun`, a warning, a dry-run line), though a plan that
differs from the run may be useless. The author reviews `pixels()` (always
a copy) and `'fallback'` per size (follows the alpha a size encodes).

Decode-first (perf commit): resizing from a JPEG with an ICC profile is
2-3.7x slower than decode + resize from pixels below a 3x shrink (the
profile's transform); PNG/AVIF always; WebP never (scaled decode). Fresh
`sharp(raw)` instead of `clone()` for resize starts (clone copied the
pixels: +57MB / +40% batch peak memory -> +19MB / +11%). Releasing the
decoded source after the first size didn't lower the peak.

## 7. The rest of the list, decided (2026-10-24 and 25)

Each item was discussed with examples (plan mode), then decided:

1. Per-format clone: each format copied the size's pixels (`clone()`).
   DONE `8064717`: each format gets its own sharp object over the same
   pixels; concurrency unchanged (each format keeps its pipeline, only the
   read-only buffer is shared). Same bytes; the batch's peak memory 790 ->
   704MB.
2. The hook-costs scripts. DONE: deleted (superseded by `bench/hooks.js`
   and the decode-first measurements).
3. Plan with hooks: running `source` hooks makes it no dry run; not running
   them makes it diverge from the run. DEFERRED to its own branch after this
   list: the plan mode may be dropped altogether (the author tests it; it
   matters most for huge batches). Today: `hooksNotRun`, a warning, a line
   in `--dry-run`.
4. Per-hook concurrency. DONE `e57e44e`: `concurrency` on a hook, one gate
   per hook object shared by its points and every run in the process; a
   waiting call logs it at debug and never starts once the run is stopped.
5. `afterFormat` (encoded bytes before writing). SKIPPED. A prototype with
   13 cases showed: the bytes a hook returns must be probed (0.28ms) or the
   results and manifest lie about size and format; a "lossless" optimizer
   can be silently lossy (sharp's png `effort` turns on a palette) and
   passes every check; a lossy re-encoder makes a second generation the
   format options don't describe; "upload instead of writing" has no
   meaning; an external tool per file costs ~150ms of process start on
   Windows (30 at once 767ms): one optimizer run over the output directory
   after the run is far cheaper.
6. `beforeFormat` returning encoder options (quality by size or by
   content), and 7. results listing the hooks per size, or hooks returning
   data for the results and manifest (dominant color, blurhash, focal
   point). TO DO: a feature for its own branch; the two overlap. Note: a
   `beforeFormat` hook can't change options today, the format and its
   options are set after it; quality by size alone could also be a
   declarative per-size `formatOptions`. Encoder options: done in section
   8 (`beforeFileWrite`); the results and data are left.
7. `key`. DONE `528f89e`, option (e): without a key, the hook's code (each
   point's function as text) is in the manifest's hash, so an edit remakes
   the sources; a key replaces the code. What a function closes over (a
   factory's options, a model's version) needs a key.
8. CLI hooks. DONE `0526566`: `--hooks <file>` (plural: one module exports
   all the hooks: a list, a hook, or a function returning them), over the
   config file's.
9. A source hook's decode. DONE `70333ff`: reused for the sizes, also
   where decode-first alone would not decode (once the decode is paid,
   resizing pixels is faster).
10. This file. DONE: moved to `docs/`, to keep the decisions' history.
11. Decode-first memory knob. NOT ADDED: `concurrency` already bounds the
    decoded sources in memory (documented in the README).
12. Paths. DONE `e06f7d1`: logs, messages and `--dry-run` show `/` on every
    system (the manifest's form); results, `--json` and hook contexts keep
    native paths.

Also decided: elapsed timestamps (`+1s 241ms`) reverted to fixed width
(`8d11d7e`).

Hooks that return nothing (2026-10-26): a working hook (it logs, writes
to a database, detects something). TypeScript types a function without a
`return` as returning `void`, not `undefined`, so one written apart from
its hook object was refused by `HookResult` (a `Promise<undefined>` return
type was needed). Measured on 19 cases with tsc and the lint rules:
`HookResult = Sharp | RawImage | undefined | void` accepts every working
case (sync or async, a guard that throws, `if` without `else`) and still
refuses 42, `null`, encoded bytes, `stats()`, `toFile()`; `void` in a union
needs one `eslint-disable-next-line no-invalid-void-type`. The one hole: a
function declared `=> void` that returns 42, refused at run time. Rejected:
`unknown` (accepts 42), `| Promise<void>` alone (sync functions still
refused).

## 8. Names and encoder options (2026-10-26, branch `hook-results`)

1. The `source` point is renamed `afterSourceLoad` (the author): it says
   which step it follows, and that it runs once per source, like the other
   points' `before` / `after` and a step. Free before 1.0. Manifest hashes
   don't change: a hook's code is hashed by the position of its point.
2. **`beforeFileWrite`**, a sixth point (the author): per file, in
   `sharpToFile` after `toFormat(format, options)` and before `toFile`.
   Found with a sandbox: a hook's `image.avif({ quality: 45 })` at
   `beforeFormat` had no effect, as the run's `toFormat` comes after the
   hook and sharp's format methods set only the keys they get (`quality`
   replaced, `effort`, `lossless`, `palette`, `mozjpeg` kept). The author:
   `beforeFormat` runs before the format is set, as its name says; options
   belong to a point after it. The hook gets the file's own sharp object
   (a new one would lose the format, the options and `beforeFormat`'s
   operations; `clone()` copies the pixels), so what it calls counts,
   returned or not; it returns that object, another, or nothing, not pixels
   (they have no format). Measured: x2 AVIF at quality 45 instead of 60,
   21527 -> 14011 bytes. No check of a format the hook changes (the
   author: hooks are the user's responsibility, a last second format change
   can only be deliberate, and a check is weight on every file): the file's
   name and the format in the results and manifest stay the run's, sharp's
   `fileData.format` tells the real one; documented. Without hooks at the
   point, `sharpToFile` is as before (same bytes). Manifests with hooks
   without a `key` are remade once: the hashed code lists one more point.
   The runner's call of a hook (its turn, its logs, its `HookError`) is
   shared by `run` and `runFileWriteHooks` (`callHook`).
