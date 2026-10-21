import { logMessage } from '../log/logger';
import { OutputFormatsOptions } from '../types/output';
import { LOG_LEVEL } from './logging';

export const outputFormatsOptionsDefault = {
  avif: { quality: 80 },
  gif: { colors: 256 },
  heif: { quality: 80 },
  jpeg: { quality: 80 },
  jpg: { quality: 80 },
  jp2: { quality: 80 },
  jxl: { quality: 80 },
  png: { quality: 100 },
  tiff: { quality: 100 },
  tif: { quality: 100 },
  webp: { quality: 80 },
  dz: {},
  fits: {},
  input: {},
  magick: {},
  openslide: {},
  pdf: {},
  ppm: {},
  raw: {},
  svg: {},
  v: {},
  dcraw: {},
  exr: {},
  rad: {},
} as const satisfies OutputFormatsOptions;

export const outputFormatsOptions: OutputFormatsOptions = (() => {
  const envValue = process?.env?.IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS;
  let json: Record<string, unknown> = {};

  if (envValue != null) {
    try {
      json = JSON.parse(envValue);
      //TODO better, deeper 'type:options' check for the entire object.
      if (typeof json !== 'object') {
        logMessage(
          'warning',
          'Using defaults.',
          'Unknown config for IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS',
          LOG_LEVEL
        );
        json = {};
      }
    } catch (e) {
      logMessage(
        'error',
        { IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS: envValue, e },
        `Unable to parse IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS json.`,
        LOG_LEVEL
      );
    }
  }

  return {
    ...outputFormatsOptionsDefault,
    ...json,
  };
})();
