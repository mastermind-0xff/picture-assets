import fs from 'fs';
import path from 'path';

import { parsePath } from '@mmutils/common';

import {
  filterLogMessageCallsByTag,
  mockLogMessage,
} from '../../test-utils/loggerMock';
import { allFilesExist } from '../../test-utils/fsHelpers';

import { imageResize as imageResizeAsyncForType } from '../../src';
import { AtLeastOneOutputFormat, OutputSetting } from '../../src/types/output';
import { ResizeStrategyHint } from '../../src/types/size';

// prime the logger for all re-imported config objects so every log is visible
// import { ImageResizeConfig } is transpiled as require() and its position is
// important for modules that are not reset
process.env.IMAGE_RESIZE_LOG_LEVEL = 'verbose';

let imageResize: typeof imageResizeAsyncForType;
let logMessageMock: jest.Mock;
let logMessageTaggedMock: jest.Mock;
const LOG_MESSAGE_TAG = '(imageResize)';

beforeEach(() => {
  jest.resetModules();

  const { logMessageMock: mock, logMessageTaggedMock: taggedMock } =
    mockLogMessage();

  logMessageMock = mock;
  logMessageTaggedMock = taggedMock;

  // link the fresh mock to imageResize by reloading the module after reset
  imageResize = require('../../src').imageResize;
});

beforeAll(() => {
  if (fs.existsSync(rootDest))
    fs.rmSync(rootDest, { force: true, recursive: true });

  fs.mkdirSync(rootDest, { recursive: true });
});

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');

describe('Create assets', () => {
  test('using no filename in dest path.', async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.1/');
    const settings: OutputSetting[] = [{ width: 2048 }, { width: 1024 }];
    const formats: AtLeastOneOutputFormat = ['webp', 'png'];
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = [
      'house-01@2048w.webp',
      'house-01@2048w.png',
      'house-01@1024w.webp',
      'house-01@1024w.png',
    ];

    expect(allFilesExist(destPath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) => path.join(destPath, fileName)),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using filename with no extension (as identifier) in dest path.', async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.2/new-name');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ width: 2048 }, { width: 1024 }];
    const formats: AtLeastOneOutputFormat = ['webp', 'png'];
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = [
      'new-name@2048w.webp',
      'new-name@2048w.png',
      'new-name@1024w.webp',
      'new-name@1024w.png',
    ];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using filename with extension in dest path.', async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.3/new-name.tif');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ width: 2048 }, { width: 1024 }];
    const formats: AtLeastOneOutputFormat = ['webp', 'png'];
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = [
      'new-name@2048w.webp',
      'new-name@2048w.png',
      'new-name@2048w.tif',
      'new-name@1024w.webp',
      'new-name@1024w.png',
      'new-name@1024w.tif',
    ];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using no extensions.', async () => {
    const srcPath = path.join(rootSrc, 'house-01');
    const destPath = path.join(rootDest, '/test.4/new-name');
    const settings: OutputSetting[] = [{ width: 2048 }, { width: 1024 }];
    const formats: undefined = undefined;
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    await expect(
      imageResize(srcPath, destPath, settings, formats, resizeStrategyHint)
    ).rejects.toThrow('At least one output format is required.');

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(3);
  });

  test("using source's extension.", async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.5/new-name');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ width: 1024 }];
    const formats: undefined = undefined;
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = ['new-name@1024w.jpg'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using multipliers, downsample.', async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.6/downsample');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ height: 'x3' }, { width: 'x2' }];
    const formats: AtLeastOneOutputFormat = ['webp'];
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    const expectedFileNames = [
      'downsample@3901w.webp',
      'downsample@2601w.webp',
    ];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using multipliers, upsample.', async () => {
    const srcPath = path.join(rootSrc, 'house-01-low-res@1300w.jpg');
    const destPath = path.join(rootDest, '/test.6/upsample');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ height: 'x2' }, { width: 'x3' }];
    const formats: AtLeastOneOutputFormat = ['webp'];
    const resizeStrategyHint: ResizeStrategyHint = 'upsample';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = ['upsample@2600w.webp', 'upsample@3900w.webp'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using multipliers, x1.', async () => {
    const srcPath = path.join(rootSrc, 'house-01-low-res@1300w.jpg');
    const destPath = path.join(rootDest, '/test.6/x1');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ height: 'x1' }, { width: 'x2' }];
    const formats: AtLeastOneOutputFormat = ['webp'];
    const resizeStrategyHint: ResizeStrategyHint = 'x1';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = ['x1@2600w.webp', 'x1@1300w.webp'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('using multipliers, x3.', async () => {
    const srcPath = path.join(rootSrc, 'house-01.jpg');
    const destPath = path.join(rootDest, '/test.6/x3');
    const destPathInfo = parsePath(destPath);
    const settings: OutputSetting[] = [{ height: 'x3' }, { width: 'x2' }];
    const formats: AtLeastOneOutputFormat = ['webp'];
    const resizeStrategyHint: ResizeStrategyHint = 'x3';

    const result = await imageResize(
      srcPath,
      destPath,
      settings,
      formats,
      resizeStrategyHint
    );

    // order matters
    const expectedFileNames = ['x3@3901w.webp', 'x3@2601w.webp'];

    expect(allFilesExist(destPathInfo.basePath, expectedFileNames)).toBe(true);
    expect(result).toMatchObject({
      in: srcPath,
      out: expectedFileNames.map((fileName) =>
        path.join(destPathInfo.basePath, fileName)
      ),
    });

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      4,
      'info',
      expect.anything(),
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(4);
  });

  test('source is missing', async () => {
    const srcPath = path.join(rootSrc, 'non-existing-file.jpg');
    const destPath = path.join(rootDest, '/test.7/new-name');
    const settings: OutputSetting[] = [{ width: 2048 }, { width: 1024 }];
    const formats: AtLeastOneOutputFormat = ['webp', 'png'];
    const resizeStrategyHint: ResizeStrategyHint = 'downsample';

    await expect(
      imageResize(srcPath, destPath, settings, formats, resizeStrategyHint)
    ).rejects.toThrow('At least one output format is required.');

    const filteredLogMessageMock = filterLogMessageCallsByTag(
      logMessageTaggedMock,
      LOG_MESSAGE_TAG
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      1,
      'info',
      'Started.',
      'imageResize'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      2,
      'debug',
      {
        srcPath,
        destPath,
        settings,
        formats,
        resizeStrategyHint,
      },
      'Arguments'
    );
    expect(filteredLogMessageMock).toHaveBeenNthCalledWith(
      3,
      'debug',
      expect.anything(),
      'Resolved output path and formats'
    );
    expect(filteredLogMessageMock).toHaveBeenCalledTimes(3);
  });
});