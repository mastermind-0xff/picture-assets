export { imageResize } from './lib/image-resize.js';
export {
  batchImageResize,
  computeConcurrency,
} from './lib/batch-image-resize.js';
export type { BatchSource } from './lib/sources.js';

export { DEFAULT_OPTIONS, resolveOptions } from './config/options.js';
export { ENV_VARIABLES, readEnvOptions } from './config/env.js';
export {
  canWriteFormat,
  DEFAULT_FORMAT_OPTIONS,
  INPUT_EXTENSIONS,
  OUTPUT_FORMATS,
} from './image/formats.js';
export { parseSuffix, type SuffixData } from './image/suffix.js';
export { createLogger, type ImageAssetsLogger } from './log/logger.js';
export {
  ResultBatchError,
  ResultSourceError,
} from './errors/image-resize-errors.js';

export type {
  AbortScope,
  BatchImageResizeOptions,
  Concurrency,
  ImageResizeOptions,
} from './types/options.js';
export type {
  OutputFormat,
  OutputFormats,
  OutputFormatsOptions,
  OutputSetting,
  ResultBatch,
  ResultFormat,
  ResultSetting,
  ResultSource,
  ResultStatus,
} from './types/output.js';
export type {
  ResizeResolution,
  ResizeStrategyHint,
  SizeMultiplier,
} from './types/size.js';
