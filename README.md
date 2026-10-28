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
  (`responsive`; `web`, `modern`, `lossless`), every detail
  configurable.
- **Web-tuned encoders**: AVIF at 58% and WebP at 73% of JPEG's bytes
  for the same SSIM, progressive JPEG (see [Defaults](#defaults)).
- **Correct on real photos**: EXIF orientation applied, transparent images
  get PNG instead of JPEG (or a white background when JPEG is asked for),
  color profiles converted to sRGB, metadata stripped.
- **Fast**: the source is read once (and decoded once, where a scaled
  decode wouldn't help), each size resized from the previous one, formats
  encoded in parallel, batches processed several sources at a time. It
  takes 34% of the time of one sharp call per file, and 56% of the time of
  resizing each size once with sharp (see [bench/](bench/README.md)).
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

| Flag                  | Meaning                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `-o, --output <dir>`  | Destination directory                                                |
| `-s, --sizes`         | Widths `1920,1280,640`, multipliers `x1,x2,x3`, or `responsive`      |
| `-f, --formats`       | `avif,webp,jpg,png,…` and `fallback`, or `web`, `modern`, `lossless` |
| `-q, --quality`       | `75` for every lossy format, or `avif=55,webp=75`                    |
| `--manifest <file>`   | Write a manifest; unchanged sources are skipped by the next runs     |
| `--hooks <file>`      | A JS module exporting the [hooks](#hooks)                            |
| `--dry-run`, `--json` | Print the plan, or the result as JSON, on stdout                     |
| `-v`, `--silent`      | Debug logs (settings, each size and hook, details, graphs), or none  |

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

Hooks (see [Hooks](#hooks)) are functions: a `.js` config file can set
them, or `--hooks <file>`, a module whose default export is a list of
hooks, a hook, or a function returning them. The flag keeps a JSON config
pure data, and wins over the config file's hooks.

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

| Key           | Default        | Meaning                                                                                |
| ------------- | -------------- | -------------------------------------------------------------------------------------- |
| `input`       |                | A file, directory or glob, or a list of them. Each tree is mirrored in `output`        |
| `output`      |                | Destination directory                                                                  |
| `sizes`       | `'responsive'` | A preset, or widths (`1280`), multipliers (`'x2'`) and settings (see below)            |
| `formats`     | `'web'`        | A preset, or formats as `generateSingleSourceAssets` takes them, `'fallback'` included |
| `upscale`     | see meaning    | Sizes larger than the source: not made with a sizes preset, made otherwise             |
| `manifest`    |                | A JSON file listing every source and file; makes runs incremental                      |
| `force`       | `false`        | Process every source, even unchanged ones                                              |
| `concurrency` | `'auto'`       | Sources at a time, see `generateBatchAssets`                                           |
| `signal`      |                | An `AbortSignal` stopping the run                                                      |

Plus the [options](#options) of `generateSingleSourceAssets`: `suffix`,
`formatOptions`, `resizeStrategyHint`, `abortScope`, `logger`. Unknown
keys throw: a typo in a config file is an error, not an option silently
ignored.

| Preset                | Gives                                  |
| --------------------- | -------------------------------------- |
| `sizes: 'responsive'` | Widths 2560, 1920, 1280, 960, 640, 320 |
| `formats: 'web'`      | `avif`, `webp`, `fallback`             |
| `formats: 'modern'`   | `avif`, `webp`                         |
| `formats: 'lossless'` | Lossless `webp`, and `png`             |

**`'fallback'`** is JPEG, or PNG for transparent sources: the format for
browsers without AVIF and WebP, chosen per source.

**Without upscaling**, sizes larger than the source are `'skipped'`, but the
largest of them is made at the source's size, unless a size already is: a
1500 pixels wide photo gives 1500, 1280, 960, … with `responsive`, so the
largest file keeps every pixel.

**Manifest.** After each run, the manifest lists every source that
succeeded or was unchanged, by its path relative to the manifest, with its
size and files (path relative to the manifest, format, width, height,
bytes), and the `data` hooks recorded for it and its files: what templates
need to write `<picture>` and `srcset`. Read it with
`readManifest`. A source is skipped (`'skipped'` in the result) when its
file, the options deciding its files, and its files are all as the
manifest recorded.

**`planAssets`** tells what `generateAssets` would do, without writing
anything: each source's size, its sizes in pixels (multipliers resolved)
and its files, or why it is unchanged or would fail. It is the command's
`--dry-run`. It reads headers, not pixels: the 17 example images in 50 ms,
against 8 s for their run in WebP
([`examples/plan.js`](examples/plan.js)).

**What the plan can't know.** The sources it lists, which of them are
unchanged and which can't be read are always the run's. Their sizes, file
names and formats are too, but where:

- **hooks** change the image: the plan doesn't run them. At
  `afterSourceLoad`, the source's size (which sizes are skipped, what
  multipliers resolve to) and its transparency (`'fallback'`); at
  `afterResize` and `beforeEncode`, a size's own size and transparency; at
  `beforeResize`, its transparency. `beforeFormat` and `beforeFileWrite`
  change nothing in the plan. It names the hooks (`hooksNotRun`) and warns,
  whatever their points.
- **`resizeOptions`** make another size than the one asked:
  `fit: 'inside'` plans 1280x1280 and makes 1280x960, `withoutEnlargement`
  makes the source's size. The size made names the files (`{w}`, `{h}`).
- two sizes write **the same file**: the plan lists it twice, the run fails
  the second size.
- the run fails **as it works**: a hook that throws, an encoder's error, a
  full disk.

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

Other keys throw: `{ width: 'x2', sufix: '@2x' }` is an error, not a size
named by the default suffix. sharp checks the values of `resizeOptions`
and the format options, but ignores keys it doesn't know.

Sizes are processed from the largest. Each size is resized from the
previous one when it has the source's aspect ratio and no crop, otherwise
from the source: never from an image smaller than the size. A source is
decoded once, and its sizes resized from its pixels, when that's faster
than resizing from its file: a PNG, AVIF, GIF or TIFF, or a JPEG whose
largest size is shrunk less than 3 times (from 3 times, JPEG
shrink-on-load is as fast). It costs memory: the decoded source, 34MB for
an 11 megapixel photo, per source in progress. `concurrency` bounds it:
fewer sources at once, fewer decoded sources in memory.

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

Files are named `<name><suffix>.<format>`. The suffix is the setting's
`suffix`, or else the run's: the `suffix` option (code, config file,
`--suffix`), else `PICTURE_ASSETS_SUFFIX`, else `'@{w}w'`. It is the same
for every size: a width (`1280`) or a multiplier (`'x2'`) given as a
shorthand is a setting with only its width, so the sizes `'x1'` to `'x3'`
below write `@1000w`, `@2000w` and `@3000w` files, and with
`suffix: '@{x}x'`, `@1x`, `@2x` and `@3x`. Its wildcards,
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
Invalid values throw, naming the option or the variable, and so do
unknown options (`sufix`), naming the expected ones.

| Option               | Default        | Variable                              | Meaning                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resizeStrategyHint` | `'downsample'` | `PICTURE_ASSETS_RESIZE_STRATEGY_HINT` | What `x1` is: `'downsample'` (inferred from the sizes: the smallest pixel size is `x1`, else the source is the largest multiplier), `'upsample'` (the source is `x1`), a multiplier like `'x2'` (the source is `x2`), or a size `{ width, height }` (`x1` is that size). See [Multipliers](#multipliers) |
| `suffix`             | `'@{w}w'`      | `PICTURE_ASSETS_SUFFIX`               | Suffix of settings without their own, see [Suffix](#suffix)                                                                                                                                                                                                                                              |
| `formatOptions`      | `{}`           | `PICTURE_ASSETS_FORMAT_OPTIONS`       | Options per format for every call, as JSON in the variable                                                                                                                                                                                                                                               |
| `abortScope`         | `'none'`       | `PICTURE_ASSETS_ABORT_SCOPE`          | What a failure stops, see [Failures](#failures)                                                                                                                                                                                                                                                          |
| `logger`             | `'info'`       | `PICTURE_ASSETS_LOG_LEVEL`            | A log level for the default logger, or a logger, see [Logging](#logging)                                                                                                                                                                                                                                 |
| `upscale`            | `true`         |                                       | Make sizes larger than the source; with `false` they are skipped, see [`generateAssets`](#one-config-generateassets)                                                                                                                                                                                     |
| `limitInputPixels`   | `268402689`    | `PICTURE_ASSETS_LIMIT_INPUT_PIXELS`   | Most pixels a source may have (16383 x 16383 by default, sharp's), or `false` for none, see [Untrusted sources](#untrusted-sources)                                                                                                                                                                      |
| `overwriteSource`    | `false`        |                                       | Let a file replace its source (an empty suffix, the source's name and format), to resize in place; with `false` that file fails                                                                                                                                                                          |
| `hooks`              | `[]`           |                                       | Functions in the resize chain, see [Hooks](#hooks)                                                                                                                                                                                                                                                       |
| `recordLimit`        | `64000`        | `PICTURE_ASSETS_RECORD_LIMIT`         | Most bytes of JSON one hook `record` may keep, or `false` for none, see [Data from hooks](#data-from-hooks)                                                                                                                                                                                              |

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

A file or directory named without wildcards that isn't there fails as a
source, with a warning (`Not found: photos/tow.jpg. A misspelled name?`):
the other sources go on, unless `abortScope` is `'batch'`, and the batch
is `'failed'` (exit code 1). Corrected, the next run with a manifest makes
only that one. A glob that matches nothing is a warning.

Files sharp can't read are skipped; outputs inside the source tree are
never picked up again. Two sources that would write the same files
(`a.jpg` and `a.png`) fail instead of overwriting each other. So do
sources outside their root, found by a `..` after the first wildcard
(`'photos/*/../../shared/*.jpg'`): their tree, mirrored, would be outside
`destRoot`.

`options` are `generateSingleSourceAssets`'s, plus `concurrency`: sources
processed at the same time. `'auto'` (default) is the libuv thread pool
size (`UV_THREADPOOL_SIZE`, 4 by default), on which sharp runs; `'max'`
the machine's parallelism; or a number. `PICTURE_ASSETS_CONCURRENCY` sets
it for every call, as it depends on the machine more than on the project.
Each source in progress holds its pixels and its encoders' buffers: with
the defaults, the 17 example images (1 to 40 megapixels) peaked at 1.1 GB
4 at a time, and at 1.9 GB 12 at a time (the command's pool on 12
threads), in the same 30 s, as AVIF already uses every core. Lower it for
large photos on a machine with little memory.

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
      afterSourceLoad: (image) => image.modulate({ saturation: 1.1 }),
    },
    {
      name: 'avifSharpen',
      beforeFormat: (image, { format }) =>
        format === 'avif' ? image.sharpen({ sigma: 0.5 }) : undefined,
    },
    {
      name: 'highDensityQuality',
      // a 2x screen shows it at half its pixels: a lower quality looks the same
      beforeFileWrite: (image, { format, setting }) =>
        format === 'avif' && setting.sizeMultiplier >= 2 ?
          image.avif({ quality: 45 })
        : undefined,
    },
  ],
});
```

| Point             | Runs                                                                             | Changes                                                                      |
| ----------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `afterSourceLoad` | Once per source, after it is read (EXIF orientation applied)                     | The source: the sizes are planned from what it gives                         |
| `beforeResize`    | Per size, on the image the size is resized from (the source or a previous size)  | This size, and the sizes resized from it                                     |
| `afterResize`     | Per size, after the resize                                                       | This size, and the sizes resized from it: effects add up down the chain      |
| `beforeEncode`    | Per size, once the next sizes took it                                            | Every file of this size, not the chain: a watermark at each size's own scale |
| `beforeFormat`    | Per file, before the run sets its format                                         | That file's image                                                            |
| `beforeFileWrite` | Per file, after the run set its format and encoder options, before it is written | That file's encoder options (and image): what the hook sets wins             |

Each function gets a new sharp object over the image, never one the run
uses (but `beforeFileWrite`, see below), and a context: the `source` path, the image's `width`, `height` and
`channels`, `pixels()` (a copy of its pixels, 8 bits per channel, for JS
or a model), the run's `signal` and `logger`, and `record` (see
[Data](#data-from-hooks)). The size points add the
`setting` (planned `width` and `height`, `sizeMultiplier`, `suffix`,
`resizeOptions`, `extractRegion`), `beforeFormat` and `beforeFileWrite`
the `format`, its encoder `options` and the `file`. It returns, or resolves to:

- nothing (`undefined`): no change. A hook may only log, write to a
  database or detect something.
- a sharp object: baked to pixels before the next hook or step, so its
  operations run once, and before what follows (sharp runs a pipeline's
  operations in its own order, not in call order). At `beforeFormat` and
  `beforeFileWrite` it is encoded as it is.
- pixels, `{ data, info: { width, height, channels } }`: used as they are;
  not at `beforeFileWrite`, as pixels have no format.

**What a point gives is the image from there on**, its size and
transparency included. An `afterSourceLoad` hook that upscales gets the
larger sizes made where `upscale: false` would skip them; one that adds
alpha makes `'fallback'` write PNG. A size whose hooks change its size names its files
by the new size and hands it to the next sizes. An image of another aspect
ratio (a hero crop at `beforeResize`) is cropped to the size, as built-in
crops are, not stretched.

**Encoder options.** `beforeFileWrite` gets the file's own sharp object,
once the run set its format and options (`toFormat`), right before it is
written: what the hook sets on it wins (a lower quality for 2x sizes,
lossless for a screenshot), and what it calls on it counts, returned or
not. At `beforeFormat` the run sets its options after the hook, over the
keys it sets (`quality`); other keys stay. Its context is `beforeFormat`'s:
`width`, `height`, `channels` and `pixels()` are the size's image, before
the `beforeFormat` hooks. The file's name, and its `format` in the results
and the manifest, are the run's: a hook that changes the format
(`toFormat('png')` on an AVIF file) writes its bytes under the `.avif`
name, which only sharp's `fileData.format` tells. That is the hook's
choice: the run doesn't check it.

**Cost.** A point without hooks does nothing: a run without hooks writes
the same bytes in the same time. A hook costs its own work and, for a sharp
object, one bake to pixels, at the image's size: an `afterSourceLoad`
hook works on the whole source (see [bench/hooks.js](bench/README.md#results)).

**Concurrency.** A hook runs as many times at once as there are sources
in progress (and formats, at `beforeFormat` and `beforeFileWrite`): 4 by
default, a thread per
core from the command line. For a GPU model or a rate limited API, give it
a `concurrency`: its calls wait their turn, counted across its points and
every run in the process, while the rest of the run goes on.

```js
const upscaler = {
  name: 'upscaler',
  concurrency: 1, // one model run at a time
  afterSourceLoad: async (_image, { pixels }) => runModel(await pixels()),
};
```

A call that waits logs it at `'debug'`; its start and end logs come after
the wait, so its time is its work. A source waiting for its turn holds its
image in memory.

**Failures.** A hook that throws, or returns something else, fails with a
`HookError` (its `hook`, its `point`, the hook's error as its `cause`): its
size, its file at `beforeFormat` and `beforeFileWrite`, its source at
`afterSourceLoad`, under
`abortScope` as any failure.

**Logs.** At `'debug'`, each hook call logs when it starts and when it
ends, with its time, its bake included; see [Logging](#logging).

**Manifest.** A manifest's hash includes each hook's `name`, and its `key`
or, without one, its code: editing a hook remakes its sources on the next
run. What a function closes over isn't in its code, a factory's options
(`colorGrade({ saturation: 1.2 })`) or a model's version: give those hooks
a `key`, and change it with them. With a `key`, the code is not hashed.

**Config.** Hooks come from code, a `.js` config file or `--hooks <file>`
on the command line. `planAssets` and
`--dry-run` don't run them: sizes are planned from the sources as read, so
a run with hooks can differ from its plan (see What the plan can't know,
in [One config](#one-config-generateassets)). The plan names them
(`hooksNotRun`, and a line in `--dry-run`'s output) and warns.

[`examples/hooks.js`](examples/hooks.js) grades, crops around a focal
point, watermarks, sharpens AVIF and lowers the quality of the largest
AVIF, recording the crop and the quality;
[`examples/hooks-pixels.js`](examples/hooks-pixels.js) upscales and adds
alpha through `pixels()`.

### Data from hooks

`record(key, value)` keeps a JSON value in the results and the manifest,
under the hook's name: a placeholder color, a blurhash, a focal point,
alt text, a database id, for the templates that read them.

```js
const placeholder = {
  name: 'placeholder',
  afterSourceLoad: async (image, { record }) => {
    const { dominant } = await image.stats();
    record('color', `rgb(${dominant.r} ${dominant.g} ${dominant.b})`);
  },
};
// the source's result:  data: { placeholder: { color: 'rgb(232 248 248)' } }
// its manifest entry:   "data": { "placeholder": { "color": "rgb(232 248 248)" } }
```

- **Where it goes**: at `afterSourceLoad`, to the source (`ResultSource`
  and its manifest entry); at the other points, to each file
  (`ResultFormat` and its manifest output). A size point's data goes on
  every file of its size; for the same key, a file's own value wins. The
  same key again replaces the value. Without data, there is no `data`
  field.
- **JSON**: the value is kept as a JSON copy, checked when recorded. A
  BigInt or a circular object throws, which fails the hook: written with
  the manifest, after the whole run, it would fail the manifest and name
  no hook. JSON gives the rest back its way: a `Map` as `{}`, a `Date` as
  its string, `NaN` as `null`. TypeScript's `JsonValue` refuses those; a
  value typed by an interface needs a spread (`{ ...point }`).
- **Size**: a value whose JSON is larger than `recordLimit` (64 kB by
  default) throws too, naming the key. Data goes into the manifest once
  per source or per file: an image recorded by mistake, megabytes per
  file, would make a manifest JavaScript can't write or read back
  (strings stop at 512 MB). 64 kB holds colors, hashes, focal points, alt
  text, a placeholder data URI or an embedding of 1024 numbers (about
  20 kB); raise it, or set it to `false`, for more.
- **During the call**: a `record` called after its hook's call ended
  throws.
- **Unchanged sources** are skipped: their hooks don't run, and their
  result has no data, but the manifest keeps their entry, data included.
  A hook with a `key` that starts recording needs a new key (or `force`)
  for the unchanged sources to get the data; without a key, its edited
  code remakes them.

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
`duration` in milliseconds. Sources and files have `data` when hooks
recorded some (see [Data from hooks](#data-from-hooks)).
[`examples/picture.js`](examples/picture.js) turns a result into a
`<picture>` element, with a placeholder color a hook recorded.

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

## Untrusted sources

Images can come from people you don't know: the uploads of a CMS, built
into a site. The config, the flags, a `.js` config and hooks are code you
run, as trusted as your build script; the images, and their file names,
need not be.

- **Size**: a small file can decode to gigabytes (a 1 MB PNG of 16383 x
  16383 pixels is 1 GB in memory), once per source in progress.
  `limitInputPixels` (default 268402689, 16383 x 16383) fails larger
  sources on their header, before any decode. Lower it when you know
  your images (`20_000_000` for 20 megapixels), and lower `concurrency`
  on a machine with little memory: about 150 to 200 MB per 12 to 18
  megapixel photo in progress, at most `limitInputPixels` x 4 bytes.
- **Decoders**: sharp picks the decoder from the bytes, not the
  extension: an SVG named `photo.jpg` is read as SVG. Every format the
  installed sharp reads is accepted (JPEG, PNG, WebP, GIF, TIFF, AVIF,
  HEIF, SVG); keep sharp up to date for its decoders' fixes.
- **SVG**: sources are read into memory first, so an SVG draws none of the
  files it references (`<image href="…">`); remote references, external
  entities and entity bombs are refused by librsvg and libxml2.
- **Broken files** fail (sharp's `failOn: 'warning'`): a truncated JPEG
  gives no half-decoded file.
- **File names** with control characters are escaped in logs and
  messages, so a name can't drive your terminal or forge a log line.
- **Sources are never written over**: a file that would replace its
  source (`x.jpg` to `x.jpg`, with an empty suffix) fails, unless
  `overwriteSource: true`. With a manifest, a source resized in place is
  recorded as written, so the next run skips it.

## Logging

The default logger is `@mmutils/logger` with the message and graph
plugins, on the command line on stderr. The level decides how much you
see:

| Level       | Logs                                                                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'error'`   | Failures: a source, a size or a file, with the error                                                                                                                                                                                                                         |
| `'warning'` | Sources and batches with failures, an unusable manifest, a plan that can't run the hooks                                                                                                                                                                                     |
| `'info'`    | The run: its sources, sizes, formats, output and concurrency when it starts; each source when it starts and when it ends; the manifest written; files, bytes, time and CPU at the end                                                                                        |
| `'debug'`   | The settings, resolved (sizes, each format's options, hooks, threads); each size, with its files, bytes and time; each hook's start and end; after the summary, files and bytes by format, the slowest source, peak memory, and graphs of a batch's CPU, memory and progress |
| `'verbose'` | Each file; what each size is resized from; whether a source is decoded first                                                                                                                                                                                                 |

`'info'` (the default) tells what a run did; `--silent`, or the level
`'error'`, leaves only the failures for a pipe or CI. Timestamps have
milliseconds, at a fixed width (`HH:mm:ss.SSS` on the command line): with
the debug lines around each hook and size, they tell where the time goes.

Paths in logs, messages and `--dry-run` use `/`, on Windows too: the
manifest's form, which every shell takes, the same on every system.
Results and `--json` keep the system's paths, for `path` and `fs`.

Pass a level, or your own logger: a `@mmutils/logger` `Logger` (with
`jsonPlugin` for JSON lines, for example) or any object with `error`,
`warning`, `info`, `debug` and `verbose` methods.

## Defaults

JPEG at quality 80 is the usual web baseline. Measured on three photos at
1280 pixels wide, SSIM against the uncompressed pixels
([bench/weight.js](bench/weight.js)):

| Format | Default                 | Bytes vs baseline JPEG | SSIM (baseline 0.9735) |
| ------ | ----------------------- | ---------------------- | ---------------------- |
| JPEG   | quality 80, progressive | 97%                    | 0.9735                 |
| WebP   | quality 80              | 73%                    | 0.9753                 |
| AVIF   | quality 63, effort 3    | 58%                    | 0.9727                 |
| PNG    | lossless, zlib level 9  | 1098%                  | 1                      |

mozjpeg was not smaller at the same SSIM and encodes about 5 times slower:
opt in with `{ jpg: { mozjpeg: true } }`.

AVIF's `effort` (0 to 9) trades build time for bytes. Effort 3 encodes
about 4 times faster than sharp's default, 4, which reaches the same SSIM
at quality 60 with 4 to 15% fewer bytes: a default run of the 17 example
images takes 30 s instead of 110 s, for 11% more AVIF bytes. Colors stay
at full resolution (`chromaSubsampling: '4:4:4'`): 4:2:0 saves about 5%
and blurs colored text and edges. Checked on 7 images from 320 to 2560 pixels wide, a collage and
a chart among them ([docs/audit-proposal.md](docs/audit-proposal.md) 5.1).
For the smallest files whatever the build time:
`formatOptions: { avif: { effort: 4, quality: 60 } }`, in code or in the
config file, or
`PICTURE_ASSETS_FORMAT_OPTIONS='{"avif":{"effort":4,"quality":60}}'`.

Every option is in `DEFAULT_FORMAT_OPTIONS` and can be changed per call or
with `formatOptions`. Options merge over the defaults one by one:
`--quality avif=55` keeps effort 3.

## Examples

Build first (`npm run build`), then run one with `node examples/<file>`, or
all with `npm run examples`. They use the photos in `examples/images` and
write to `examples/output`.

| File                                              | Shows                                               |
| ------------------------------------------------- | --------------------------------------------------- |
| [`quick-start.js`](examples/quick-start.js)       | One photo, 3 widths, AVIF, WebP and JPEG            |
| [`multipliers.js`](examples/multipliers.js)       | `x1`/`x2`/`x3` sizes and `resizeStrategyHint`       |
| [`art-direction.js`](examples/art-direction.js)   | Other aspect ratios, `position: 'attention'`, crops |
| [`hooks.js`](examples/hooks.js)                   | A grade, a hero crop, a watermark, AVIF quality     |
| [`hooks-pixels.js`](examples/hooks-pixels.js)     | Hooks on pixels: an upscaler, an alpha vignette     |
| [`picture.js`](examples/picture.js)               | A `<picture>` element, a recorded placeholder color |
| [`format-options.js`](examples/format-options.js) | Defaults, `formatOptions`, per call options         |
| [`batch.js`](examples/batch.js)                   | A directory tree, mirrored                          |
| [`errors.js`](examples/errors.js)                 | `abortScope`, results and errors                    |
| [`logging.js`](examples/logging.js)               | Log levels, graphs, JSON lines to a file            |
| [`generate.js`](examples/generate.js)             | `generateAssets`, a manifest, an incremental run    |
| [`abort.js`](examples/abort.js)                   | A run stopped by an `AbortSignal`, then finished    |
| [`cli.js`](examples/cli.js)                       | The command with a config file, `--dry-run`         |
| [`plan-simple.js`](examples/plan-simple.js)       | `planAssets` on a folder, the plan printed as is    |
| [`plan.js`](examples/plan.js)                     | The plan against the run, in 10 scenarios; a page   |

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
