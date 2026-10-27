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

## 1. Threat model (proposed, to confirm)

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
