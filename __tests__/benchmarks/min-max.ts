import fs from 'fs';
import path from 'path';
import os from 'os';

import { glob } from 'glob';
import sharp from 'sharp';
import { ObjectEntries } from '@mmtypes/common';

import { ImageResizeConfig } from '../../src/config/main';
import { createLogger } from '../../src/log/logger';
import { batchImageResize } from '../../src/lib/batch-image-resize';
import {
  formatMsTime,
  plotValuesToTerminal,
  sampleCPUUsage,
} from '../../src/utils/helpers';

const root = './__tests__/';
const rootSrc = path.join(root, '/assets/raw-images/');
const rootDest = path.join(root, '/benchmarks/min-max/');
const srcPattern = '**/*.*';
// const srcPattern = '*.*';
// const srcPattern = '/house-01.jpg';

const srcFiles = await glob(
  path.join(rootSrc, srcPattern).replaceAll('\\', '/')
);
const formats = {
  webp: { quality: 80 },
  png: { quality: 80 },
  jpg: { quality: 80 },
  // gif: { quality: 80 },
} as const;
const settings = [{ width: 3000 }, { width: 2000 }, { width: 1000 }] as const;
// const settings = [{ width: 3000 }] as const;
const testSuits: (() => Promise<void>)[] = [];

if (fs.existsSync(rootDest))
  fs.rmSync(rootDest, { force: true, recursive: true });

const expectedFiles: string[] = [];
srcFiles.reduce((acc: string[], curFilePath: string) => {
  const relativePath = path.relative(rootSrc, curFilePath);
  const { dir, name } = path.parse(relativePath);
  let destFile: string = path.join(dir, name);
  Object.keys(formats).forEach((format) => {
    settings.forEach((setting) => {
      acc.push(`${destFile}@${setting['width']}w.${format}`);
    });
  });
  return acc;
}, expectedFiles);

console.log('UV_THREADPOOL_SIZE', process.env.UV_THREADPOOL_SIZE);

const runTests = async (tests: (() => Promise<void>)[]) => {
  for (const test of tests) {
    console.log('running', test.name);
    const startMeasure = sampleCPUUsage();
    await test();
    console.log(
      'completed in',
      formatMsTime(
        Number(process.hrtime.bigint() - startMeasure.time) / 1000 / 1000
      )
    );
    console.log('average CPU usage', `${sampleCPUUsage(startMeasure)}%`);
    console.log('------------');
  }
};

// Unoptimized sharp
const destSharp = path.join(rootDest, '/test.1/');
fs.mkdirSync(destSharp, { recursive: true });

const testPureSharpUnoptimized = async () => {
  let n = 0;
  for (let srcFile of srcFiles) {
    for (let { width } of settings) {
      for (let [format, { quality }] of Object.entries(
        formats
      ) as ObjectEntries<typeof formats>) {
        await sharp(srcFile)
          .resize(width)
          .toFormat(format, { quality })
          .toFile(`${destSharp}/${n}@${width}w.${format}`);
      }
    }
    n++;
  }
};

// Optimized sharp
const destSharp2 = path.join(rootDest, '/test.2/');
fs.mkdirSync(destSharp2, { recursive: true });

const testPureSharpOptimized = async () => {
  let n = 0;
  const threads = parseInt(process.env.UV_THREADPOOL_SIZE ?? '4');
  for (let srcFile of srcFiles) {
    for (let { width } of settings) {
      const pool = [];
      const buffer = await sharp(srcFile)
        .resize(width)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const srcResized = sharp(buffer.data, { raw: buffer.info });
      for (let [format, { quality }] of Object.entries(
        formats
      ) as ObjectEntries<typeof formats>) {
        pool.push(
          srcResized
            .clone()
            .toFormat(format, { quality })
            .toFile(`${destSharp2}/${n}@${width}w.${format}`)
        );
      }
      await Promise.all(pool);
    }
    n++;
  }
};

// batchImageResize
const destBatchImageResize = path.join(rootDest, '/test.3/');
fs.mkdirSync(destBatchImageResize, { recursive: true });

const testBatchImageResize = async () => {
  await batchImageResize(
    { root: rootSrc, resource: srcPattern },
    destBatchImageResize,
    [...settings],
    formats,
    'auto',
    {
      logger: createLogger('info'),
      resizeStrategyHint: ImageResizeConfig.resizeStrategyHint,
      executionScope: 'batch',
      abortScope: ImageResizeConfig.abortScope,
    }
  );
};

// testSuits.push(testPureSharpOptimized);
// testSuits.push(testPureSharpUnoptimized);
testSuits.push(testBatchImageResize);

// testSuits.push(testPureSharpOptimized);
// // testSuits.push(testPureSharpUnoptimized);
// testSuits.push(testBatchImageResize);

// testSuits.push(testPureSharpOptimized);
// // testSuits.push(testPureSharpUnoptimized);
// testSuits.push(testBatchImageResize);

await runTests(testSuits);

// let str = '';
// for (let i = 1; i <= 8; i++) {
//   str += String.fromCodePoint(0x2580 + i);
// }
// console.log(str);

// plotMemUsage([
//   0, 100, 200, 300, 400, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 500, 400,
//   300, 400, 500, 600, 700, 500, 600, 700, 1000, 500, 600, 500, 400, 300, 400,
//   500, 600, 700, 500, 600, 700, 1000, 500, 600, 500, 400, 300, 400, 500, 600,
//   700, 500, 600, 700, 1000, 500, 600, 500, 400, 300, 400, 500, 600, 700, 500,
//   600, 700, 1000, 500, 600, 500, 400, 300, 400, 500, 600, 700, 500, 600, 700,
//   1000, 500, 600, 500, 400, 300, 400, 500, 600, 700, 500, 600, 700, 1000, 500,
//   600, 500, 400, 300, 400, 500, 600, 700, 500, 600, 700, 1000, 500, 600, 500,
//   400, 300, 400, 500, 600, 700, 500, 600, 700, 1000, 500, 600, 500, 400, 300,
//   400, 500, 600, 700, 500, 600, 700, 1000, 500, 600, 500, 400, 300, 400, 500,
//   600, 700, 500, 600, 700, 1000, 500, 600, 500, 400, 300, 400, 500, 600, 700,
//   500, 600, 700, 1000, 500, 600, 500, 400, 300, 400, 500, 600, 700, 500, 600,
//   700, 1000, 500, 600, 500, 400, 300, 400, 500, 600, 700, 500, 600, 700, 1000,
//   500, 600, 500, 400, 300, 400, 500, 600, 700, 500, 600, 700, 1000, 500, 600,
//   500, 400,
// ]);
