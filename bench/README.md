# Benchmarks

Measured with [@mmutils/bench](https://www.npmjs.com/package/@mmutils/bench):
every sample runs in a fresh worker thread, with CPU probes, and compared
cases are drawn side by side with
[@mmutils/logger](https://www.npmjs.com/package/@mmutils/logger). The
benchmarks measure the library's build, what is published, on the photos in
`examples/images`.

```sh
npm run build              # the benchmarks import dist/esm
node bench/pipeline.js     # or any file below; --quick for a smoke test
npm run bench              # build, then pipeline.js
```

Each case is measured on 4 samples, fresh workers, with at least 20 runs
in all: exactly 20 for the image work, which takes from hundreds of
milliseconds to seconds per run, and as many as 4 seconds allow for the
encoders (21 to 378). Every summary table has a `runs` column. `--quick`
runs 2 runs on 2 samples per case: it checks that a benchmark works, it
doesn't measure. Outputs go to `bench/output` (git-ignored). Keep the
machine quiet: mm-bench warns when other processes use 10% of the CPU or
more during a case.

| File                               | Question                                                             |
| ---------------------------------- | -------------------------------------------------------------------- |
| [`pipeline.js`](pipeline.js)       | Is the library faster than plain sharp for the same files?           |
| [`chain.js`](chain.js)             | Chaining sizes or resizing each from the source: speed, and quality? |
| [`concurrency.js`](concurrency.js) | How many sources should a batch process at once?                     |
| [`formats.js`](formats.js)         | What does each encoder cost?                                         |
| [`weight.js`](weight.js)           | What does each format and quality give for its bytes? (not timed)    |
| [`hooks.js`](hooks.js)             | What does a hook cost at each point?                                 |

## Results

From `results/*.txt`, on an Intel i7-9750H laptop (6 cores, 12 threads),
Windows 11, Node 22.22, sharp 0.35.5 (libvips 8.18). Your numbers will
differ; the ratios are what to look at. `pipeline.txt`, `chain.txt` and
`hooks.txt` were recorded after sources were decoded first (see below),
with 12 to 20% of the CPU used by other processes (mm-bench warns): take
their small differences as noise.

**pipeline.js**: one 3901x2926 photo to 2048, 1024 and 512 pixels wide,
WebP and JPEG, the same encoder options everywhere.

| Case                                                   | Mean  | vs generateSingleSourceAssets |
| ------------------------------------------------------ | ----- | ----------------------------- |
| `generateSingleSourceAssets`                           | 582ms |                               |
| sharp, each size resized once, formats in parallel     | 1.04s | 78.6% slower                  |
| sharp, one call per file (decode and resize each time) | 1.71s | 2.94× slower                  |

**Sources decoded first.** Resizing straight from a JPEG with an ICC
profile (most photos have one) costs more than decoding it, then resizing
the pixels: 334ms against 15 + 138ms from house-01 to 2048 pixels, 1.1s
against 0.5s from a 40 megapixel photo to 3890. Shrink-on-load only helps
from a shrink of 3 and up. So a JPEG whose largest size is shrunk less
than 3 times, and a PNG, AVIF, GIF or TIFF, is decoded once and its sizes
resized from its pixels; a WebP's scaled decode beats that at any size.
The library before and after, on a quiet machine:

| Case                                   | Before | After           |
| -------------------------------------- | ------ | --------------- |
| pipeline.js's photo, sizes and formats | 728ms  | 537ms, 26% less |
| chain.js's 6 widths, chained           | 1.29s  | 1.11s, 14% less |
| the photo as a PNG, 3 widths, WebP     | 714ms  | 513ms, 28% less |
| a batch: `group-2`, `responsive`, WebP | 3.15s  | 2.79s, 11% less |

The decoded source is kept for the source's run: peak memory 179MB instead
of 160MB for one photo, 788MB instead of 711MB for the 5 photos of
`group-2` (12 to 40 megapixels) at once. A size resized from pixels gets a
new sharp object over them: `clone()` would copy them (217MB and 998MB).
Since, each format of a size gets a new sharp object over its pixels too,
instead of a copy: the batch's peak is 704MB, below the 711MB of before.

**chain.js**: the photo to 6 srcset widths (2560 to 320) in WebP.

| Case                             | Mean  |             |
| -------------------------------- | ----- | ----------- |
| chained: each size from the last | 1.34s |             |
| every size from the source       | 1.41s | 5.8% slower |

Quality, on 3 photos: SSIM of each size against one resize from the
photo's full resolution pixels (1 is identical). The lowest of each:

| Photo               | Chained | From the source |
| ------------------- | ------- | --------------- |
| house-01, 3901x2926 | 0.9976  | 1               |
| house-10, 7781x5190 | 0.9959  | 0.9683 (640w)   |
| house-03, 3024x4032 | 0.9982  | 1               |

house-01 (to 2560) and house-03 (to 1600) are decoded first: every size
from the source is then exactly the reference, nearly as fast as
chaining. house-10 (to 1920, a shrink of 4) is not: from the source,
sharp's JPEG shrink-on-load decodes its small sizes approximately, and
before sources were decoded first house-01 dipped to 0.9563 at 320w too,
for 59% more time than chaining. This
benchmark also found a bug in the chain: each size was resized with
sharp's default `fit: 'cover'`, which crops the fraction of a pixel by
which a rounded size misses the aspect ratio, and the crops added up to a
shift of up to a pixel: down to 0.905 at 320w on house-10. Sizes with the
source's aspect ratio are now scaled to fill, which fixed it.

**concurrency.js**: the 10 photos of `examples/images/group-*` (12 to 40
megapixels) to 1024 and 512 pixels wide in WebP.

| Concurrency                 | Mean, pool of 4 (default) | Mean, `UV_THREADPOOL_SIZE=12` |
| --------------------------- | ------------------------- | ----------------------------- |
| 1                           | 4.14s                     | 4.13s                         |
| 2                           | 2.19s                     | 2.20s                         |
| 4                           | 1.32s                     | 1.34s                         |
| `'max'`: 10, one per source | 1.38s                     | **885ms**                     |

Sharp runs each operation on a thread of libuv's pool, and libvips spreads
the pixels of each over its own threads. With the default pool of 4,
4 sources at a time is the fastest, which is what `concurrency: 'auto'`
picks: more only wait for a thread. With a pool as large as the
machine's parallelism, all 10 sources at once take 885ms: 33% less time, the
CPU 70% busy instead of 32%. The pool must be sized before the process
starts, which a library can't do for its host: set `UV_THREADPOOL_SIZE` for
your build scripts; the command line does it for you (see
[docs/cli-proposal.md](../docs/cli-proposal.md)).

**formats.js**: encoding a 1280 pixels wide image, nothing else.

| Encoder                        | Mean   | Runs |
| ------------------------------ | ------ | ---- |
| JPEG q80 baseline              | 10.6ms | 378  |
| JPEG q80 progressive (default) | 26.6ms | 153  |
| JPEG q86 mozjpeg               | 142ms  | 31   |
| WebP q80 (default)             | 116ms  | 36   |
| AVIF q60 (default)             | 758ms  | 21   |
| PNG zlib 6                     | 67.0ms | 60   |
| PNG zlib 9 (default)           | 103ms  | 40   |

**weight.js**: three photos at 1280 pixels wide, averages; SSIM against the
uncompressed pixels.

| Format | Setting            | kB     | vs baseline | SSIM   |
| ------ | ------------------ | ------ | ----------- | ------ |
| JPEG   | q80 baseline       | 300.1  | 100%        | 0.9735 |
| JPEG   | q80 progressive \* | 289.7  | 97%         | 0.9735 |
| JPEG   | q80 mozjpeg        | 244.1  | 81%         | 0.966  |
| JPEG   | q86 mozjpeg        | 302.8  | 101%        | 0.9742 |
| WebP   | q80 \*             | 219.1  | 73%         | 0.9753 |
| WebP   | q75                | 179.4  | 60%         | 0.9686 |
| AVIF   | q65                | 181.3  | 60%         | 0.9754 |
| AVIF   | q60 \*             | 159.8  | 53%         | 0.9716 |
| AVIF   | q50                | 109.9  | 37%         | 0.9575 |
| PNG    | zlib 6             | 3436.7 | 1145%       | 1      |
| PNG    | zlib 9 \*          | 3294.8 | 1098%       | 1      |

\* the library's defaults. mozjpeg's smaller files at q80 come with a
lower SSIM; at the same SSIM (q86) it is not smaller than progressive
libjpeg, and about 5 times slower to encode. AVIF q60 is within 0.002 of
JPEG's SSIM at about half its bytes; q50, sharp's default, is visibly
softer.

SSIM here is single scale, on luma: good to rank settings of the same
image, not a perceptual metric for every kind of artifact (AVIF smooths
fine texture, JPEG blocks).

**hooks.js**: pipeline.js's photo, sizes and formats (2048, 1024, 512;
WebP and JPEG), with one hook per case.

| Case                                   | Mean  | vs no hooks |
| -------------------------------------- | ----- | ----------- |
| no hooks                               | 675ms |             |
| a hook at every point, no change       | 716ms | 6% slower   |
| `afterSourceLoad`: `modulate`          | 882ms | 31% slower  |
| `afterSourceLoad`: `pixels()`, JS gain | 751ms | 11% slower  |
| `afterResize`: `sharpen`               | 799ms | 18% slower  |
| `beforeEncode`: a translucent overlay  | 738ms | 9% slower   |
| `beforeFormat`: `sharpen`, WebP only   | 776ms | 15% slower  |

Recorded with other processes busy: no hooks ran in 582ms in pipeline.js
the same minutes, and before sources were decoded first, hooks that change
nothing measured 746ms against 748ms without hooks. An `afterSourceLoad`
hook costs its work at the photo's full size (11.4 megapixels): a `modulate` and its
bake about 200ms, a copy of the pixels and a loop over 34 million bytes
about 80ms. A sharpen costs about as much baked per size (`afterResize`,
for both formats) as run in the WebP encodes (`beforeFormat`): three
sharpens either way, the bakes on top.
