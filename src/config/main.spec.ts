import { outputFormatsOptionsDefault } from './main';

describe('Check ImageResizeConfig and process.env', () => {
  const envOrg = process.env;
  const logMessageMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../log/logger', () => ({
      ...jest.requireActual('../log/logger'),
      logMessage: logMessageMock,
    }));
    process.env = { ...envOrg };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    process.env = envOrg;
  });

  test('with no process.env vars.', () => {
    process.env.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS = undefined;
    process.env.IMAGE_RESIZE_SUFFIX = undefined;
    process.env.IMAGE_RESIZE_RESIZE_STRATEGY_HINT = undefined;
    process.env.IMAGE_RESIZE_LOG_LEVEL = undefined;
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.outputFormatsOptions).toStrictEqual(
      outputFormatsOptionsDefault
    );
    expect(ImageResizeConfig.suffix).toStrictEqual('@{w}w');
    expect(ImageResizeConfig.resizeStrategyHint).toStrictEqual('downsample');
    expect(ImageResizeConfig.logLevel).toStrictEqual('info');
  });

  test('check outputFormatsOptions - valid.', () => {
    process.env.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS =
      '{"jpg":{"quality":80,"progressive":true,"chromaSubsampling":"4:4:4"},"png":{"quality":100,"colors":128}}';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.outputFormatsOptions).toStrictEqual({
      ...outputFormatsOptionsDefault,
      ...JSON.parse(process.env.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS),
    });
  });

  test('check outputFormatsOptions - invalid - not an object.', () => {
    process.env.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS = '123';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.outputFormatsOptions).toStrictEqual({
      ...outputFormatsOptionsDefault,
    });
    expect(logMessageMock).toHaveBeenCalledWith(
      'warning',
      'Using defaults.',
      'Unknown config for IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS',
      'info'
    );
  });

  test('check outputFormatsOptions - invalid - not a json.', () => {
    process.env.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS = '{noQuotes:123}';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.outputFormatsOptions).toStrictEqual({
      ...outputFormatsOptionsDefault,
    });
    expect(logMessageMock).toHaveBeenCalledWith(
      'error',
      {
        IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS: '{noQuotes:123}',
        e: expect.anything(),
      },
      'Unable to parse IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS json.',
      'info'
    );
  });

  test('check suffix - valid.', () => {
    process.env.IMAGE_RESIZE_SUFFIX = '\\x{sm}_{w}w/';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.suffix).toStrictEqual('x{sm}_{w}w');
  });

  test('check suffix - valid 2.', () => {
    process.env.IMAGE_RESIZE_SUFFIX = '123';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.suffix).toStrictEqual('123');
  });

  test('check resizeStrategyHint - valid.', () => {
    process.env.IMAGE_RESIZE_RESIZE_STRATEGY_HINT =
      '{"width":100, "height":200, "abc":123}';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.resizeStrategyHint).toStrictEqual({
      width: 100,
      height: 200,
    });
  });

  test('check resizeStrategyHint - not full.', () => {
    process.env.IMAGE_RESIZE_RESIZE_STRATEGY_HINT = '{"width":100, "abc":123}';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.resizeStrategyHint).toStrictEqual('downsample');
    expect(logMessageMock).toHaveBeenCalledWith(
      'warning',
      `Defaulting to 'downsample'.`,
      'Unknown config for RESIZE_STRATEGY_HINT',
      'info'
    );
  });

  test('check resizeStrategyHint - invalid.', () => {
    process.env.IMAGE_RESIZE_RESIZE_STRATEGY_HINT = '{width:100}';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.resizeStrategyHint).toStrictEqual('downsample');
    expect(logMessageMock).toHaveBeenNthCalledWith(
      1,
      'error',
      { hint: '{width:100}', e: expect.anything() },
      `Unable to parse RESIZE_STRATEGY_HINT json.`,
      'info'
    );
    expect(logMessageMock).toHaveBeenNthCalledWith(
      2,
      'warning',
      `Defaulting to 'downsample'.`,
      'Unknown config for RESIZE_STRATEGY_HINT',
      'info'
    );
  });

  test('check logLevel - valid.', () => {
    process.env.IMAGE_RESIZE_LOG_LEVEL = 'silent';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.logLevel).toStrictEqual('silent');
  });

  test('check logLevel - valid 2.', () => {
    process.env.IMAGE_RESIZE_LOG_LEVEL = 'debug';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.logLevel).toStrictEqual('debug');
  });

  test('check logLevel - invalid.', () => {
    process.env.IMAGE_RESIZE_LOG_LEVEL = 'wrong_value';
    const ImageResizeConfig = require('./main').ImageResizeConfig;
    expect(ImageResizeConfig.logLevel).toStrictEqual('info');
  });
});
