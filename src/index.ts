export {
  CONFIG_KEYS,
  DEFAULT_FORMATS,
  DEFAULT_SIZES,
  generateAssets,
  planAssets,
  type AssetsConfig,
  type AssetsPlan,
  type PlannedSize,
  type PlannedSource,
} from './lib/generate-assets.js';
export {
  MANIFEST_VERSION,
  readManifest,
  type Manifest,
  type ManifestEntry,
  type ManifestOutput,
} from './lib/manifest.js';
export {
  expandFormats,
  expandSizes,
  FORMAT_PRESETS,
  SIZE_PRESETS,
  type FormatPreset,
  type FormatsInput,
  type SizePreset,
  type SizesInput,
} from './config/presets.js';
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
  FormatSelector,
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
