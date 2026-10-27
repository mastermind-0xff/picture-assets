# Proposal: a CLI-ready 1.0

Status: sections 1 to 4 are implemented (`generateAssets`, `planAssets`,
presets, the manifest and the `picture-assets` command; see the README).
Section 5 lists what the author decided, rejected, left open and dropped.
Where the implementation differs from the plan below, a note says why.

The goal: one tool for code and for the command line, with very few
settings and a great result every time. The revamp laid the groundwork a
CLI needs. Every argument is validated at runtime, with messages that name
the field. Options are resolved per call from the call, then the
environment, then the defaults. Failures are predictable (`abortScope`).
Results are complete and serializable, and the logger can be replaced.
What is missing is mostly a layer above `generateSingleSourceAssets` and
`generateBatchAssets`, plus a few decisions best taken before 1.0.

## 1. One entry point, one config shape

A single function whose argument is plain JSON, so code, a config file and
CLI flags all describe the same thing:

```ts
import { generateAssets } from 'picture-assets';

const result = await generateAssets({
  input: 'src/images', // file, directory, glob, or a list of them
  output: 'public/img/',
  // everything below is optional
  sizes: 'responsive', // preset, widths [1920, 1280, 640], or OutputSetting[]
  formats: 'web', // preset, list, or { format: options }
  suffix: '@{w}w',
  formatOptions: { avif: { quality: 55 } },
  abortScope: 'none',
  concurrency: 'auto',
  manifest: 'public/img/assets.json',
  incremental: true,
});
```

_Implemented without `incremental`:_ a `manifest` alone makes runs
incremental, and `force: true` processes everything; one key less, and no
incremental run without the file it needs.

- `generateAssets` is a batch: a single file is a batch of one, so there
  is one result shape (`ResultBatch`).
- `generateSingleSourceAssets` and `generateBatchAssets` stay, as the
  low-level API.
- **Shorthands** keep configs short: `sizes: [1920, 1280, 640]` means
  widths, `sizes: ['x1', 'x2', 'x3']` multipliers. _Changed 2026-10-27
  (the author):_ they no longer bring `@1x`-style suffixes, which
  overrode the run's `suffix` without saying so; like any size without
  its own suffix, they take the run's, one default for every size
  (`'@{w}w'`, or `PICTURE_ASSETS_SUFFIX`).

## 2. Presets: good results without knowing the encoders

| Preset                | Expands to                                                                   |
| --------------------- | ---------------------------------------------------------------------------- |
| `sizes: 'responsive'` | widths 2560, 1920, 1280, 960, 640, 320: those larger than the source skipped |
| `sizes: 'retina'`     | `x3`, `x2`, `x1` with `@3x`, `@2x`, `@1x` suffixes                           |
| `formats: 'web'`      | `avif`, `webp`, and a fallback: `jpg`, or `png` for transparent sources      |
| `formats: 'modern'`   | `avif`, `webp`                                                               |
| `formats: 'lossless'` | `webp` lossless, `png`                                                       |

Two behaviors the presets need, useful on their own:

- **Fallback format per source.** A `'fallback'` pseudo-format resolved
  per source from `metadata().hasAlpha`: today a transparent PNG asked for
  `jpg` is flattened on white, which is right for an explicit `jpg`, wrong
  for "the best legacy format".
- **No upscaling for presets.** Pixel sizes larger than the source are
  upscaled today (from the source, never from a smaller copy). Upscaled
  web assets only cost bytes: presets skip them and log it. An `upscale`
  option (default `false` for presets, `true` for explicit settings, as
  today) makes it explicit.

## 3. Incremental builds and a manifest

A CLI runs in build pipelines and watch modes, where most sources haven't
changed since the last run.

- **Manifest**: a JSON file with every source and its outputs (file,
  format, width, height, bytes), what `examples/picture.js` builds from a
  result. Frameworks and templates read it to write `<picture>` and
  `srcset`.
- **Incremental**: the manifest also stores, per source, its size and
  modification time and a hash of its settings and options. A source whose
  entry matches and whose outputs exist is skipped: `'skipped'` in the
  result, a new status. `--force` ignores the manifest.

## 4. The CLI

Built on `node:util` `parseArgs`: no dependency.

```text
picture-assets <input...> --output <dir> [options]

  -o, --output <dir>          Destination directory (required)
  -s, --sizes <sizes>         1920,1280,640 | x1,x2,x3 | responsive | retina   [responsive]
  -f, --formats <formats>     avif,webp,jpg | web | modern | lossless          [web]
  -q, --quality <f=q,...>     avif=55,webp=75: format options' quality
      --suffix <pattern>      {w} {h} {x} {wx} {hx}                           [@{w}w]
      --strategy <hint>       downsample | upsample | x2 | 1024x768            [downsample]
      --on-error <scope>      none | source | batch                            [none]
  -j, --concurrency <n>       auto | max | a number                            [auto]
  -c, --config <file>         picture-assets.config.json or .js                [found in cwd]
      --manifest <file>       Write the manifest; enables incremental runs
      --force                 Process every source, even unchanged ones
      --dry-run               Print the plan (sources, sizes, files) and exit
      --json                  Print the result as JSON on stdout
  -v, --verbose / --silent    Log level: debug / silent                        [info]
  -h, --help, --version
```

- **Layers**: defaults, then environment variables, then the config file,
  then flags. The config file and the flags are explicit, like a call's
  options, so they win over the environment, as in the library.
- **Streams**: logs go to stderr (the message plugin's `write`), so stdout
  carries only `--json` output and can be piped.
- **Exit codes**: 0 everything succeeded (or was skipped), 1 some sources
  failed, 2 invalid arguments or config (the validators' `TypeError` and
  `RangeError`), 130 interrupted.
- **Interrupts**: Ctrl+C aborts the run through the same signal as
  `abortScope: 'batch'`: the work in progress finishes, so no half-written
  file is left behind, then the partial result is printed.
- **Thread pool**: sharp runs on libuv's pool, 4 threads by default, which
  `concurrency: 'auto'` follows. On a 12 thread laptop, a pool of 12 cut a
  10 photo batch from 1.32s to 885ms (bench/README.md).

  _Implemented differently:_ the plan was to set
  `process.env.UV_THREADPOOL_SIZE` on the bin's first line. Measured, it
  has no effect: libuv sizes its pool when the process starts (12 parallel
  `pbkdf2` jobs took as long as with 4 threads, whether set from an ES
  module, a CommonJS file's first line or before a dynamic `import()`).
  Without the variable, the command runs itself again once with it set:
  one more Node start-up, for a third less time per batch. A size set by
  the user is kept, and Ctrl+C reaches both processes.

- **Dry run** prints the resolved sizes per source (pixels from
  multipliers) and the files, without writing: settings with multipliers
  are hard to predict otherwise.

Implementation sketch:

```text
src/cli/
  main.ts      bin entry: thread pool, parseArgs, run, exit code
  args.ts      flags → config (pure, tested without processes)
  config.ts    find, load (JSON, or .js through import()), validate
  presets.ts   sizes and formats presets, shorthands
  manifest.ts  read, compare, write
```

`package.json` gets `"bin": { "picture-assets": "./dist/esm/cli/main.js" }`.

_Implemented as:_ `src/cli.ts` (the bin, `dist/esm/cli.js`: thread pool,
signals, process streams), `src/cli/run.ts` (`runCli`, which takes its
streams as arguments, so the whole command is tested in-process),
`src/cli/args.ts`, `src/cli/config.ts`, `src/config/presets.ts` (presets
are a library feature), `src/lib/generate-assets.ts` and
`src/lib/manifest.ts`.

## 5. API decisions to take before 1.0

Breaking changes, cheapest now, while nothing is published.

**Decided** (and done):

1. **Package**: `picture-assets`, unscoped (`image-assets-generator` is
   taken on npm), the name planned on npm and GitHub, and the command of
   the same name, so `npx picture-assets` runs it without installing. MIT
   license.
2. **Functions**: `generateAssets`, `planAssets`,
   `generateSingleSourceAssets` (was `imageResize`) and
   `generateBatchAssets` (was `batchImageResize`): typing `generate` lists
   them all. They may change again: `generateAssets` and
   `generateBatchAssets` read alike, though one takes a config and the
   other positional arguments, so the choice between them isn't obvious.
3. **Environment variables**: `PICTURE_ASSETS_` and the option's name,
   e.g. `PICTURE_ASSETS_FORMAT_OPTIONS`, and `PICTURE_ASSETS_CONCURRENCY`
   for the machine's concurrency. The prefix is the package's name in
   full: short prefixes collide (PortAudio reads `PA_*`), and the name
   tells whoever reads a CI config what the variable belongs to.
4. **Suffix wildcards**: `{x}`, `{wx}` and `{hx}` (were `{sm}`, `{wm}` and
   `{hm}`); unknown wildcards throw.

**Rejected**:

- **`resizeFrom: 'previous' | 'source'`** instead of `generateFromSource`
  and `useAsNextResizeIteration`. They are independent: one tells where
  this size is resized from, the other whether the next sizes are resized
  from this one. One size from the source and the others chained from it
  needs both, and they never contradict each other.
- **`sourceMultiplier`** with `'largest'` instead of `resizeStrategyHint`.
  The hint infers the source's multiplier from the sizes, which
  `'largest'` misnames: for a 300x300 source and the sizes 150, `x2` and
  `x3`, 150 is `x1`, so the source is `x2` and `x3` is 450 pixels wide
  (resized from the source).

**Open**: statuses `'succeeded'`, `'failed'`, `'aborted'`, `'skipped'`;
`outputsBySetting` → `sizes`; `fileData` → `info`.

**Dropped for now**: animated images. GIF and WebP sources are read as
their first frame. sharp resizes and crops animations frame by frame, but
AVIF, PNG and JPEG would get every frame stacked into one tall image, the
raw buffers between sizes lose the frames' timing, and rotation throws on
animations: a feature of its own, not a priority.

## 6. Order of work

1. Presets and shorthands (`presets.ts`), with the fallback format and
   `upscale`: they are library features too.
2. `generateAssets` over `generateBatchAssets`, accepting a list of inputs.
3. The CLI: args, config file, exit codes, `--json`, `--dry-run`.
4. Manifest and incremental runs.
5. The open renames of section 5, in one breaking release before 1.0.
