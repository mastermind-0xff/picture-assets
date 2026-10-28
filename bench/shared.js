import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { DEFAULT_SUMMARY, isWorker, loggerReporter } from '@mmutils/bench';
import { Logger, messagePlugin } from '@mmutils/logger';

/**
 * Shared setup of the benchmarks. mm-bench runs each bench file again in
 * every worker, up to the call it measures, so everything that decides the
 * cases must come out the same there. Workers don't get the command line:
 * the main thread passes it through the environment, which each worker
 * copies when it starts.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARGS_KEY = 'IMAGE_ASSETS_BENCH_ARGS';

/** The sample photos, shared with the examples. */
export const IMAGES = path.join(HERE, '..', 'examples', 'images');
/** A 3901x2926 progressive JPEG with an ICC profile. */
export const PHOTO = path.join(IMAGES, 'house-01.jpg');

/** The library's build: the benchmarks measure what is published. */
export const LIBRARY = new URL('../dist/esm/index.js', import.meta.url);
if (!fs.existsSync(LIBRARY))
  throw new Error('Build the library first: npm run build');

const parseOptions = () => {
  let args;
  if (isWorker()) args = JSON.parse(process.env[ARGS_KEY] ?? '[]');
  else {
    args = process.argv.slice(2);
    process.env[ARGS_KEY] = JSON.stringify(args);
  }
  return parseArgs({
    args,
    options: { quick: { type: 'boolean', default: false } },
    strict: true,
  }).values;
};

export const options = parseOptions();

/** Measured runs per case: enough for a distribution worth reading. */
export const RUNS = 20;

const QUICK = { samples: 2, runs: 2, warmup: { runs: 0 } };

/**
 * Measure options for image work, whose runs take from hundreds of
 * milliseconds to seconds, far from mm-bench's microbenchmark defaults:
 * exactly `RUNS` measured runs per case, 5 in each of 4 samples. No warm-up
 * runs: the work is native, and each sample's first call, which is not
 * measured, already loads sharp and its caches. `--quick` is a smoke test,
 * not a measurement.
 */
export const measureOptions = () =>
  options.quick ? QUICK : { samples: 4, runs: RUNS, warmup: { runs: 0 } };

/**
 * Measure options for cases from milliseconds to a second: at least 4
 * seconds per case, so fast cases get hundreds of runs, and long enough for
 * `RUNS` runs of the slow ones. Half a second of warm-up estimates a run's
 * time.
 */
export const timedMeasureOptions = () =>
  options.quick ? QUICK : (
    {
      samples: 4,
      time: { min: 4000, max: 120_000, runs: RUNS },
      warmup: { time: 500 },
    }
  );

/** Graphs that tell something about image work: native threads, not heap. */
export const GRAPHS = ['distribution', 'timeline', 'cores'];

/** mm-bench's reporter, with the number of runs in the summary. */
export const reporter = (graphs = GRAPHS) =>
  loggerReporter({ graphs, summary: [...DEFAULT_SUMMARY, 'runs'] });

/** For the main thread's messages; the workers' output is dropped anyway. */
export const logger = new Logger({
  level: 'info',
  timestamp: 'HH:mm:ss',
  useStyles: !process.env.NO_COLOR,
  plugins: [messagePlugin()],
});

/**
 * A fresh output directory per case, created on the main thread and in the
 * workers alike (the measured function writes into it).
 */
export const outputDir = (bench, name) => {
  const dir = path.join(HERE, 'output', bench, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir + path.sep;
};

const luma = (data, channels, pixels) => {
  const values = new Float64Array(pixels);
  for (let index = 0; index < pixels; index++) {
    const offset = index * channels;
    values[index] =
      channels >= 3 ?
        0.299 * data[offset] +
        0.587 * data[offset + 1] +
        0.114 * data[offset + 2]
      : data[offset];
  }
  return values;
};

/**
 * Structural similarity of two images of the same size: the mean SSIM of
 * their luma over 8x8 windows, every 4 pixels. 1 is identical; above 0.98
 * differences are hard to see at 1:1. A single scale SSIM: good to rank
 * encoder settings on the same image, not a perceptual metric for every
 * kind of artifact.
 *
 * @param a Raw pixels, 8 bits per channel.
 * @param b Raw pixels of the same size and channels.
 * @param info `{ width, height, channels }` of both.
 */
export const ssim = (a, b, { width, height, channels }) => {
  const x = luma(a, channels, width * height);
  const y = luma(b, channels, width * height);
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  const WINDOW = 8;
  const STEP = 4;
  const n = WINDOW * WINDOW;
  let total = 0;
  let windows = 0;
  for (let top = 0; top + WINDOW <= height; top += STEP)
    for (let left = 0; left + WINDOW <= width; left += STEP) {
      let sumX = 0;
      let sumY = 0;
      let sumXX = 0;
      let sumYY = 0;
      let sumXY = 0;
      for (let row = top; row < top + WINDOW; row++)
        for (
          let index = row * width + left;
          index < row * width + left + WINDOW;
          index++
        ) {
          sumX += x[index];
          sumY += y[index];
          sumXX += x[index] * x[index];
          sumYY += y[index] * y[index];
          sumXY += x[index] * y[index];
        }
      const meanX = sumX / n;
      const meanY = sumY / n;
      const varianceX = sumXX / n - meanX * meanX;
      const varianceY = sumYY / n - meanY * meanY;
      const covariance = sumXY / n - meanX * meanY;
      total +=
        ((2 * meanX * meanY + C1) * (2 * covariance + C2)) /
        ((meanX * meanX + meanY * meanY + C1) * (varianceX + varianceY + C2));
      windows++;
    }
  return total / windows;
};

/** Decoded pixels of an image file or buffer, without alpha. */
export const pixels = async (sharp, input) => {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
};

/**
 * A short name of encoder options, so labels follow the library's defaults:
 * `{ quality: 63, effort: 3, chromaSubsampling: '4:4:4' }` is
 * `q63 effort 3 4:4:4`.
 */
export const describeOptions = (options) =>
  Object.entries(options)
    .map(([key, value]) =>
      key === 'quality' ? `q${value}`
      : key === 'compressionLevel' ? `zlib ${value}`
      : key === 'chromaSubsampling' ? value
      : value === true ? key
      : `${key} ${value}`
    )
    .join(' ');

/** Text table: the first row is the header, numbers are right aligned. */
export const table = (rows) => {
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => String(row[column]).length))
  );
  return rows.map((row) =>
    row
      .map((cell, column) =>
        typeof cell === 'number' ?
          String(cell).padStart(widths[column])
        : String(cell).padEnd(widths[column])
      )
      .join(' | ')
      .trimEnd()
  );
};
