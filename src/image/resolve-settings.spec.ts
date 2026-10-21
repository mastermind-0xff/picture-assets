import { Metadata } from 'sharp';

const envOrg = process.env;
process.env.IMAGE_RESIZE_LOG_LEVEL = 'verbose';

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

import { logMessage } from '../log/logger';
import { OutputSetting } from '../types/output';
import {
  SourceDimensions,
  findSettingsResolutionBoundaries,
  getSourceMultiplier,
  ResolvedOutputSettings,
  resolveOutputSettings,
} from './resolve-settings';

describe('check findSettingsResolutionBoundaries', () => {
  test('with empty set', () => {
    const testSizes: OutputSetting[] = [];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920,
      srcHeight: 1080,
    };
    expect(
      findSettingsResolutionBoundaries(testSizes, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: undefined,
      minWidth: undefined,
      minHeight: undefined,
    });
  });

  test('with no multiplier', () => {
    const testSizes: OutputSetting[] = [
      { width: 1920 },
      { height: 540 },
      { width: 1920, height: 800 },
      { width: 2560, height: 1440 },
    ];
    const testSizes2: OutputSetting[] = [
      { width: 960 },
      { height: 1080 },
      { width: 1920, height: 800 },
      { width: 2560, height: 1440 },
    ];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920,
      srcHeight: 1080,
    };
    expect(
      findSettingsResolutionBoundaries(testSizes, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: undefined,
      minWidth: 960,
      minHeight: 540,
    });
    expect(
      findSettingsResolutionBoundaries(testSizes2, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: undefined,
      minWidth: 960,
      minHeight: 540,
    });
  });

  test('with one width multiplier', () => {
    const testSizes: OutputSetting[] = [
      { width: 'x1' },
      { height: 1080 },
      { width: 2560, height: 1440 },
    ];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920,
      srcHeight: 1080,
    };
    expect(
      findSettingsResolutionBoundaries(testSizes, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: 1,
      minWidth: 1920,
      minHeight: 1080,
    });
  });

  test('with one width and one height multiplier', () => {
    const testSizes: OutputSetting[] = [
      { width: 'x1' },
      { height: 'x2' },
      { width: 2560, height: 1440 },
    ];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920,
      srcHeight: 1080,
    };
    expect(
      findSettingsResolutionBoundaries(testSizes, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: 2,
      minWidth: 2560,
      minHeight: 1440,
    });
  });

  test('with many multipliers', () => {
    const testSizes: OutputSetting[] = [
      { width: 'x1' },
      { height: 'x2' },
      { width: 'x3', height: 'x4' },
      { width: 'x1', height: 'x1' },
      { width: 'x5', height: 'x5' },
      { width: 2560, height: 1440 },
    ];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920,
      srcHeight: 1080,
    };
    expect(
      findSettingsResolutionBoundaries(testSizes, sourceDimensions)
    ).toMatchObject({
      maxMultiplier: 5,
      minWidth: 2560,
      minHeight: 1440,
    });
  });
});

describe('check getSourceMultiplier', () => {
  test('with multipliers hint', () => {
    expect(
      getSourceMultiplier([], { srcWidth: 1920, srcHeight: 1080 }, 'x1')
    ).toStrictEqual(1);
    expect(
      getSourceMultiplier([], { srcWidth: 1920, srcHeight: 1080 }, 'x3')
    ).toStrictEqual(3);
    expect(
      getSourceMultiplier([], { srcWidth: 1920, srcHeight: 1080 }, 'x5')
    ).toStrictEqual(5);
    expect(
      getSourceMultiplier([], { srcWidth: 1920, srcHeight: 1080 }, 'x1.5')
    ).toStrictEqual(1.5);
  });

  test('with object x1 hint', () => {
    // =
    expect(
      getSourceMultiplier(
        [],
        { srcWidth: 400, srcHeight: 200 },
        { width: 200, height: 100 }
      )
    ).toStrictEqual(2);
    // width <
    expect(
      getSourceMultiplier(
        [],
        { srcWidth: 400, srcHeight: 300 },
        { width: 200, height: 100 }
      )
    ).toStrictEqual(2);
    // height <
    expect(
      getSourceMultiplier(
        [],
        { srcWidth: 600, srcHeight: 200 },
        { width: 200, height: 100 }
      )
    ).toStrictEqual(2);
    // = < 1
    expect(
      getSourceMultiplier(
        [],
        { srcWidth: 100, srcHeight: 50 },
        { width: 200, height: 100 }
      )
    ).toStrictEqual(0.5);
    // width < 1
    expect(
      getSourceMultiplier(
        [],
        { srcWidth: 100, srcHeight: 200 },
        { width: 200, height: 100 }
      )
    ).toStrictEqual(0.5);
  });
  // height < 1
  expect(
    getSourceMultiplier(
      [],
      { srcWidth: 200, srcHeight: 50 },
      { width: 200, height: 100 }
    )
  ).toStrictEqual(0.5);

  test('downsample', () => {
    // downsample - min resolution is x1
    expect(
      getSourceMultiplier(
        [{ width: 960 }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(2);
    expect(
      getSourceMultiplier(
        [{ width: 640 }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(3);
    expect(
      getSourceMultiplier(
        [{ width: 640 }, { width: 'x1' }, { width: 'x5' }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(3);
    // downsample - max multiplier equals source
    expect(
      getSourceMultiplier(
        [{ width: 'x1' }, { width: 'x2' }, { width: 'x3' }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(3);
    expect(
      getSourceMultiplier(
        [{ width: 3840 }, { width: 'x2' }, { width: 'x3' }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(3);
    // downsample - downsampling not possible
    expect(
      getSourceMultiplier(
        [{ width: 3840 }],
        { srcWidth: 1920, srcHeight: 1080 },
        'downsample'
      )
    ).toStrictEqual(1);
    expect(logMessageMock).toHaveBeenCalledWith(
      'warning',
      'Unable to downsample with current config. Source multiplier set to 1.'
    );
  });

  test('upsample', () => {
    expect(
      getSourceMultiplier([], { srcWidth: 1920, srcHeight: 1080 }, 'upsample')
    ).toStrictEqual(1);
  });
});

describe('check resolveOutputSettings', () => {
  test('width/height correct output', () => {
    const srcMeta = {
      width: 800,
      height: 400,
    } as Metadata;
    const settings: OutputSetting[] = [
      // x1 will become 200x100
      { width: 200, suffix: 'x1' },
      { height: 200, suffix: 'x2' },
      { width: 'x3', suffix: 'x3' },
      { height: 'x4', suffix: 'x4' },
      { width: 'x5', height: 'x5', suffix: 'x5' },
      { width: 1200, height: 600, suffix: 'x6' },
    ];
    const expectedResolvedSettings: ResolvedOutputSettings[] = [
      {
        width: 200,
        height: 100,
        aspectRatio: 2,
        heightMultiplier: 1,
        widthMultiplier: 1,
        sizeMultiplier: 1,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: true,
        generateFromSource: false,
      },
      {
        width: 400,
        height: 200,
        aspectRatio: 2,
        heightMultiplier: 2,
        widthMultiplier: 2,
        sizeMultiplier: 2,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: true,
        generateFromSource: false,
      },
      {
        width: 600,
        height: 300,
        aspectRatio: 2,
        heightMultiplier: 3,
        widthMultiplier: 3,
        sizeMultiplier: 3,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: true,
        generateFromSource: false,
      },
      {
        width: 800,
        height: 400,
        aspectRatio: 2,
        heightMultiplier: 4,
        widthMultiplier: 4,
        sizeMultiplier: 4,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: true,
        generateFromSource: false,
      },
      {
        width: 1000,
        height: 500,
        aspectRatio: 2,
        heightMultiplier: 5,
        widthMultiplier: 5,
        sizeMultiplier: 5,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: false,
        generateFromSource: true,
      },
      {
        width: 1200,
        height: 600,
        aspectRatio: 2,
        heightMultiplier: 6,
        widthMultiplier: 6,
        sizeMultiplier: 6,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: false,
        generateFromSource: true,
      },
    ];

    expect(
      resolveOutputSettings(settings, srcMeta, 'downsample')
    ).toMatchObject(expectedResolvedSettings);
  });

  test('with crops and not matching aspect ratio', () => {
    const srcMeta = {
      width: 800,
      height: 400,
    } as Metadata;
    const settings: OutputSetting[] = [
      { width: 200, suffix: 'x1' },
      {
        width: 400,
        extractRegion: { top: 50, left: 0, width: 400, height: 100 },
      },
      { width: 600, height: 100, suffix: 'x3ish' },
      { width: 'x5', suffix: 'x5' },
    ];
    const expectedResolvedSettings: ResolvedOutputSettings[] = [
      {
        width: 200,
        height: 100,
        aspectRatio: 2,
        heightMultiplier: 1,
        widthMultiplier: 1,
        sizeMultiplier: 1,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: true,
        generateFromSource: false,
      },
      {
        width: 400,
        height: 200,
        aspectRatio: 2,
        heightMultiplier: 2,
        widthMultiplier: 2,
        sizeMultiplier: 2,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: false,
        generateFromSource: false,
      },
      {
        width: 600,
        height: 100,
        aspectRatio: 6,
        heightMultiplier: 1,
        widthMultiplier: 3,
        sizeMultiplier: 2,
        isMatchingSourceAspectRatio: false,
        useAsNextResizeIteration: false,
        generateFromSource: false,
      },
      {
        width: 1000,
        height: 500,
        aspectRatio: 2,
        heightMultiplier: 5,
        widthMultiplier: 5,
        sizeMultiplier: 5,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: false,
        generateFromSource: true,
      },
    ];

    expect(
      resolveOutputSettings(settings, srcMeta, 'downsample')
    ).toMatchObject(expectedResolvedSettings);
  });

  test('override useAs and generateFrom', () => {
    const srcMeta = {
      width: 800,
      height: 400,
    } as Metadata;
    const settings: OutputSetting[] = [
      {
        width: 200,
        suffix: 'x1',
        useAsNextResizeIteration: false,
        generateFromSource: true,
      },
    ];
    const expectedResolvedSettings: ResolvedOutputSettings[] = [
      {
        width: 200,
        height: 100,
        aspectRatio: 2,
        heightMultiplier: 1,
        widthMultiplier: 1,
        sizeMultiplier: 1,
        isMatchingSourceAspectRatio: true,
        useAsNextResizeIteration: false,
        generateFromSource: true,
      },
    ];

    expect(
      resolveOutputSettings(settings, srcMeta, 'downsample')
    ).toMatchObject(expectedResolvedSettings);
  });
});
