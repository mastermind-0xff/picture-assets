# picture-assets

Turns source images into web-ready assets: every resolution (pixels or
`x2`-style multipliers) and format you need, from one image or a whole
directory tree, with defaults tuned for quality per byte. A command and a
library, built on [sharp](https://sharp.pixelplumbing.com/), logging with
[@mmutils/logger](https://www.npmjs.com/package/@mmutils/logger).

```sh
npx picture-assets src/images -o public/img
```

```ts
import { generateAssets } from 'picture-assets';

await generateAssets({ input: 'src/images', output: 'public/img' });
```

Both make every image below `src/images` in the widths of a responsive
srcset (2560 to 320 pixels, never enlarged), in AVIF, WebP and JPEG (PNG
for transparent images): `public/img/house@1280w.avif`, ….

- **Two settings**: an input and an output. Presets for the rest
  (`responsive`, `retina`; `web`, `modern`, `lossless`), every detail
  configurable.
- **Web-tuned encoders**: AVIF at 53% and WebP at 73% of JPEG's bytes for
  the same SSIM, progressive JPEG (see [Defaults](#defaults)).
- **Correct on real photos**: EXIF orientation applied, transparent images
  get PNG instead of JPEG (or a white background when JPEG is asked for),
  color profiles converted to sRGB, metadata stripped.
- **Fast**: the source is read once, each size resized from the previous
  one, formats encoded in parallel, batches processed several sources at a
  time. It takes 45% of the time of one sharp call per file, and 74% of
  the time of resizing each size once with sharp (see
  [bench/](bench/README.md)).
- **Incremental**: with a manifest, unchanged images are skipped, and the
  manifest lists every file for your templates.
- **Directory trees**: directories, globs or files; each tree is mirrored
  in the output, outputs never overwrite each other.
- **Predictable failures**: invalid arguments throw before any work, with
  messages naming the field; processing failures are in the result, or
  stop the run, as you choose.
- **ESM and CommonJS**, typed.

## Install

```sh
npm install picture-assets
```

Requires Node.js 22.17 or newer. The package installs the `picture-assets`
command: run it with `npx picture-assets`, installed or not, or from your
`package.json` scripts.

## Command line: `picture-assets`

```text
picture-assets <input...> --output <dir> [options]
```

```sh
picture-assets src/images -o public/img
picture-assets 'photos/**/*.jpg' -o dist/img -s 1920,1280,640 -f avif,webp,jpg
picture-assets logo.png -o public -s x1,x2,x3 --strategy 160x40
picture-assets src/images -o public/img --manifest public/img/assets.json
picture-assets src/images -o public/img --dry-run
```

Inputs are files, directories or globs (quoted, so the shell leaves them
alone). The main flags; `picture-assets --help` has them all:

| Flag                  | Meaning                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `-o, --output <dir>`  | Destination directory                                                     |
| `-s, --sizes`         | Widths `1920,1280,640`, multipliers `x1,x2,x3`, or `responsive`, `retina` |
| `-f, --formats`       | `avif,webp,jpg,png,…` and `fallback`, or `web`, `modern`, `lossless`      |
| `-q, --quality`       | `75` for every lossy format, or `avif=55,webp=75`                         |
| `--manifest <file>`   | Write a manifest; unchanged sources are skipped by the next runs          |
| `--dry-run`, `--json` | Print the plan, or the result as JSON, on stdout                          |
| `-v`, `--silent`      | More logs (every file, graphs), or none                                   |

Logs go to stderr. Exit codes: 0 done, 1 some sources failed, 2 invalid
arguments or config, 130 interrupted. Ctrl+C lets the files in progress
finish, so none is left half written; a second Ctrl+C quits at once.

**Config file.** `picture-assets.config.json` (or `.js`, `.mjs` exporting
it) in the current directory, or `--config <file>`, holds the config of
`generateAssets`; its paths are relative to it. Flags win over the file,
which wins over the `PICTURE_ASSETS_*` variables:

```json
{
  "input": ["src/images", "src/icons/*.png"],
  "output": "public/img",
  "formats": "modern",
  "formatOptions": { "avif": { "quality": 55 } },
  "manifest": "public/img/assets.json"
}
```

A `.js` config file can also set `hooks` (see [Hooks](#hooks)): they are
functions, so JSON and flags can't.

**Thread pool.** Sharp runs on libuv's thread pool, 4 threads by default,
the bottleneck of batches (see [bench/](bench/README.md)). libuv sizes it
when a process starts, so when `UV_THREADPOOL_SIZE` is not set, the command
runs itself again with it set to the number of cores: a 10 photo batch took
885ms instead of 1.32s on a 12 thread laptop.

## One config: `generateAssets`

```ts
generateAssets(config: AssetsConfig): Promise<ResultBatch>
planAssets(config: AssetsConfig): Promise<AssetsPlan>
```

The command line's config, as plain data, so it can live in JSON. Only
`input` and `output` are required.

| Key           | Default        | Meaning                                                                                     |
| ------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `input`       |                | A file, directory or glob, or a list of them. Each tree is mirrored in `output`             |
| `output`      |                | Destination directory                                                                       |
| `sizes`       | `'responsive'` | A preset, or widths (`1280`), multipliers (`'x2'`, suffixed `@2x`) and settings (see below) |
| `formats`     | `'web'`        | A preset, or formats as `generateSingleSourceAssets` takes them, `'fallback'` included      |
| `upscale`     | see meaning    | Sizes larger than the source: not made with a sizes preset, made otherwise                  |
| `manifest`    |                | A JSON file listing every source and file; makes runs incremental                           |
| `force`       | `false`        | Process every source, even unchanged ones                                                   |
| `concurrency` | `'auto'`       | Sources at a time, see `generateBatchAssets`                                                |
| `signal`      |                | An `AbortSignal` stopping the run                                                           |

Plus the [options](#options) of `generateSingleSourceAssets`: `suffix`,
`formatOptions`, `resizeStrategyHint`, `abortScope`, `logger`. Unknown
keys throw: a typo in a config file is an error, not an option silently
ignored.

| Preset                | Gives                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| `sizes: 'responsive'` | Widths 2560, 1920, 1280, 960, 640, 320                                  |
| `sizes: 'retina'`     | `x3`, `x2`, `x1` with `@3x`, `@2x`, `@1x` suffixes, the source being 3x |
| `formats: 'web'`      | `avif`, `webp`, `fallback`                                              |
| `formats: 'modern'`   | `avif`, `webp`                                                          |
| `formats: 'lossless'` | Lossless `webp`, and `png`                                              |

**`'fallback'`** is JPEG, or PNG for transparent sources: the format for
browsers without AVIF and WebP, chosen per source.

**Without upscaling**, sizes larger than the source are `'skipped'`, but the
largest of them is made at the source's size, unless a size already is: a
1500 pixels wide photo gives 1500, 1280, 960, … with `responsive`, so the
largest file keeps every pixel.

**Manifest.** After each run, the manifest lists every source that
succeeded or was unchanged, by its path relative to the manifest, with its
size and files (path relative to the manifest, format, width, height,
bytes): what templates need to write `<picture>` and `srcset`. Read it with
`readManifest`. A source is skipped (`'skipped'` in the result) when its
file, the options deciding its files, and its files are all as the
manifest recorded.

**`planAssets`** tells what `generateAssets` would do, without writing
anything: each source's size, its sizes in pixels (multipliers resolved)
and its files, or why it is unchanged or would fail. It is the command's
`--dry-run`.

## One source: `generateSingleSourceAssets`

```ts
generateSingleSourceAssets(srcPath, destPath, settings, formats?, options?): Promise<ResultSource>
```

**`destPath`** decides the file names:

| `destPath`             | Files                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| `'out/'` (a directory) | `out/house@1280w.webp`: named after the source                   |
| `'out/hero'`           | `out/hero@1280w.webp`                                            |
| `'out/hero.webp'`      | `out/hero@1280w.webp`, and `webp` is added to the formats        |
| `'out/hero.v2'`        | `out/hero.v2@1280w.webp`: an extension that isn't a format stays |

**`settings`**: one object per size. Give a width or a height, or both for
another aspect ratio (cropped to fill, see `resizeOptions`).

| Field                      | Meaning                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `width`, `height`          | Pixels, or a multiplier: `'x1'`, `'x2'`, `'x1.5'` (see [Multipliers](#multipliers))      |
| `suffix`                   | File name suffix, default `'@{w}w'`, with wildcards (see [Suffix](#suffix))              |
| `resizeOptions`            | sharp's resize options: `fit`, `position`, `background`, `kernel`, `withoutEnlargement`… |
| `extractRegion`            | `{ left, top, width, height }` cut from the resized image                                |
| `generateFromSource`       | Resize this size from the source instead of the previous size                            |
| `useAsNextResizeIteration` | Resize the next size from this one (default for the same aspect ratio, no crop)          |

Sizes are processed from the largest. Each size is resized from the
previous one when it has the source's aspect ratio and no crop, otherwise
from the source: never from an image smaller than the size.

**`formats`**: `['avif', 'webp', 'jpg']`, or with options for this call:
`{ webp: { quality: 70 }, jpg: {} }`. Without formats, the destination's
extension or the source's format is used. Formats: `avif`, `webp`, `jpeg`
(`jpg`), `png`, `gif`, `tiff` (`tif`), `heif`; `jxl` and `jp2` with a
custom libvips build.

### Multipliers

A multiplier size, `'x2'` or `'x1.5'`, is relative to `x1`, the size for
screens with one device pixel per CSS pixel. The `resizeStrategyHint`
option tells what `x1` is. For a 3000x2000 photo and the sizes `x1`, `x2`
and `x3`:

| `resizeStrategyHint`           | `x1` is                                                              | Widths of `x1`, `x2`, `x3` |
| ------------------------------ | -------------------------------------------------------------------- | -------------------------- |
| `'downsample'` (default)       | A third of the photo: the photo is the largest multiplier, `x3` here | 1000, 2000, 3000           |
| `'upsample'`                   | The photo itself: larger sizes are enlarged                          | 3000, 6000, 9000           |
| `'x2'` (any multiplier)        | Half the photo: the photo is `x2`, so `x3` is enlarged               | 1500, 3000, 4500           |
| `{ width: 1200, height: 800 }` | That size, a slot in your layout, whatever the size of the photo     | 1200, 2400, 3600           |

`{ width, height }` with another aspect ratio than the photo's gives the
smallest size with the photo's aspect ratio that covers it:
`{ width: 1200, height: 1200 }` makes `x1` 1800x1200.

With `'downsample'` and sizes in pixels, the smallest pixel size is `x1`:
sizes 1280 and 640 are `x2` and `x1` (for the `{x}` wildcard), and an
`'x3'` next to them would be 1920 wide. When every pixel size is larger
than the photo, the largest multiplier is the photo, as above.

### Suffix

Files are named `<name><suffix>.<format>`, the suffix being the setting's
`suffix` or else the `suffix` option, `'@{w}w'` by default. Its wildcards,
for `x2` of a 3000x2000 photo with `'downsample'` and sizes `x1` to `x3`
(the file is 2000x1333):

| Wildcard       | Replaced with                                  | Here     |
| -------------- | ---------------------------------------------- | -------- |
| `{w}`          | The width of the file, in pixels               | `2000`   |
| `{h}`          | The height of the file, in pixels              | `1333`   |
| `{x}`          | The multiplier of the size: the `2` of `2x`    | `2`      |
| `{wx}`, `{hx}` | The multipliers of the width and of the height | `2`, `2` |

So `'@{x}x'` writes `house@2x.webp`, and `'-{w}x{h}'` writes
`house-2000x1333.webp`. Every size has a multiplier, sizes in pixels too
(see [Multipliers](#multipliers)). `{wx}` and `{hx}` differ only for
sizes with another aspect ratio than the source, `{x}` being their
average: `{ width: 'x2', height: 'x1' }` has `{wx}` 2, `{hx}` 1 and `{x}`
1.5.

Characters not allowed in file names are removed. Any other name in braces
throws, as it would end up in the file names: `{width}` is a typo for
`{w}`. Two sizes with the same suffix fail instead of overwriting each
other.

### Options

Every option falls back to its environment variable, then to its default.
Invalid values throw, naming the option or the variable.

| Option               | Default        | Variable                              | Meaning                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resizeStrategyHint` | `'downsample'` | `PICTURE_ASSETS_RESIZE_STRATEGY_HINT` | What `x1` is: `'downsample'` (inferred from the sizes: the smallest pixel size is `x1`, else the source is the largest multiplier), `'upsample'` (the source is `x1`), a multiplier like `'x2'` (the source is `x2`), or a size `{ width, height }` (`x1` is that size). See [Multipliers](#multipliers) |
| `suffix`             | `'@{w}w'`      | `PICTURE_ASSETS_SUFFIX`               | Suffix of settings without their own, see [Suffix](#suffix)                                                                                                                                                                                                                                              |
| `formatOptions`      | `{}`           | `PICTURE_ASSETS_FORMAT_OPTIONS`       | Options per format for every call, as JSON in the variable                                                                                                                                                                                                                                               |
| `abortScope`         | `'none'`       | `PICTURE_ASSETS_ABORT_SCOPE`          | What a failure stops, see [Failures](#failures)                                                                                                                                                                                                                                                          |
| `logger`             | `'info'`       | `PICTURE_ASSETS_LOG_LEVEL`            | A log level for the default logger, or a logger, see [Logging](#logging)                                                                                                                                                                                                                                 |
| `upscale`            | `true`         |                                       | Make sizes larger than the source; with `false` they are skipped, see [`generateAssets`](#one-config-generateassets)                                                                                                                                                                                     |
| `hooks`              | `[]`           |                                       | Functions in the resize chain, see [Hooks](#hooks)                                                                                                                                                                                                                                                       |

Load the variables from a file with `node --env-file=.env` (see
[`.env.example`](.env.example)).

## Many sources: `generateBatchAssets`

```ts
generateBatchAssets(srcPath, destRoot, settings, formats?, options?): Promise<ResultBatch>
```

`srcPath` is a directory, a glob, a file, or `{ root, pattern }`. The tree
below the root is mirrored in `destRoot`. For `photos/2024/beach.jpg`,
`photos/2024/city.png` and `photos/hero.jpg`, with `destRoot` `'out'`:

| `srcPath`                                   | Sources                 | Root          | `beach.jpg` gives           |
| ------------------------------------------- | ----------------------- | ------------- | --------------------------- |
| `'photos'`                                  | Every image below it    | `photos`      | `out/2024/beach@1280w.webp` |
| `'photos/**/*.jpg'`                         | `beach.jpg`, `hero.jpg` | `photos`      | `out/2024/beach@1280w.webp` |
| `'photos/2024/*.jpg'`                       | `beach.jpg`             | `photos/2024` | `out/beach@1280w.webp`      |
| `{ root: 'photos', pattern: '2024/*.jpg' }` | `beach.jpg`             | `photos`      | `out/2024/beach@1280w.webp` |
| `'photos/2024/beach.jpg'`                   | `beach.jpg`             | `photos/2024` | `out/beach@1280w.webp`      |

A glob's root is its part before the first wildcard. `{ root, pattern }`
chooses it: the pattern is a glob inside the root, and the root is a plain
path, so a directory named `photos [2024]` works as a root, where a glob
would read `[2024]` as a wildcard.

Files sharp can't read are skipped; outputs inside the source tree are
never picked up again. Two sources that would write the same files
(`a.jpg` and `a.png`) fail instead of overwriting each other.

`options` are `generateSingleSourceAssets`'s, plus `concurrency`: sources
processed at the same time. `'auto'` (default) is the libuv thread pool
size (`UV_THREADPOOL_SIZE`, 4 by default), on which sharp runs; `'max'`
the machine's parallelism; or a number. `PICTURE_ASSETS_CONCURRENCY` sets
it for every call, as it depends on the machine more than on the project.

And `signal`: an `AbortSignal` that stops the batch. The files in progress
are finished, so none is left half written, and nothing new starts. The
call resolves (it doesn't reject) with the batch `'aborted'`: the sources
done have `'succeed'`, the others `'aborted'`. To stop on Ctrl+C or after
10 minutes:

```ts
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());

const batch = await generateBatchAssets('photos', 'out', settings, formats, {
  signal: AbortSignal.any([controller.signal, AbortSignal.timeout(600_000)]),
});
if (batch.status === 'aborted') console.log('Stopped before the end.');
```

`generateAssets` takes the same `signal`; with a manifest, the next run
makes only what the stopped one didn't (see
[`examples/abort.js`](examples/abort.js)).

The pool is the batch's bottleneck: set `UV_THREADPOOL_SIZE` to the number
of cores before the process starts (`UV_THREADPOOL_SIZE=12 node build.js`;
setting it from the script is too late). On a 12 thread laptop, it cut a
10 photo batch from 1.32s to 885ms. The command line does it for you.

## Hooks

Functions in the resize chain: a color grade, a crop centered on the
subject, an AI upscaler, a watermark. A hook is an object with a `name` and
a function at one or more points. At each point the hooks run in the
list's order, each on the image the previous one gave.

```js
await generateAssets({
  input: 'src/images',
  output: 'public/img',
  hooks: [
    {
      name: 'grade',
      key: 'warm-1',
      source: (image) => image.modulate({ saturation: 1.1 }),
    },
    {
      name: 'avifSharpen',
      beforeFormat: (image, { format }) =>
        format === 'avif' ? image.sharpen({ sigma: 0.5 }) : undefined,
    },
  ],
});
```

| Point          | Runs                                                                            | Changes                                                                      |
| -------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `source`       | Once per source, after it is read (EXIF orientation applied)                    | The source: the sizes are planned from what it gives                         |
| `beforeResize` | Per size, on the image the size is resized from (the source or a previous size) | This size, and the sizes resized from it                                     |
| `afterResize`  | Per size, after the resize                                                      | This size, and the sizes resized from it: effects add up down the chain      |
| `beforeEncode` | Per size, once the next sizes took it                                           | Every file of this size, not the chain: a watermark at each size's own scale |
| `beforeFormat` | Per file, before it is encoded                                                  | That file. The format is set after the hook: it can't change it              |

Each function gets a new sharp object over the image, never one the run
uses, and a context: the `source` path, the image's `width`, `height` and
`channels`, `pixels()` (a copy of its pixels, 8 bits per channel, for JS
or a model), the run's `signal` and `logger`. The size points add the
`setting` (planned `width` and `height`, `sizeMultiplier`, `suffix`,
`resizeOptions`, `extractRegion`), `beforeFormat` the `format`, its
encoder `options` and the `file`. It returns, or resolves to:

- `undefined`: no change.
- a sharp object: baked to pixels before the next hook or step, so its
  operations run once, and before what follows (sharp runs a pipeline's
  operations in its own order, not in call order). At `beforeFormat` it is
  encoded as it is.
- pixels, `{ data, info: { width, height, channels } }`: used as they are.

**What a point gives is the image from there on**, its size and
transparency included. A `source` hook that upscales gets the larger sizes
made where `upscale: false` would skip them; one that adds alpha makes
`'fallback'` write PNG. A size whose hooks change its size names its files
by the new size and hands it to the next sizes. An image of another aspect
ratio (a hero crop at `beforeResize`) is cropped to the size, as built-in
crops are, not stretched.

**Cost.** A point without hooks does nothing: a run without hooks writes
the same bytes in the same time. A hook costs its own work and, for a sharp
object, one bake to pixels. A `source` hook can even make a run faster:
the sizes are then resized from its pixels instead of the JPEG (see
[bench/hooks.js](bench/README.md#results)).

**Failures.** A hook that throws, or returns something else, fails with a
`HookError` (its `hook`, its `point`, the hook's error as its `cause`): its
size, its file at `beforeFormat`, its source at `source`, under
`abortScope` as any failure.

**Logs.** At `'debug'`, each hook call logs when it starts and when it
ends, with its time, its bake included. The default logger and the
command's have timestamps to the millisecond.

**Manifest.** Functions can't be compared: a manifest's hash includes each
hook's `name` and `key`. Change the `key` when a hook's work changes, or
the next run skips its sources as unchanged.

**Config.** Hooks come from code or a `.js` config file. `planAssets` and
`--dry-run` don't run them: sizes are planned from the sources as read, so
a run with hooks can differ from its plan. The plan names them
(`hooksNotRun`, and a line in `--dry-run`'s output) and warns.

[`examples/hooks.js`](examples/hooks.js) grades, crops around a focal
point, watermarks and sharpens AVIF;
[`examples/hooks-pixels.js`](examples/hooks-pixels.js) upscales and adds
alpha through `pixels()`.

## Results

Both functions resolve with a tree of results: batch → sources → settings
→ files, each with a `status`.

| Status      | Meaning                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `'succeed'` | Everything below was written, or skipped                                                                |
| `'failed'`  | Something below failed: see the `error` of the source, setting or file                                  |
| `'aborted'` | Stopped before it was done, because another source failed (`abortScope: 'batch'`) or the `signal` fired |
| `'skipped'` | A size larger than the source (`upscale: false`), or a source unchanged since the manifest              |

Written files have `fileData`: sharp's output info, with `size` in bytes,
`width` and `height`. Sources have their `width` and `height`, as shown. A
batch lists every source found, in path order, and both levels have a
`duration` in milliseconds.
[`examples/picture.js`](examples/picture.js) turns a result into a
`<picture>` element.

## Failures

Invalid arguments and options throw a `TypeError` or `RangeError` before
any work. Processing failures (a broken file, a full disk) follow
`abortScope`:

- `'none'` (default): best effort. Every output is attempted; failures are
  logged and in the result.
- `'source'`: a failure stops the rest of its source; other sources go on.
- `'batch'`: fail fast. The work in progress finishes (no file is written
  after the call settles), nothing new starts, and the call rejects with a
  `ResultSourceError` or `ResultBatchError` whose `resultSource` or
  `resultBatch` has the partial result.

## Logging

The default logger is `@mmutils/logger` with the message and graph
plugins: a line per source and per batch at `'info'`, a line per file at
`'debug'` plus graphs of a batch's CPU, memory and progress. Pass a level,
or your own logger: a `@mmutils/logger` `Logger` (with `jsonPlugin` for JSON
lines, for example) or any object with `error`, `warning`, `info`, `debug`
and `verbose` methods.

Timestamps have milliseconds, so the debug lines around each hook (see
[Hooks](#hooks)) and file tell where the time goes.

## Defaults

JPEG at quality 80 is the usual web baseline. Measured on three photos at
1280 pixels wide, SSIM against the uncompressed pixels
([bench/weight.js](bench/weight.js)):

| Format | Default                 | Bytes vs baseline JPEG | SSIM (baseline 0.9735) |
| ------ | ----------------------- | ---------------------- | ---------------------- |
| JPEG   | quality 80, progressive | 97%                    | 0.9735                 |
| WebP   | quality 80              | 73%                    | 0.9753                 |
| AVIF   | quality 60              | 53%                    | 0.9716                 |
| PNG    | lossless, zlib level 9  | 1098%                  | 1                      |

mozjpeg was not smaller at the same SSIM and encodes about 5 times slower:
opt in with `{ jpg: { mozjpeg: true } }`. Every option is in
`DEFAULT_FORMAT_OPTIONS` and can be changed per call or with
`formatOptions`.

## Examples

Build first (`npm run build`), then run one with `node examples/<file>`, or
all with `npm run examples`. They use the photos in `examples/images` and
write to `examples/output`.

| File                                              | Shows                                               |
| ------------------------------------------------- | --------------------------------------------------- |
| [`quick-start.js`](examples/quick-start.js)       | One photo, 3 widths, AVIF, WebP and JPEG            |
| [`multipliers.js`](examples/multipliers.js)       | `x1`/`x2`/`x3` sizes and `resizeStrategyHint`       |
| [`art-direction.js`](examples/art-direction.js)   | Other aspect ratios, `position: 'attention'`, crops |
| [`hooks.js`](examples/hooks.js)                   | A grade, a hero crop, a watermark, AVIF sharpening  |
| [`hooks-pixels.js`](examples/hooks-pixels.js)     | Hooks on pixels: an upscaler, an alpha vignette     |
| [`picture.js`](examples/picture.js)               | A `<picture>` element from the result               |
| [`format-options.js`](examples/format-options.js) | Defaults, `formatOptions`, per call options         |
| [`batch.js`](examples/batch.js)                   | A directory tree, mirrored                          |
| [`errors.js`](examples/errors.js)                 | `abortScope`, results and errors                    |
| [`logging.js`](examples/logging.js)               | Log levels, graphs, JSON lines to a file            |
| [`generate.js`](examples/generate.js)             | `generateAssets`, a manifest, an incremental run    |
| [`abort.js`](examples/abort.js)                   | A run stopped by an `AbortSignal`, then finished    |
| [`cli.js`](examples/cli.js)                       | The command with a config file, `--dry-run`         |

## Benchmarks

[`bench/`](bench/README.md) measures the pipeline with
[@mmutils/bench](https://www.npmjs.com/package/@mmutils/bench) against plain
sharp, chained sizes against sizes from the source, batch concurrency and
encoders, and reports quality per byte.

## Development

```sh
npm install
npm run check      # format, lint, typecheck, tests
npm run coverage   # tests with coverage
npm run build      # dist/esm, dist/cjs, dist/types
npm run examples   # build, then every example
npm run bench      # build, then the pipeline benchmark
```

How the command line and `generateAssets` came to be, and the decisions
left before 1.0: [docs/cli-proposal.md](docs/cli-proposal.md).

## AI assistance

picture-assets core was manually built and since the 2026 revamp (the
toolchain, the fixes, the command line), most of the code, tests,
benchmarks and documentation was modified or written by AI. The author
designs the features, makes the decisions and reviews the changes and the
code, and every change passes the same checks (formatting, lint, strict
type checking and tests) before it is committed.

## License

[MIT](LICENSE)
