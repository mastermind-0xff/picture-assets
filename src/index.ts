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
export { generateSingleSourceAssets } from './lib/generate-single-source-assets.js';
export {
  generateBatchAssets,
  computeConcurrency,
} from './lib/generate-batch-assets.js';
export type { BatchSource } from './lib/sources.js';

export { DEFAULT_OPTIONS, resolveOptions } from './config/options.js';
export {
  ENV_VARIABLES,
  readEnvOptions,
  type EnvOptions,
} from './config/env.js';
export {
  canWriteFormat,
  DEFAULT_FORMAT_OPTIONS,
  INPUT_EXTENSIONS,
  OUTPUT_FORMATS,
} from './image/formats.js';
export { parseSuffix, type SuffixData } from './image/suffix.js';
export { createLogger, type AssetsLogger } from './log/logger.js';
export { ResultBatchError, ResultSourceError } from './errors/result-errors.js';
export { HookError } from './errors/hook-error.js';
export { HOOK_POINTS } from './config/validate.js';

export type {
  FormatHookContext,
  Hook,
  HookContext,
  HookPoint,
  HookResult,
  HookReturn,
  HookSetting,
  RawImage,
  SizeHookContext,
} from './types/hooks.js';

export type {
  AbortScope,
  BatchAssetsOptions,
  Concurrency,
  AssetsOptions,
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
