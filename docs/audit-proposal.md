# Security and performance audit: findings and decisions

Written 2026-10-27, branch `audit` (from `main` at e197c72), as the history
of the audit, like `docs/cli-proposal.md` and `docs/hooks-proposal.md`.
The author asked for the review, the fixes of clear bugs, and a list of
what needs their decision; then the performance checks. Probe scripts are
in the git-ignored `bench/output/audit`. Measured on the 12 thread
Windows laptop of `bench/README.md` (16 GB of RAM), Node 22.22, sharp
0.35.5 (libvips 8.18.7).

Sections: the threat model, what was fixed, what was checked and found
sound, what needs the author's decision, performance.

## 1. Threat model (the author's decisions build on it)

- **Trusted**: the config (code, a JSON or JS config file), the flags,
  `--hooks` files and `.js` configs (they run code by design, as an ESLint
  config does), the environment.
- **Untrusted**: source images, and their file names (a folder of uploads
  in a CMS build).
- **Not hostile, maybe stale or edited by hand**: the manifest, the output
  directory.

## 2. Fixed (one commit each, `npm run check` green)

1. **Sizes above 268 megapixels failed** (5971530). sharp applies its
   `limitInputPixels` to raw input too, and every size reaches its
   encoders as raw pixels: a 9000x9000 source at `{ width: 17000 }` was
   resized, then each file failed with "Input image exceeds pixel limit".
   `fromRaw` turns the limit off (the pixels are in memory already);
   sources keep sharp's default.
2. **`.v` and `.vips` files were sources** (c70b956), always failed:
   sharp reads libvips' own format from files only, and sources are read
   into a buffer. `INPUT_EXTENSIONS` lists the formats sharp reads from a
   buffer.
3. **`..` after a glob's first wildcard wrote outside the output**
   (e3e0bb9): `picture-assets 'src/*/../../shared/*.jpg' -o out` wrote
   `shared/two@320w.webp`, next to the source (with an empty suffix and
   the source's format, over it). Such sources fail, naming the `..`.
4. **The output directory named in another case** (54dbb5e): on Windows
   and macOS, `{ input: 'src2', output: 'SRC2/out' }` found the previous
   run's outputs as sources, each run nesting a suffix
   (`photo@32w@32w.jpg` on the third run).
5. **`generateBatchAssets`' `signal` was unchecked** (1bf883a): `'stop'`
   failed with "signal?.addEventListener is not a function" after the
   search; `{ aborted: true }` aborted every source, then failed.
   `parseSignal` for both entry points; `generateAssets` checks every
   option before searching the sources.
6. **Control characters in file names** (195ac6b) went to the terminal
   as they were: `\x1b]0;…\x07.jpg` (valid on Linux) sets its title, `\n`
   forges a log line. `displayPath` escapes C0, DEL and C1 as JSON does.
7. **SVG references and truncated files, spec'd** (36bf099): see 3.1 and
   3.3.
8. **`--inspect` debugged an idle process** (67831f6): the command ran
   itself again for its thread pool, `execArgv` included, and the child
   failed to open the same port. Under a debugger it runs in place.

## 3. Checked and sound

1. **SVG** (librsvg 2.63, libxml2 2.15). From its path, an SVG draws the
   files it references below its directory (`<image href="red.png">`, a
   `file:///` URL); from a buffer, none. Sources are read into a buffer
   (for Windows' sake), so none is drawn: spec'd, and commented at the
   read. `http://` references, XInclude and external entities: never
   loaded. Entity bombs: refused ("Maximum entity amplification factor
   exceeded"). A 1000000x1000000 SVG: refused by the pixel limit.
2. **The loader is chosen by the bytes, not the extension**: an SVG named
   `photo.jpg` is read as SVG. An allow-list by extension wouldn't limit
   the decoders a source reaches (see 4.2).
3. **Truncated sources fail** (sharp's `failOn: 'warning'`): a JPEG or
   PNG cut in half gives no file. Under concurrency, libvips' error
   buffer is shared: a PNG's message can carry another source's JPEG
   error. sharp's, harmless.
4. **Symlinks**: `fs.glob` doesn't follow a directory junction looping to
   its parent (each file found once, 4 ms). Symlinked files are read where
   they point (couldn't be made here: no developer mode); the input tree
   is the caller's.
5. **Code loading**: a `.json` config is parsed, never imported; `.js`,
   `.mjs` and extensionless configs are imported (trusted, the user names
   them). Errors name the path loaded.
6. **The re-spawn**: no shell; arguments with spaces and quotes reach the
   child intact (`'a b.jpg'`, `"it's.jpg"`).
7. **The manifest**: its output paths are only `fs.access`ed (a tampered
   one can make a source skipped, or reveal whether a file exists, to its
   editor); nothing is read or deleted through it. A source named
   `__proto__` in the manifest's directory would be dropped from it
   (`entries['__proto__'] = …` sets the prototype): left as is.
8. **The package**: `npm audit` finds 0 vulnerabilities; `npm pack`
   ships `dist` (js, cjs, maps with `sourcesContent`, types), README,
   LICENSE, CHANGELOG: no spec, fixture, `.env` or `src/test-utils`. The
   bin has its shebang.

## 4. For the author to decide

Decided by the author on 2026-10-27, built on `audit` the same day, one
commit each:

- **4.1** `limitInputPixels`, sharp's default (2f12dbb): an option and
  `PICTURE_ASSETS_LIMIT_INPUT_PIXELS`, `false` for none; checked on the
  header before any decode, so a larger source fails once with its size
  and the option's name (4 bombs: 28 ms and 52 MB at a 100 MP limit,
  against 19 s and 4.5 GB). README: a new Untrusted sources section.
- **4.2** Left to sharp; the README says which decoders are reached.
- **4.3** A missing input fails as a source, nothing throws (1a14a21): a
  warning ("Not found: tow.jpg. A misspelled name?"), the batch goes on as
  `abortScope` says, exit 1; not in the manifest, so the next run makes
  only the corrected one. A glob that matches nothing, among several
  inputs, is a warning.
- **4.4** `overwriteSource`, `false` by default (75f7f5e): such a file
  fails, the size's other formats are written. `true` resizes in place,
  and the manifest records the source as written, so the next run skips
  it.
- **4.5** Ignored.
- **4.6** `recordLimit`, optional, 64 kB by default (52b0619): bytes of
  JSON per `record`, `false` for none; a larger value fails the hook,
  naming the key. 64 kB holds real data (an embedding of 1024 numbers is
  about 20 kB); an image recorded by mistake is megabytes, and a manifest
  over 512 MB can't be written or read back.

The items as proposed:

1. **Decompression bombs and memory.** sharp's default pixel limit,
   268 MP (16383x16383), is the only bound. A 1 MB PNG decodes to 1 GB:
   one source took 5.6 s and 1.18 GB of RSS; four at once (`'auto'`, pool 4) 19 s and 4.5 GB. The command sizes the pool to the cores, so
   `'auto'` is 12 here: about 13 GB, more than the machine had free (5.8
   GB), not run. The same pixels as JPEG: 108 MB (shrink-on-load to 2560;
   decoded whole when the largest size is within 3x of the source).
   Source bytes are unbounded too (read whole, up to Node's 2 GB).
   Options: (a) a `limitInputPixels` option (sharp's default, or lower:
   phones make 200 MP photos); (b) a memory budget for the sources in
   flight, in pixels, beside `concurrency`; (c) document it. Suggested:
   (a) with sharp's default, plus a README section on untrusted sources.
2. **Decoders reached by untrusted bytes**: JPEG, PNG, WebP, GIF, TIFF,
   HEIF/AVIF and SVG (librsvg, libxml2), whatever the extension. Options:
   an `inputFormats` allow-list checked against `metadata().format` (the
   header only), SVG and TIFF opt-in or not; or leave it to sharp.
3. **A missing input is ignored**: `picture-assets two.jpg tow.jpg -o out`
   processes `two.jpg` and exits 0. A path without wildcards that doesn't
   exist could fail as a source (exit 1), or throw before any work.
4. **An output can overwrite its source**:
   `generateSingleSourceAssets('x.jpg', 'x.jpg', [{ width: 16, suffix: '' }])`
   replaced the source with its 16 pixel copy (sharp refuses it for a
   path input, not for a buffer). Refuse such a file (failed), or allow it
   for in-place use?
5. **Misspelled environment variables** (`PICTURE_ASSETS_SUFIX`) are
   ignored. Unknown `PICTURE_ASSETS_*` variables could throw, as unknown
   options do, or warn; a variable of a newer version would then fail an
   older one.
6. **Hook data is unbounded**: a hook recording megabytes per file makes
   a manifest that size. A limit, or docs?

## 5. Performance (branch `perf`, measured, nothing changed yet)

Two workloads: a tree of 10,000 small sources (32x24 JPEGs in 100
directories; `sizes: [16]`, `formats: ['webp']`, a manifest), where only
the per-source overhead counts; and the 13 example photos (11 to 18 MP)
with the defaults (`responsive`, `web`).

1. **Clones**: 0.15 per source (2 of the 13 photos, those resized from
   their file), 9 to 17 ms in all: nothing to gain.
2. **Memory per source in flight** (the 13 photos): peak RSS 569 MB at
   concurrency 1, 1.18 GB at 4, 2.48 GB at 12 (the command's `'auto'`
   here); pool 12 at concurrency 4: 1.44 GB. About 150 to 200 MB per
   photo in flight. Bombs: 4.1.
3. **A default run is AVIF-bound**: the 13 photos took 130 s at
   concurrency 1, 111 s at 4, 108 s at 12 (pool 12). Concurrency barely
   helps: AVIF is most of the encode time (`bench/results/formats.txt`:
   756 ms at 1280 against 116 for WebP and 26 for JPEG), and libaom uses
   every core already. What its `effort` buys (quality 60, the 3 photos
   of `bench/weight.js`, best of 2):

   | width | effort      | bytes vs 4 | SSIM   | encode ms | time vs 4 |
   | ----- | ----------- | ---------- | ------ | --------- | --------- |
   | 1280  | 2           | 102%       | 0.9692 | 213       | 15%       |
   | 1280  | 3           | 100%       | 0.9703 | 336       | 23%       |
   | 1280  | 4 (default) | 100%       | 0.9716 | 1446      | 100%      |
   | 2560  | 2           | 105%       | 0.9709 | 722       | 17%       |
   | 2560  | 3           | 102%       | 0.9716 | 1080      | 26%       |
   | 2560  | 4 (default) | 100%       | 0.9725 | 4189      | 100%      |

   Effort 3 encodes 4 times faster for 0 to 2% more bytes and 0.001 less
   SSIM. The author's call (defaults are set from `bench/weight.js`):
   `avif: { quality: 60, effort: 3 }`, measured at equal SSIM first.

4. **Manifest runs (10k sources)**: a first run takes 28 to 31 s, 2.8 to
   3.1 ms per small source, most of it sharp's own: 0.18 ms of the main
   thread per pipeline call (3 per source, and the metadata); logging at
   `info` costs nothing measurable (27.9 s against 28.9 s at `error`). A
   no-change run takes 2.25 s, and it is not stat-bound: `stat` and
   `access` are 0.3 s of a 2.8 s profile. The rest:
   - `planTargets` 586 ms: each source's encoders are created and checked
     with a new sharp object (200 ms), though they are the same for every
     source when formats are given; `parsePath` twice per source.
   - `targetHash` 374 ms: the run's settings, encoders and options are
     serialized again for each source, 45 µs; with 3 hooks of 2 kB keyed
     by their code, 103 µs (their code is stringified per source).
   - `manifestPath` 292 ms: the manifest's directory is resolved again per
     call, twice per source and once per file.
     Proposed, with the same results and the same hashes: encoders once
     per format set, the hash's run-level part serialized once, the
     manifest's directory resolved once. Expected: about 1.3 s.
5. **The plan is sequential**: `planAssets` on 10k sources takes 4.1 s
   with a manifest (slower than the no-change run, which is concurrent)
   and 10.2 s without (each file is read whole for its header). Proposed:
   the batch's concurrency.
6. **Source discovery**: `findSources` on 10k files takes 430 ms, 200 of
   them `fs.glob`; `isInputFile`'s loop is 1.4 ms per 10k names. Nothing to
   gain.
7. **Validation and messages**: checked once per call, but the encoders
   (4); descriptions of values are built only for errors.
   `displayPath`'s escaping (2.6) adds 0.6 µs per call.
