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

## Results

From `results/*.txt`, on an Intel i7-9750H laptop (6 cores, 12 threads),
Windows 11, Node 22.22, sharp 0.35.5 (libvips 8.18). Your numbers will
differ; the ratios are what to look at.

**pipeline.js**: one 3901x2926 photo to 2048, 1024 and 512 pixels wide,
WebP and JPEG, the same encoder options everywhere.

| Case                                                   | Mean  | vs imageResize |
| ------------------------------------------------------ | ----- | -------------- |
| `imageResize`                                          | 741ms |                |
| sharp, each size resized once, formats in parallel     | 997ms | 34.5% slower   |
| sharp, one call per file (decode and resize each time) | 1.63s | 2.20× slower   |

**chain.js**: the photo to 6 srcset widths (2560 to 320) in WebP.

| Case                             | Mean  |            |
| -------------------------------- | ----- | ---------- |
| chained: each size from the last | 1.34s |            |
| every size from the source       | 2.13s | 59% slower |

Quality, on 3 photos: SSIM of each size against one resize from the
photo's full resolution pixels (1 is identical). The lowest of each:

| Photo               | Chained | From the source |
| ------------------- | ------- | --------------- |
| house-01, 3901x2926 | 0.9976  | 0.9563 (320w)   |
| house-10, 7781x5190 | 0.9959  | 0.9683 (640w)   |
| house-03, 3024x4032 | 0.9982  | 0.9980          |

Chaining is faster and closer to the reference: from the source, sharp's
JPEG shrink-on-load decodes the small sizes approximately. This
benchmark also found a bug in the chain: each size was resized with
sharp's default `fit: 'cover'`, which crops the fraction of a pixel by
which a rounded size misses the aspect ratio, and the crops added up to a
shift of up to a pixel: down to 0.905 at 320w on house-10. Sizes with the source's
aspect ratio are now scaled to fill, which fixed it.

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
your build scripts, and the CLI will set it (see
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
