import { Metadata } from 'sharp';
import { ImageResizeConfig, ImageResizeOptions } from '../config/main';
import {
  OutputSettings,
  calcResolutionMultiplier,
  extractResolutionMultiplier,
  retrieveSourceMultiplier,
  parseSuffix,
  resolveOutputSettings,
  findSettingsResolutionBoundaries,
  SourceDimensions,
} from './image-resize';

let ImageResizeConfigOrg: Partial<ImageResizeOptions> = {};
Object.assign(ImageResizeConfigOrg, ImageResizeConfig);

beforeEach(() => {
  Object.assign(ImageResizeConfig, ImageResizeConfigOrg);
});

describe('check parseSuffix', () => {
  test('with default suffix', () => {
    //@ts-expect-error readonly property
    ImageResizeConfig.SUFFIX_DEFAULT = 'suffix_@{w}w';
    expect(parseSuffix(undefined, { width: 1920, height: 1080 })).toStrictEqual(
      'suffix_@1920w'
    );
  });
  test('with suffix, no wildcards,', () => {
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
  test('with suffix, with wildcards, with dashes', () => {
    //@ts-expect-error readonly property
    ImageResizeConfig.SUFFIX_DEFAULT = 'suffix_@{w}w';
    expect(
      parseSuffix('\\@SomeSuffix_{w}_{h}/', { width: 1024, height: 768 })
    ).toStrictEqual('@SomeSuffix_1024_768');
  });
});

describe('check extractResolutionMultiplier', () => {
  test('with no arguments', () => {
    //@ts-expect-error argument not provided
    expect(extractResolutionMultiplier()).toStrictEqual(undefined);
  });
  test('with resolution', () => {
    expect(extractResolutionMultiplier(3840)).toStrictEqual(undefined);
  });
  test('with multiplier x2', () => {
    expect(extractResolutionMultiplier('x2')).toStrictEqual(2);
  });
  test('with multiplier x3', () => {
    expect(extractResolutionMultiplier('x3')).toStrictEqual(3);
  });
  test('with wrong string', () => {
    //@ts-expect-error argument is not assailable
    expect(extractResolutionMultiplier('xAbc')).toStrictEqual(undefined);
  });
});

describe('check findSettingsResolutionBoundaries', () => {
  test('with empty set', () => {
    const testSizes: OutputSettings[] = [];
    const sourceDimensions: SourceDimensions = {
      srcWidth: 1920, 
      srcHeight: 1080,
    };
    expect(findSettingsResolutionBoundaries(testSizes, sourceDimensions)).toBe(
      0
    );
  });
  // test('with no multiplier', () => {
  //   const testSizes: OutputSettings[] = [
  //     { width: 1920 },
  //     { height: 1080 },
  //     { width: 2560, height: 1440 },
  //   ];
  //   expect(findSizesBoundaries(testSizes)).toBe(0);
  // });
  // test('with one width multiplier', () => {
  //   const testSizes: OutputSettings[] = [
  //     { width: 'x1' },
  //     { height: 1080 },
  //     { width: 2560, height: 1440 },
  //   ];
  //   expect(findSizesBoundaries(testSizes)).toBe(1);
  // });
  // test('with one width and one height multiplier', () => {
  //   const testSizes: OutputSettings[] = [
  //     { width: 'x1' },
  //     { height: 'x2' },
  //     { width: 2560, height: 1440 },
  //   ];
  //   expect(findSizesBoundaries(testSizes)).toBe(2);
  // });
  // test('with many multipliers', () => {
  //   const testSizes: OutputSettings[] = [
  //     { width: 'x1' },
  //     { height: 'x2' },
  //     { width: 'x3', height: 'x4' },
  //     { width: 'x1', height: 'x1' },
  //     { width: 'x5', height: 'x5' },
  //     { width: 2560, height: 1440 },
  //   ];
  //   expect(findSizesBoundaries(testSizes)).toBe(5);
  // });
});

/*

describe('check calcResolutionMultiplier', () => {
  test('with no required multiplier', () => {
    expect(calcResolutionMultiplier(1024, 1, undefined)).toStrictEqual(
      undefined
    );
  });
  test('with required multiplier x2', () => {
    expect(calcResolutionMultiplier(1024, 1, 2)).toStrictEqual(2048);
  });
  test('with required multiplier x3', () => {
    expect(calcResolutionMultiplier(1024, 2, 3)).toStrictEqual(1536);
  });
});

// describe('check calcResizeByMultipliers', () => {
//   test('with no arguments', () => {
//     expect(() => calcResizeByMultipliers()).toThrow(
//       'Width or height required.'
//     );
//   });
//   test('with srcMultiplier and no srcWidth and srcHeight', () => {
//     expect(() =>
//       calcResizeByMultipliers(2, 1024, undefined, 1024, 768)
//     ).toThrow("Source's width or height is undefined.");
//     expect(() => calcResizeByMultipliers(2, undefined, 768, 1024, 768)).toThrow(
//       "Source's width or height is undefined."
//     );
//   });
//   test('with proper values', () => {
//     expect(calcResizeByMultipliers(2, 2048, 1536, 1024, 768)).toStrictEqual({
//       width: 1024,
//       height: 768,
//     });
//     expect(calcResizeByMultipliers(2, 2048, 1536, 1024)).toStrictEqual({
//       width: 1024,
//       height: undefined,
//     });
//     expect(
//       calcResizeByMultipliers(2, 2048, 1536, undefined, 768)
//     ).toStrictEqual({
//       width: undefined,
//       height: 768,
//     });
//     expect(calcResizeByMultipliers(2, 2048, 1536, 'x1', 'x1')).toStrictEqual({
//       width: 1024,
//       height: 768,
//     });
//     expect(calcResizeByMultipliers(2, 2048, 1536, 'x2', 'x2')).toStrictEqual({
//       width: 2048,
//       height: 1536,
//     });
//   });
// });

describe('check resolveOutputSettings', () => {
  test('1', () => {
    const settings: OutputSettings[] = [
      { width: 200, suffix: 'x1' },
      { width: 400, suffix: 'x2' },
      { width: 'x3', suffix: 'x3' },
      { width: 'x4', suffix: 'x4' },
    ];
    const srcMeta: Metadata = {
      width: 800,
      height: 400,
      chromaSubsampling: 'abc',
    };
    const srcMultiplier = 4;
    resolveOutputSettings(settings, srcMeta, srcMultiplier);
  });
});

describe('check getSourceMultiplier', () => {
  test('with no arguments', () => {
    //@ts-expect-error readonly property
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'upscale';
    expect(retrieveSourceMultiplier()).toStrictEqual(1);
    //@ts-expect-error readonly property
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'x2';
    expect(retrieveSourceMultiplier()).toStrictEqual(2);
    //@ts-expect-error readonly property
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'downsample';
    expect(() => retrieveSourceMultiplier()).toThrow(
      'Max multiplier is not a number!'
    );
    //@ts-expect-error readonly property
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'incorrect';
    expect(() => retrieveSourceMultiplier()).toThrow(
      'Source multiplier behavior sourceMultiplierBehavior not correct.'
    );
  });
  test('with parameters', () => {
    expect(retrieveSourceMultiplier(undefined, 'x3')).toStrictEqual(3);
    expect(retrieveSourceMultiplier(2, 'downsample')).toStrictEqual(2);
    expect(() => retrieveSourceMultiplier(0, 'downsample')).toThrow(
      'Max multiplier out of bounds.'
    );
    expect(retrieveSourceMultiplier(undefined, 'upscale')).toStrictEqual(1);
    //@ts-expect-error incorrect argument
    expect(() => retrieveSourceMultiplier(undefined, 'incorrect')).toThrow(
      'Source multiplier behavior sourceMultiplierBehavior not correct.'
    );
    //@ts-expect-error readonly property
    ImageResizeConfig.SOURCE_MULTIPLIER_BEHAVIOR = 'incorrect';
    expect(() => retrieveSourceMultiplier()).toThrow(
      'Source multiplier behavior sourceMultiplierBehavior not correct.'
    );
  });
});
