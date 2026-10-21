import fs from 'node:fs/promises';
import path from 'path';

import sharp from 'sharp';

const envOrg = process.env;
process.env.IMAGE_RESIZE_LOG_LEVEL = 'verbose';

import { parseSuffix, resizeSourceToFormats, sharpToFile } from './output';

const logMessageMock = jest.fn();

jest.mock('../log/logger', () => ({
  ...jest.requireActual('../log//logger'),
  logMessage: (...args: any[]) => logMessageMock(...args),
}));

beforeEach(() => {
  jest.resetModules();
  process.env = { ...envOrg };
  process.env.IMAGE_RESIZE_LOG_LEVEL = 'verbose';
});
afterAll(() => {
  process.env = envOrg;
});

describe('check parseSuffix', () => {
  test('with default suffix', () => {
    process.env.IMAGE_RESIZE_SUFFIX = 'suffix_@{w}w';
    const { parseSuffix } = require('./output');
    expect(parseSuffix(undefined, { width: 1920, height: 1080 })).toStrictEqual(
      'suffix_@1920w'
    );
  });
  test('with suffix, no wildcards,', () => {
    const { parseSuffix } = require('./output');
    expect(parseSuffix('@SomeSuffix')).toStrictEqual('@SomeSuffix');
  });
  test('with suffix, with wildcards', () => {
    expect(
      parseSuffix('@SomeSuffix_{w}_{h}_{wm}_{hm}_{sm}', {
        width: 1024,
        height: 768,
        widthMultiplier: 1,
        heightMultiplier: 2,
        sizeMultiplier: 3,
      })
    ).toStrictEqual('@SomeSuffix_1024_768_1_2_3');
  });
  test('with suffix, with wildcards, with dashes and spaces', () => {
    expect(
      parseSuffix('\\ @SomeSuffix_{w}_{h}/ \n', { width: 1024, height: 768 })
    ).toStrictEqual('@SomeSuffix_1024_768');
  });
  test('with suffix, no match', () => {
    expect(
      parseSuffix('@SomeSuffix_{x}', { width: 1024, height: 768 })
    ).toStrictEqual('@SomeSuffix_{x}');
  });
  test('with suffix, empty wildcard', () => {
    expect(
      parseSuffix('@SomeSuffix_1{w}_2{h}_3{wm}_4{hm}_5{sm}')
    ).toStrictEqual('@SomeSuffix_1_2_3_4_5');
  });
});

describe('check sharpToFile', () => {
  const root = './__tests__/e2e/assets/';
  const rootSrc = path.join(root, '/raw-images/');
  const rootDest = path.join(root, '/optimized-images/specs/');
  const srcFilePath = path.join(rootSrc, 'house-01.jpg');

  const srcSharp = sharp(srcFilePath);

  test('outputs a file, logs messages', async () => {
    const destFile = path.join(rootDest, '/test.sharpToFile/house-01.webp');
    console.log(path.dirname(destFile));
    expect(await sharpToFile(srcSharp, destFile, 'webp', {})).toMatchObject({
      format: 'webp',
      width: 3901,
      height: 2926,
    });
    expect(logMessageMock).toHaveBeenNthCalledWith(
      1,
      'verbose',
      destFile,
      'Adding file'
    );
    expect(logMessageMock).toHaveBeenNthCalledWith(
      2,
      'info',
      destFile,
      'File created'
    );
    // folder is created
    expect(fs.access(path.dirname(destFile), fs.constants.F_OK)).resolves.toBe(
      undefined
    );
  });
});

describe('check resizeFileToFormatsAsync', () => {
  const root = './__tests__/e2e/assets/';
  const rootSrc = path.join(root, '/raw-images/');
  const rootDest = path.join(root, '/optimized-images/specs/');
  const srcFilePath = path.join(rootSrc, 'house-01.jpg');
  const destPath = path.join(rootDest, '/test.1/house-01');

  test('downsample', async () => {
    expect(
      await resizeSourceToFormats(
        srcFilePath,
        [{ width: 1024 }, { width: 2048 }],
        { webp: {} },
        destPath,
        'downsample'
      )
    ).toEqual([
      path.join(rootDest, '/test.1/house-01@2048w.webp'),
      path.join(rootDest, '/test.1/house-01@1024w.webp'),
    ]);
    expect(logMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      `Resolved settings for ${srcFilePath}`
    );
  });

  test('upsample', async () => {
    // output order matters
    expect(
      await resizeSourceToFormats(
        srcFilePath,
        [{ width: 1024 }, { width: 2048 }],
        { jpg: {} },
        destPath,
        'upsample'
      )
    ).toEqual([
      path.join(rootDest, '/test.1/house-01@1024w.jpg'),
      path.join(rootDest, '/test.1/house-01@2048w.jpg'),
    ]);
    expect(logMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      `Resolved settings for ${srcFilePath}`
    );
  });

  test('cropped region', async () => {
    // cropped regions affect final resolution
    expect(
      await resizeSourceToFormats(
        srcFilePath,
        [
          {
            width: 1024,
            extractRegion: { left: 400, top: 300, width: 200, height: 100 },
          },
          {
            width: 2048,
            extractRegion: { left: 800, top: 600, width: 300, height: 150 },
          },
        ],
        { jpg: {} },
        destPath,
        'downsample'
      )
    ).toEqual([
      path.join(rootDest, '/test.1/house-01@300w.jpg'),
      path.join(rootDest, '/test.1/house-01@200w.jpg'),
    ]);
    expect(logMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      `Resolved settings for ${srcFilePath}`
    );
  });
});
