import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import {
  AtLeastOneOutputFormat,
  batchImageResizeAsync,
  imageResizeAsync,
  OutputFormat,
  OutputFormatsOptions,
  OutputSettings,
} from '../../src';
import { parsePath } from '@mmutils/common';
import { ImageResizeConfig, ImageResizeOptions } from '../../src/config/main';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');

let ImageResizeConfigOrg: Partial<ImageResizeOptions> = {};
Object.assign(ImageResizeConfigOrg, ImageResizeConfig);

beforeEach(() => {
  Object.assign(ImageResizeConfig, ImageResizeConfigOrg);
});

const allFilesExist = (basePath: string, filesList: string[]) => {
  for (const fileName of filesList) {
    const filePath = path.join(basePath, fileName);
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      console.log(
        `\x1b[41m File does not exist! \x1b[0m ${basePath}\x1b[31m${fileName}\x1b[0m`
      );
      return false;
    }
  }
  return true;
};

describe('Create assets', () => {
  beforeAll(() => {
    if (fs.existsSync(rootDest))
      fs.rmSync(rootDest, { force: true, recursive: true });

    fs.mkdirSync(rootDest, { recursive: true });
  });

  test('using no filename in dest path.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.1/');

    const result = await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ width: 2048 }, { width: 1024 }],
      ['webp', 'png']
    );

    const expectedFileNames = [
      'house-01@1024w.webp',
      'house-01@1024w.png',
      'house-01@2048w.webp',
      'house-01@2048w.png',
    ];

    expect(allFilesExist(destPath, expectedFileNames)).toBe(true);
  });

  [{ width: 1024 }, { width: 2048 }, { width: 3072 }, { width: 'x2' }];

  test('using filename with no extension (as identifier) in dest path.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.2/new-name');
    const destPathInfo = parsePath(destPath);

    const result = await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ width: 2048 }, { width: 1024 }],
      ['webp', 'png']
    );

    const expectedFileNames = [
      'new-name@1024w.webp',
      'new-name@1024w.png',
      'new-name@2048w.webp',
      'new-name@2048w.png',
      'new-name@2048w.png',
    ];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using filename with extension in dest path.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.3/new-name.tif');
    const destPathInfo = parsePath(destPath);

    const result = await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ width: 2048 }, { width: 1024 }],
      ['webp', 'png']
    );

    const expectedFileNames = [
      'new-name@1024w.webp',
      'new-name@1024w.png',
      'new-name@1024w.tif',
      'new-name@2048w.webp',
      'new-name@2048w.png',
      'new-name@2048w.tif',
    ];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using no extensions.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01');
    const destPath = path.join(rootDest, '/test.4/new-name');

    expect(
      async () =>
        await imageResizeAsync(srcFilePath, destPath, [{ width: 1024 }])
    ).rejects.toThrow('At least one output format is required.');
  });

  test('using source extension.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.5/new-name');
    const destPathInfo = parsePath(destPath);

    await imageResizeAsync(srcFilePath, destPath, [{ width: 1024 }]);

    const expectedFileNames = ['new-name@1024w.jpg'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using multipliers, downsample.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.6/downsample');
    const destPathInfo = parsePath(destPath);

    //@ts-ignore
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'downsample';

    await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ height: 'x3' }, { width: 'x2' }],
      ['webp']
    );

    const expectedFileNames = [
      'downsample@3901w.webp',
      'downsample@2601w.webp',
    ];
    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using multipliers, upscale.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01-low-res@1300w.jpg');
    const destPath = path.join(rootDest, '/test.6/upscale');
    const destPathInfo = parsePath(destPath);

    //@ts-ignore
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'upscale';

    await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ height: 'x2' }, { width: 'x3' }],
      ['webp']
    );

    const expectedFileNames = ['upscale@2600w.webp', 'upscale@3900w.webp'];
    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using multipliers, x1.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01-low-res@1300w.jpg');
    const destPath = path.join(rootDest, '/test.6/x1');
    const destPathInfo = parsePath(destPath);

    //@ts-ignore
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'x1';

    await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ height: 'x1' }, { width: 'x2' }],
      ['webp']
    );

    const expectedFileNames = ['x1@1300w.webp', 'x1@2600w.webp'];
    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using multipliers, x3.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.6/x3');
    const destPathInfo = parsePath(destPath);

    //@ts-ignore
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'x3';

    await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ height: 'x3' }, { width: 'x2' }],
      ['webp']
    );

    const expectedFileNames = [
      'downsample@3901w.webp',
      'downsample@2601w.webp',
    ];
    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using runtime not supported extension.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.7/new-name');
    const destPathInfo = parsePath(destPath);

    await imageResizeAsync(
      srcFilePath,
      destPath,
      [{ width: 1024 }],
      //@ts-ignore
      ['webp', 'bmp']
    );

    const expectedFileNames = ['new-name@1024w.webp'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
  });

  test('using debug mode.', async () => {
    const srcFilePath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.7/new-name');
    const destPathInfo = parsePath(destPath);

    //@ts-ignore
    ImageResizeConfig.DEBUG = true;
    console.log = jest.fn();

    await imageResizeAsync(srcFilePath, destPath, [{ width: 1024 }], ['webp']);

    const expectedFileNames = ['new-name@1024w.webp'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(console.log).toHaveBeenCalled();
  });
});

describe('Batch create assets', () => {
  test('with all files in a directory, recursively.', async () => {
    const destPath = path.join(rootDest, '/test.8/');
    const srcPattern = '**/*.*';
    const srcFiles = await glob(rootSrc + srcPattern.replace(/\\/g, '/'));

    const formats: AtLeastOneOutputFormat = ['webp'];
    const settings: OutputSettings[] = [{ width: 1024 }];

    const expectedFiles: string[] = [];
    srcFiles.reduce((acc: string[], curFilePath: string) => {
      const relativePath = path.relative(rootSrc, curFilePath);
      const { dir, name } = path.parse(relativePath);
      let destFile: string = path.join(dir, name);
      formats.forEach((format) => {
        settings.forEach((setting) => {
          destFile += `@${setting['width']}w.${format}`;
        });
      });
      acc.push(destFile);
      return acc;
    }, expectedFiles);

    expect(allFilesExist(destPath, expectedFiles)).toBe(true);

    await batchImageResizeAsync(
      { root: rootSrc, resource: srcPattern },
      rootDest,
      settings,
      formats
    );
  });
});
