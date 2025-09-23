//import { ImageResizeConfig } from './main';

describe('Check ImageResizeConfig and process.env', () => {
  const env_old = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env_old };
  });

  afterAll(() => {
    process.env = env_old;
  });

  test('with no process.env vars.', () => {
    process.env.IMAGE_RESIZE_SUFFIX_DEFAULT = undefined;
    process.env.SIZE_MULTIPLIER_BEHAVIOR = undefined;

    const ImageResizeConfig = require('./main').ImageResizeConfig;

    expect(ImageResizeConfig.SUFFIX_DEFAULT).toStrictEqual('@{w}w');
    expect(ImageResizeConfig.SIZE_MULTIPLIER_BEHAVIOR).toStrictEqual(
      'downsample'
    );
  });

  test('with valid process.env.', () => {
    process.env.IMAGE_RESIZE_SUFFIX_DEFAULT = '@{h}h';
    process.env.SIZE_MULTIPLIER_BEHAVIOR = 'x1';

    const ImageResizeConfig = require('./main').ImageResizeConfig;

    expect(ImageResizeConfig.SUFFIX_DEFAULT).toStrictEqual('@{h}h');
    expect(ImageResizeConfig.SIZE_MULTIPLIER_BEHAVIOR).toStrictEqual('x1');
  });

  test('with valid, restricted process.env.', () => {
    process.env.IMAGE_RESIZE_SUFFIX_DEFAULT = '/@{h}h/\\';
    process.env.SIZE_MULTIPLIER_BEHAVIOR = 'upscale';

    const ImageResizeConfig = require('./main').ImageResizeConfig;

    expect(ImageResizeConfig.SUFFIX_DEFAULT).toStrictEqual('@{h}h');
    expect(ImageResizeConfig.SIZE_MULTIPLIER_BEHAVIOR).toStrictEqual('upscale');
  });

  test('with invalid process.env.', () => {
    process.env.IMAGE_RESIZE_SUFFIX_DEFAULT = '*abc';
    process.env.SIZE_MULTIPLIER_BEHAVIOR = '*abc';

    const ImageResizeConfig = require('./main').ImageResizeConfig;

    expect(ImageResizeConfig.SUFFIX_DEFAULT).toStrictEqual('*abc');
    expect(ImageResizeConfig.SIZE_MULTIPLIER_BEHAVIOR).toStrictEqual(
      'downsample'
    );
  });
});
