# image-assets-generator

Turns source images into web-ready assets: every resolution (pixels or
`x2`-style multipliers) and format you need, from one image or a whole
directory tree, with defaults tuned for quality per byte. Built on
[sharp](https://sharp.pixelplumbing.com/), logs with
[@mmutils/logger](https://www.npmjs.com/package/@mmutils/logger).

```ts
import { imageResize } from 'image-assets-generator';

await imageResize(
  'photos/house.jpg',
  'public/img/', // a directory: files named after the source
  [{ width: 1920 }, { width: 1280 }, { width: 640 }],
  ['avif', 'webp', 'jpg']
);
// public/img/house@1920w.avif, house@1920w.webp, house@1920w.jpg, … @640w
```

- **Few settings**: sizes and formats, the rest has defaults.
- **Web-tuned encoders**: AVIF at 53% and WebP at 73% of JPEG's bytes for
  the same SSIM, progressive JPEG (see [Defaults](#defaults)).
- **Correct on real photos**: EXIF orientation applied, transparent images
  flattened on white for JPEG, color profiles converted to sRGB, metadata
  stripped.
- **Fast**: the source is read once, each size resized from the previous
  one, formats encoded in parallel, batches processed several sources at a
  time. It takes 45% of the time of one sharp call per file, and 75% of
  the time of resizing each size once with sharp (see
  [bench/](bench/README.md)).
- **Directory trees**: a directory, a glob or a single file; the tree is
  mirrored in the destination, outputs never overwrite each other.
- **Predictable failures**: invalid arguments throw before any work, with
  messages naming the field; processing failures are in the result, or
  stop the run, as you choose.
- **ESM and CommonJS**, typed.

## Install

```sh
npm install image-assets-generator
```

Requires Node.js 22.17 or newer.

## Single image: `imageResize`

```ts
imageResize(srcPath, destPath, settings, formats?, options?): Promise<ResultSource>
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
| `width`, `height`          | Pixels, or a multiplier: `'x1'`, `'x2'`, `'x1.5'` (see `resizeStrategyHint`)             |
| `suffix`                   | File name suffix, default `'@{w}w'`. Wildcards: `{w}` `{h}` `{sm}` `{wm}` `{hm}`         |
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

### Options

Every option falls back to its environment variable, then to its default.
Invalid values throw, naming the option or the variable.

| Option               | Default        | Variable                              | Meaning                                                                                                                                                                 |
| -------------------- | -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resizeStrategyHint` | `'downsample'` | `IMAGE_RESIZE_RESIZE_STRATEGY_HINT`   | What `x1` is: `'downsample'` (the source is the largest multiplier, or the smallest pixel size is `x1`), `'upsample'` (the source is `x1`), `'x2'`, `{ width, height }` |
| `suffix`             | `'@{w}w'`      | `IMAGE_RESIZE_SUFFIX`                 | Suffix of settings without their own                                                                                                                                    |
| `formatOptions`      | `{}`           | `IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS` | Options per format for every call, as JSON in the variable                                                                                                              |
| `abortScope`         | `'none'`       | `IMAGE_RESIZE_ABORT_SCOPE`            | What a failure stops, see [Failures](#failures)                                                                                                                         |
| `logger`             | `'info'`       | `IMAGE_RESIZE_LOG_LEVEL`              | A log level for the default logger, or a logger, see [Logging](#logging)                                                                                                |

Load the variables from a file with `node --env-file=.env` (see
[`.env.example`](.env.example)).

## Many images: `batchImageResize`

```ts
batchImageResize(srcPath, destRoot, settings, formats?, options?): Promise<ResultBatch>
```

`srcPath` is a directory (every image below it), a glob
(`'photos/**/*.{jpg,png}'`), a file, or `{ root, pattern }`. The tree below
the root (the directory, or the glob's part before its first wildcard) is
mirrored in `destRoot`. Files sharp can't read are skipped; outputs inside
the source tree are never picked up again. Two sources that would write the
same files (`a.jpg` and `a.png`) fail instead of overwriting each other.

`options` are `imageResize`'s, plus `concurrency`: sources processed at the
same time. `'auto'` (default) is the libuv thread pool size
(`UV_THREADPOOL_SIZE`, 4 by default), on which sharp runs; `'max'` the
machine's parallelism; or a number.

The pool is the batch's bottleneck: set `UV_THREADPOOL_SIZE` to the number
of cores before the process starts (`UV_THREADPOOL_SIZE=12 node build.js`).
On a 12 thread laptop, it cut a 10 photo batch from 1.38s to 904ms.

## Results

Both functions resolve with a tree of results: batch → sources → settings
→ files, each with a `status`.

| Status      | Meaning                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `'succeed'` | Everything below was written                                                      |
| `'failed'`  | Something below failed: see the `error` of the source, setting or file            |
| `'aborted'` | Stopped before it was done, because another source failed (`abortScope: 'batch'`) |

Written files have `fileData`: sharp's output info, with `size` in bytes,
`width` and `height`. A batch lists every source found, in path order, and
both levels have a `duration` in milliseconds.
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

mozjpeg was not smaller at the same SSIM and encodes about 6 times slower: opt in
with `{ jpg: { mozjpeg: true } }`. Every option is in
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
| [`picture.js`](examples/picture.js)               | A `<picture>` element from the result               |
| [`format-options.js`](examples/format-options.js) | Defaults, `formatOptions`, per call options         |
| [`batch.js`](examples/batch.js)                   | A directory tree, mirrored                          |
| [`errors.js`](examples/errors.js)                 | `abortScope`, results and errors                    |
| [`logging.js`](examples/logging.js)               | Log levels, graphs, JSON lines to a file            |

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

What comes next, a CLI and presets: [docs/cli-proposal.md](docs/cli-proposal.md).
