# Changelog

## Unreleased

A revamp of the unreleased 0.0.1: the same pipeline (sizes resolved from
pixels or multipliers, each size resized from the previous one, formats
encoded in parallel, batches processed by a pool of workers) on a modern
toolchain, with its bugs fixed, every argument validated and logging with
`@mmutils/logger`. And a command line, with the one-config API under it.

### Added: the command line and `generateAssets`

- **`picture-assets`**: `picture-assets <input...> -o <dir>`, with flags for
  sizes, formats, quality, suffix, strategy, upscaling, failures,
  concurrency, a manifest, `--dry-run` and `--json`; a config file
  (`picture-assets.config.json`, `.js` or `.mjs`) under the flags. Logs on
  stderr; exit codes 0, 1 (failures), 2 (usage), 130 (interrupted); Ctrl+C
  lets the files in progress finish. Without `UV_THREADPOOL_SIZE`, it runs
  itself again with the pool sized to the cores: a third less time per
  batch.
- **`generateAssets(config)`**: one plain data config for code, config
  files and flags; only `input` (files, directories, globs, or a list) and
  `output` are required. Unknown keys throw.
- **`planAssets(config)`**: what a run would write, nothing written.
- **Presets**: sizes `'responsive'` (default) and `'retina'`; formats
  `'web'` (default), `'modern'` and `'lossless'`. Shorthands: widths
  `[1280, 640]`, multipliers `['x2']` suffixed `@2x`.
- **`'fallback'` format**: JPEG, or PNG for transparent sources.
- **`upscale`**: with `false`, sizes larger than the source are skipped,
  the largest made at the source's size. `false` with a sizes preset.
- **Manifest and incremental runs** (`manifest`, `force`): unchanged
  sources are `'skipped'`; the manifest lists every file for templates;
  `readManifest`.
- **`signal`** for batches: an `AbortSignal` that stops them (`'aborted'`).
- Sources report their `width` and `height`.

### Added: hooks

- **`hooks`**: functions in the resize chain, at five points: `source`
  (once per source, before its sizes are planned), `beforeResize`,
  `afterResize` (the image goes down the chain), `beforeEncode` (every
  file of the size, not the chain) and `beforeFormat` (one file). Each gets
  a new sharp object and a context (`setting`, `pixels()`, `signal`,
  `logger`, …), and returns nothing (`undefined`), a sharp object (baked
  once) or pixels. A hook that returns nothing (it logs, writes to a
  database, detects something) type-checks also when written apart from
  its hook object. What a point gives is the image from there on: its size
  plans the sizes and names the files, its alpha picks `'fallback'`.
- Points without hooks do nothing: a run without hooks writes the same
  bytes.
- **`HookError`**, with the `hook` and the `point`: fails the size, the file
  (`beforeFormat`) or the source (`source`), under `abortScope`.
- Debug logs when each hook starts and ends, with its time.
- **`--hooks <file>`**: a JS module whose default export is a list of
  hooks, a hook, or a function returning them, over the config file's.
- **`concurrency`** on a hook: at most that many of its calls at once,
  across its points and every run in the process (a GPU model, a rate
  limited API); the others wait their turn, logged at debug.
- The manifest's hash includes each hook's `name`, and its `key` or, without
  one, its code: editing a hook remakes its sources.
- `planAssets` and `--dry-run` don't run hooks: the plan names them
  (`hooksNotRun`) and warns, as the run can differ.
- `examples/hooks.js`, `examples/hooks-pixels.js`, `bench/hooks.js`.

### Changed

- **Logs by level**: `'info'` tells what a run does: its start (sources,
  sizes, formats, output, concurrency), each source's start and end, the
  manifest written, and the summary. `'debug'` adds the resolved settings,
  a line per size (files, bytes, time), each hook's start and end, and
  after the summary the files by format, the slowest source and the peak
  memory, then the graphs. Lines per file moved to `'verbose'`. Timestamps
  have milliseconds (`HH:mm:ss.SSS` on the command line); the command logs
  the config file it read.
- **Paths shown with `/`** in logs, error messages and `--dry-run`, on
  Windows too, as in the manifest; results and `--json` keep native paths.
  Object logs (errors) no longer show Windows paths with doubled
  backslashes.
- **Sources decoded once** when that's faster than resizing from the file:
  a PNG, AVIF, GIF or TIFF, or a JPEG whose largest size is shrunk less
  than 3 times (most of the cost was the ICC profile's transform during
  the resize; from 3 times, shrink-on-load is as fast). Their sizes resize
  from the pixels, each through a new sharp object over them instead of a
  copy: 26% less time for one photo to 3 sizes, 28% for a PNG, 11% for a
  batch, for 19MB more peak memory per photo (11% for the batch). Every
  size from the source of a decoded JPEG is now exactly a resize of its
  full pixels: no shrink-on-load approximation.
- **A source hook's decode is reused**: when a `source` hook reads
  `pixels()` and changes nothing, the sizes resize from those pixels
  instead of decoding the source again.
- **Formats share a size's pixels**: each format gets its own sharp object
  over them, instead of a copy (`clone()`). The same files, as fast; the
  batch's peak memory 790 -> 704MB.
- **Package name**: `picture-assets` (was `image-assets-generator`, taken
  on npm by another package), and so is the command.
- **Functions**: `generateSingleSourceAssets` (was `imageResize`) and
  `generateBatchAssets` (was `batchImageResizeAsync`), with
  `AssetsOptions` and `BatchAssetsOptions`.
- **Environment variables**: `PICTURE_ASSETS_` and the option's name (were
  `IMAGE_RESIZE_*`): `PICTURE_ASSETS_RESIZE_STRATEGY_HINT`, `_SUFFIX`,
  `_FORMAT_OPTIONS` (was `IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS`),
  `_ABORT_SCOPE` and `_LOG_LEVEL`. New: `PICTURE_ASSETS_CONCURRENCY`.
- **License**: MIT (was ISC).
- **Suffix wildcards** `{sm}`, `{wm}` and `{hm}` are `{x}` (the multiplier,
  as in `@{x}x` for `@2x`), `{wx}` and `{hx}`. Any other name in braces
  throws: it was written into the file names.
- **Options object.** `generateSingleSourceAssets(src, dest, settings,
formats?, options?)` and `generateBatchAssets(src, destRoot, settings,
formats?, options?)` take `resizeStrategyHint`, `suffix`,
  `formatOptions`, `abortScope`, `logger` and (batch) `concurrency`,
  instead of an `ExecutionContext` with a
  logger and an execution scope to build by hand. `numberOfWorkers` is now
  `concurrency` (`'max_threads'` is `'max'`).
- **Options resolved per call**: the call, then the environment variable,
  then the default. They were read once, when the module was imported.
  Invalid values throw, naming the option or the variable, instead of
  falling back to defaults with a warning.
- **`abortScope`** is `'none'` (default, best effort), `'source'` or
  `'batch'` (fail fast: rejects with the partial result). The scopes
  `'format'`, `'setting'`, `'source'` and `'batch'` did the opposite of
  their documentation.
- **Statuses**: `'failed'` means an error in the unit or below; `'aborted'`
  only units stopped by another source's failure. A batch lists every
  source found, in path order (it was completion order), and results have
  a `duration`. `outputsBySetting` is always a list; sources and settings
  that failed have an `error`.
- **Batch sources**: a file, a directory, a glob or `{ root, pattern }`
  (was `{ root, resource }`). The tree below the root is mirrored in the
  destination, also for globs; files sharp can't read are skipped.
- **Default format options** are applied (they never were): progressive
  JPEG q80, WebP q80, AVIF q60, lossless PNG at zlib 9, chosen with
  bench/weight.js. `png: { quality: 100 }` turned on a lossy palette.
- `formats` accepts any list (`OutputFormat[]`), validated at runtime,
  instead of a non-empty tuple type.
- Exports: the types, `DEFAULT_FORMAT_OPTIONS`, `DEFAULT_OPTIONS`,
  `ENV_VARIABLES`, `resolveOptions`, `readEnvOptions`,
  `computeConcurrency`, `parseSuffix`, `createLogger`, `OUTPUT_FORMATS`,
  `INPUT_EXTENSIONS`, `canWriteFormat`.

### Fixed

- Error messages tell binary data and long lists by their size, and cut
  descriptions at 200 characters: a hook that returned an encoded image
  (5.6 MB) made a message of 20 MB, in 150 ms.
- `src/log/logger.ts` didn't compile. Errors were logged as `{}`.
- The batch processed at most 5 files.
- After a crop, the next size kept the crop.
- A reused size smaller than the next one was upscaled.
- Chained sizes drifted: each was resized with `fit: 'cover'`, cropping
  the fraction of a pixel by which its rounded size missed the aspect
  ratio, and the crops added up (SSIM down to 0.905 against one resize
  from the source). Sizes with the source's aspect ratio are scaled to
  fill.
- EXIF orientation was ignored: phone photos came out sideways.
- Transparent images written as JPEG showed the hidden colors of
  transparent pixels; they are flattened on white.
- The caller's `formats` object was modified: a batch's first source
  format leaked into the next sources.
- `dest/hero.v2` dropped `.v2`, and without formats wrote nothing while
  reporting success.
- Input-only formats (`svg`, `pdf`) and junk aliases (`pg`, `if`, …) passed
  as output formats.
- `isSizeMultiplier` accepted `'x 2'` and `'x0x10'`.
- Multiplier sizes could be a pixel off: the source multiplier was rounded
  to 2 decimals (a 640x480 `x1` gave 1919 pixels for `x3`).
- Files with the same name in different directories, or two settings with
  the same suffix, overwrote each other; they fail instead.
- Outputs inside the source tree were processed again by the next batch.
- A failing batch kept its probe interval, and the process, running.
- libvips kept sources open after a run: Windows couldn't change or delete
  them. Sources are read once.
- The CommonJS build was `.js` in a `"type": "module"` package, so
  `require` loaded it as ESM; `types` came last in `exports`.

### Added

- Vitest specs next to the sources, end to end with generated images.
- `bench/`: the pipeline against plain sharp, chained sizes, batch
  concurrency, encoders, and quality per byte, with `@mmutils/bench`.
- `examples/`, README, and `docs/cli-proposal.md`.

### Removed

- Dependencies: `glob` (Node's `fs.glob`), `help`, `color-convert`,
  `@mmutils/assert`, `@mmtypes/common`; jest, ts-jest, typedoc, rimraf and
  9 ESLint packages from the development ones.
