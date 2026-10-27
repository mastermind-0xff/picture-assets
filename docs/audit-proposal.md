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

Measured on `main` after the audit (2b8e6f4), on a quiet machine, with
the scripts of `bench/output/audit`. Two workloads: the 13 example photos
(11 to 18 MP) with the defaults (`responsive` sizes, the `web` formats),
which is what a user's run looks like; and a tree of 10,000 small sources
(32x24 JPEGs in 100 directories, `sizes: [16]`, `formats: ['webp']`, a
manifest), where the image work is nothing and only the library's own
cost per source counts. Medians of 3 to 5 runs. The internal changes
(5.2 and 5.3) were prototyped on a throwaway branch, all 137 library and
command tests passing: the diff is `bench/output/audit/perf-proto.patch`,
not merged.

### 5.1 AVIF's effort: a default run is AVIF-bound (the author's call)

**What**: a default run of the 13 photos takes 88 s, and AVIF is most of
it: 1079 ms to encode one 1280 pixel photo, against 116 for WebP and 26
for JPEG (`bench/results/formats.txt`). libaom already uses every core,
so neither `concurrency` nor the thread pool helps (5.5).

**Why it is slow**: sharp's default `effort` for AVIF is 4 (0 to 9), and
from 3 to 4 libaom moves to a much slower search for a small gain. At the
same quality setting (q60), on the 3 photos of `bench/weight.js`:

| width | effort      | bytes vs 4 | SSIM   | encode ms | time vs 4 |
| ----- | ----------- | ---------- | ------ | --------- | --------- |
| 1280  | 2           | 102%       | 0.9692 | 213       | 15%       |
| 1280  | 3           | 100%       | 0.9703 | 336       | 23%       |
| 1280  | 4 (default) | 100%       | 0.9716 | 1446      | 100%      |
| 2560  | 2           | 105%       | 0.9709 | 722       | 17%       |
| 2560  | 3           | 102%       | 0.9716 | 1080      | 26%       |
| 2560  | 4 (default) | 100%       | 0.9725 | 4189      | 100%      |

At equal SSIM (the lowest quality reaching the default's), which is how
the defaults were chosen:

| width | effort      | quality | bytes vs default | SSIM   | time vs default |
| ----- | ----------- | ------- | ---------------- | ------ | --------------- |
| 1280  | 4 (default) | 60      | 100%             | 0.9716 | 100%            |
| 1280  | 3           | 63      | 109%             | 0.9727 | 23%             |
| 1280  | 2           | 63      | 110%             | 0.9718 | 14%             |
| 2560  | 4 (default) | 60      | 100%             | 0.9725 | 100%            |
| 2560  | 3           | 62      | 107%             | 0.9726 | 25%             |
| 2560  | 2           | 63      | 114%             | 0.9729 | 17%             |

**Gain**: the whole default run, 13 photos, pool 12, concurrency 4: 88 s
with today's AVIF, 23 s with `{ effort: 3, quality: 62 }`, 3.8 times
faster. AVIF stays far below WebP: 53% of JPEG's bytes today, about 57%
at effort 3 and equal SSIM, against WebP's 73%.

**Options**: (a) `avif: { quality: 62, effort: 3 }`: the same SSIM, 7 to
9% more AVIF bytes, runs about 4 times faster; (b) `effort: 3` at q60:
0 to 2% more bytes, 0.001 less SSIM; (c) keep the default, and document
`formatOptions: { avif: { effort: 3 } }` (or the variable) for fast
builds. `heif` shares the encoder: the same choice applies. Goes with it:
`bench/weight.js` and `bench/formats.js` rows for the new default, the
README's Defaults table, `DEFAULT_FORMAT_OPTIONS`' JSDoc. Suggested: (a),
after 3 more photos (a graphic, a portrait, a dark scene), since bytes
are what visitors download and build time is what developers wait for.

### 5.2 A no-change run redoes the run's work for every source

**What**: a run where every source is unchanged (`'skipped'`) should cost
a `stat` and an `access` per source. On 10k sources it takes 1437 ms, and
the profile puts `stat` and `access` at about a quarter of it. The rest
is the same work repeated for each source:

- `planTargets` creates each source's encoders: `createEncoders`
  resolves the options and builds a sharp object to check them
  (`sharp().toFormat(…)`), for every source, though they were checked
  once in `prepare` and are the same for every source whenever formats
  are given.
- `targetHash` serializes the run's settings, encoders, suffix, hint and
  hooks again for each source, though only the output path differs:
  45 µs per source, 103 µs with 3 hooks of 2 kB keyed by their code
  (each hook's code is stringified per source).
- `manifestPath` resolves the manifest's directory again on each call:
  twice per source and once per file.

**Change** (prototyped): encoders cached by format list in `planTargets`
(the options come from the run, so the list decides them); the hash
text built from each value's JSON, the run's values serialized once (the
same text as before, so the same hashes: checked on 9 cases with hooks,
a hint object and per-format options); the manifest's directory resolved
once. For the real change: keep the caches per run (a closure in
`generateAssets`) rather than module-level WeakMaps, so a caller
mutating a settings object between two runs in one process can't get a
stale hash.

**Gain**: 1437 to 1234 ms on the no-change run (-14%); `targetHash` 45 to
13 µs per source, 103 to 27 µs with 3 hooks. The first run saves the same
200 ms, under 1% of its time.

**Risk**: low: same results, hashes and messages. Specs to add: a hash
snapshot (so a later change of the hash shows), encoders created once per
format list (a spy on `createEncoders`).

### 5.3 The plan handles one source at a time

**What**: `planAssets` (`--dry-run`) awaits each source in turn: its
`stat`, its manifest check, then `readFile` and `metadata()` for its
header. On 10k sources: 2628 ms with a manifest (slower than a run, which
is concurrent), 6374 ms without.

**Change** (prototyped): the batch's worker pool, `computeConcurrency` of
the config's `concurrency`, each result stored at its index so the order
is unchanged.

**Gain**: 2628 to 1118 ms with a manifest (-57%, with 5.2), 6374 to
2337 ms without (-63%), 1937 ms with the command's pool of 12.

**Risk**: low. The plan reads each source whole for its header, so its
memory is the concurrency times the largest file, as in a run. Reading
only the header would need sharp's path input, which on Windows keeps
files open in libvips' cache and, for an SVG, loads the files it
references (3.1): keep the buffer.

### 5.4 Smaller, measured, not worth a change now

- **Clones**: 0.15 per source (2 of the 13 photos, those resized from
  their file), 9 to 17 ms in all.
- **Source discovery**: `findSources` on 10k files: 430 ms, 200 of them
  `fs.glob`; `isInputFile` 1.4 ms per 10k names.
- **Paths per source**, after 5.2: `parsePath` twice per source in
  `resolvePathsAndFormats` (146 ms per 10k): could be cached per output
  directory, for 10% of a no-change run.
- **The first run of 10k small sources**: 28 s, 2.8 ms per source, most
  of it sharp's: about 0.18 ms of the main thread per pipeline call (3 per
  source, and the metadata). Not the library's to save.
- **Logging**: `info` against `error` on the 10k first run: no measurable
  difference; descriptions of values are built only for errors;
  `displayPath`'s escaping adds 0.6 µs per call.
- **Validation**: once per call, but the encoders (5.2).

### 5.5 Concurrency and memory (data, no change proposed)

The command sizes libuv's pool to the cores (12 here), so `'auto'` is 12
sources at once. That pays for WebP and JPEG (`bench/concurrency.js`,
WebP only: 885 ms against 1.34 s at 4); for AVIF it doesn't, as libaom
already uses every core, and it costs memory:

| formats            | concurrency, pool      | time   | peak RSS |
| ------------------ | ---------------------- | ------ | -------- |
| web, AVIF effort 4 | 4, pool 12             | 88 s   | 1.37 GB  |
| web, AVIF effort 4 | 12 (`'auto'`), pool 12 | 108 s  | 2.48 GB  |
| web, AVIF effort 3 | 4, pool 12             | 22.9 s | 1.43 GB  |
| web, AVIF effort 3 | 12 (`'auto'`), pool 12 | 23.2 s | 1.81 GB  |
| web, AVIF effort 3 | 4 (`'auto'`), pool 4   | 24.4 s | 1.09 GB  |

The 108 s run was under load. About 150 to 200 MB per photo in progress.
A format-dependent `'auto'` would be a hidden, kind-dependent default
(the one-default rule): suggested, keep `'auto'`, and say in the
`concurrency` docs what each source in progress costs in memory.
