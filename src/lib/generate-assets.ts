import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { resolveConcurrency, resolveOptions } from '../config/options.js';
import {
  expandFormats,
  expandSizes,
  isSizePreset,
  type FormatsInput,
  type SizesInput,
} from '../config/presets.js';
import {
  createEncoders,
  describe,
  isPlainObject,
  parseBoolean,
  parseFormats,
} from '../config/validate.js';
import { ResultBatchError } from '../errors/result-errors.js';
import {
  planSource,
  plannedIdentifier,
  readSourceInfo,
} from '../image/output.js';
import type { Concurrency, AssetsOptions } from '../types/options.js';
import type { ResultBatch } from '../types/output.js';
import { displayPath } from '../utils/helpers.js';
import { planTargets, runBatch } from './generate-batch-assets.js';
import { assertPath } from './generate-single-source-assets.js';
import {
  isUnchanged,
  manifestEntry,
  manifestPath,
  MANIFEST_VERSION,
  readManifest,
  targetHash,
  writeManifest,
  type Manifest,
  type ManifestEntry,
} from './manifest.js';
import { findSources, type FoundSource } from './sources.js';

/**
 * Everything `generateAssets` needs, as plain data: the same shape in code,
 * in a config file and from the command line. Only `input` and `output` are
 * required.
 */
export interface AssetsConfig extends AssetsOptions {
  /**
   * Source images: a file, a directory (every image below it) or a glob, or
   * a list of them. The tree below each one's root is mirrored in `output`.
   */
  readonly input: string | readonly string[];
  /** Destination directory. */
  readonly output: string;
  /**
   * The preset `'responsive'`, or widths in pixels, multipliers (`'x2'`)
   * and settings. Default: `'responsive'`.
   */
  readonly sizes?: SizesInput;
  /**
   * A preset (`'web'`, `'modern'`, `'lossless'`), or formats as
   * `generateSingleSourceAssets` takes them. Default: `'web'`: AVIF, WebP,
   * and JPEG or PNG.
   */
  readonly formats?: FormatsInput;
  /**
   * Whether sizes larger than the source are made, see `AssetsOptions`.
   * Default: `false` with a sizes preset (or no sizes), `true` otherwise.
   */
  readonly upscale?: boolean;
  /** Sources at the same time, see `BatchAssetsOptions`. */
  readonly concurrency?: Concurrency;
  /**
   * A JSON file listing every source and its files, written after each run.
   * It makes runs incremental: a source unchanged since (same file, same
   * options, files still there) is `'skipped'`.
   */
  readonly manifest?: string;
  /** Processes every source, even unchanged ones. Default: `false`. */
  readonly force?: boolean;
  /** Stops the run when aborted, see `BatchAssetsOptions`. */
  readonly signal?: AbortSignal;
}

/** Keys of `AssetsConfig`: others are rejected, as typos. */
export const CONFIG_KEYS = [
  'input',
  'output',
  'sizes',
  'formats',
  'suffix',
  'resizeStrategyHint',
  'formatOptions',
  'abortScope',
  'logger',
  'upscale',
  'concurrency',
  'manifest',
  'force',
  'signal',
  'hooks',
] as const satisfies readonly (keyof AssetsConfig)[];

/** Defaults of `sizes` and `formats`. */
export const DEFAULT_SIZES = 'responsive' satisfies SizesInput;
export const DEFAULT_FORMATS = 'web' satisfies FormatsInput;

const toInputs = (input: unknown): string[] => {
  const inputs: unknown[] = Array.isArray(input) ? input : [input];
  if (inputs.length === 0)
    throw new TypeError(
      'Input must name at least one file, directory or glob.'
    );
  return inputs.map((value) => assertPath('Input', value));
};

/** Checks a config and finds its sources. */
const prepare = async (config: unknown) => {
  if (!isPlainObject(config))
    throw new TypeError(`Config must be an object, got ${describe(config)}.`);
  const unknownKeys = Object.keys(config).filter(
    (key) => !(CONFIG_KEYS as readonly string[]).includes(key)
  );
  if (unknownKeys.length > 0)
    throw new TypeError(
      `Unknown option${unknownKeys.length > 1 ? 's' : ''} ${unknownKeys.map(describe).join(', ')}: expected ${CONFIG_KEYS.join(', ')}.`
    );
  const {
    input,
    output,
    sizes,
    formats,
    concurrency,
    manifest,
    force,
    signal,
    upscale,
    ...imageOptions
  } = config as unknown as AssetsConfig;

  const inputs = toInputs(input);
  const destRoot = assertPath('Output', output);
  const settings = expandSizes(sizes ?? DEFAULT_SIZES);
  const formatsMap = parseFormats(expandFormats(formats ?? DEFAULT_FORMATS));
  const options = resolveOptions({
    ...imageOptions,
    // presets are made for any source: don't enlarge small ones
    upscale: upscale ?? !(sizes === undefined || isSizePreset(sizes)),
  });
  // invalid format options fail before any source is searched
  createEncoders(formatsMap, options.formatOptions);
  if (signal !== undefined && !(signal instanceof AbortSignal))
    throw new TypeError(
      `Signal must be an AbortSignal, got ${describe(signal)}.`
    );

  // every input's sources, each file once
  const seen = new Set<string>();
  const sources: FoundSource[] = [];
  for (const found of await Promise.all(
    inputs.map((each) => findSources(each, destRoot))
  ))
    for (const source of found.sources) {
      const key = path.resolve(source.path);
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push(source);
    }

  return {
    sources,
    destRoot,
    settings,
    formats: formatsMap,
    options,
    concurrency: resolveConcurrency(concurrency),
    inputName: inputs.join(', '),
    signal,
    manifest:
      manifest === undefined ? undefined : assertPath('Manifest', manifest),
    force: parseBoolean('force', force ?? false),
  };
};

type Prepared = Awaited<ReturnType<typeof prepare>>;

/** Reads the manifest of a run, or none (with a warning when unusable). */
const loadManifest = async ({ manifest, options }: Prepared) => {
  if (manifest === undefined) return undefined;
  const { manifest: previous, problem } = await readManifest(manifest);
  if (problem !== undefined)
    options.logger.warning(
      `Ignoring the manifest ${displayPath(manifest)}: ${problem}. Every source is processed.`
    );
  else
    options.logger.debug(
      previous ?
        `Manifest read: ${displayPath(manifest)}, ${Object.keys(previous.sources).length} source(s)`
      : `No manifest at ${displayPath(manifest)} yet: every source is processed.`
    );
  return previous;
};

/**
 * Turns images into web assets with one config: every size and format of
 * every source, the tree below each input mirrored in `output`. With no
 * more than `input` and `output`, the sizes of a responsive srcset (never
 * enlarged) in AVIF, WebP and JPEG (PNG for transparent sources).
 *
 * ```ts
 * await generateAssets({ input: 'src/images', output: 'public/img' });
 * ```
 *
 * With a `manifest`, runs are incremental: unchanged sources are skipped.
 *
 * @returns The result of every source, in input order then path order.
 * @throws `TypeError | RangeError` for an invalid config, before any work.
 * @throws `ResultBatchError` with `abortScope: 'batch'` when a source fails.
 */
export const generateAssets = async (
  config: AssetsConfig
): Promise<ResultBatch> => {
  const prepared = await prepare(config);
  const { manifest, settings, options, force } = prepared;
  const previous = await loadManifest(prepared);

  // state of each source when it was checked: what its entry will record
  const states = new Map<
    string,
    { size: number; mtimeMs: number; hash: string }
  >();
  const skip =
    manifest === undefined ? undefined : (
      async (source: FoundSource, target: Parameters<typeof targetHash>[1]) => {
        try {
          const { size, mtimeMs } = await fs.stat(source.path);
          const hash = targetHash(manifest, target, settings, options);
          states.set(source.path, { size, mtimeMs, hash });
          if (force) return false;
          const entry = previous?.sources[manifestPath(manifest, source.path)];
          return await isUnchanged(manifest, entry, { size, mtimeMs }, hash);
        } catch {
          // unreadable: processing it will tell why
          return false;
        }
      }
    );

  const write = async (batch: ResultBatch) => {
    if (manifest === undefined) return;
    const entries: Record<string, ManifestEntry> = {};
    for (const result of batch.sources) {
      const key = manifestPath(manifest, result.source);
      const state = states.get(result.source);
      const kept = previous?.sources[key];
      if (result.status === 'skipped' && kept) entries[key] = kept;
      else if (result.status === 'succeed' && state)
        entries[key] = manifestEntry(manifest, result, state, state.hash);
    }
    const next: Manifest = { version: MANIFEST_VERSION, sources: entries };
    await writeManifest(manifest, next);
    options.logger.info(
      `Manifest written: ${displayPath(manifest)}, ${Object.keys(entries).length} source(s)`
    );
  };

  try {
    const { batch } = await runBatch({ ...prepared, skip });
    await write(batch);
    return batch;
  } catch (error) {
    // what succeeded before a fail fast stop is kept
    if (error instanceof ResultBatchError) await write(error.resultBatch);
    throw error;
  }
};

/** A size of a planned source. */
export interface PlannedSize {
  /** Planned width x height. */
  readonly size: string;
  /** `'skipped'`: larger than the source, with `upscale: false`. */
  readonly status: 'planned' | 'skipped';
  readonly files: readonly string[];
}

/** What a source would give. */
export interface PlannedSource {
  readonly source: string;
  /**
   * - `'planned'`: its sizes would be made.
   * - `'unchanged'`: it would be skipped, see `manifest`.
   * - `'failed'`: it can't be: `error` tells why.
   */
  readonly status: 'planned' | 'unchanged' | 'failed';
  readonly width?: number;
  readonly height?: number;
  readonly sizes: readonly PlannedSize[];
  readonly error?: unknown;
}

/** What a run would do, see `planAssets`. */
export interface AssetsPlan {
  readonly sources: readonly PlannedSource[];
  /** Files that would be written. */
  readonly files: number;
  /**
   * Names of the hooks the run would apply and the plan doesn't: what they
   * change (a source's size, a size's size, transparency and with it
   * `'fallback'`) is not in the plan.
   */
  readonly hooksNotRun: readonly string[];
}

/**
 * What `generateAssets` would do with a config, without writing anything:
 * the sources, their sizes resolved to pixels (multipliers included) and
 * their files. Sources are read for their size, not resized, and no hook
 * runs: sizes are planned from the sources as read, even where hooks would
 * change them. The plan lists those hooks (`hooksNotRun`) and logs a
 * warning.
 *
 * @throws `TypeError | RangeError` for an invalid config.
 */
export const planAssets = async (config: AssetsConfig): Promise<AssetsPlan> => {
  const prepared = await prepare(config);
  const { sources, destRoot, settings, formats, options, manifest, force } =
    prepared;
  const hooksNotRun = options.hooks.all.map(({ name }) => name);
  if (hooksNotRun.length > 0)
    options.logger.warning(
      `The plan doesn't run the hooks (${hooksNotRun.join(', ')}): sizes, file names and formats are planned from the sources as read, and the run's can differ.`
    );
  const previous = await loadManifest(prepared);
  const { targets, errors } = planTargets(
    sources,
    destRoot,
    formats,
    options.formatOptions
  );

  const planned: PlannedSource[] = [];
  for (const [index, { path: source }] of sources.entries()) {
    const target = targets[index];
    if (target === undefined) {
      planned.push({
        source,
        status: 'failed',
        sizes: [],
        error: errors[index],
      });
      continue;
    }
    try {
      if (manifest !== undefined && !force) {
        const { size, mtimeMs } = await fs.stat(source);
        const hash = targetHash(manifest, target, settings, options);
        const entry = previous?.sources[manifestPath(manifest, source)];
        if (await isUnchanged(manifest, entry, { size, mtimeMs }, hash)) {
          planned.push({ source, status: 'unchanged', sizes: [] });
          continue;
        }
      }
      const plan = planSource(
        await readSourceInfo(
          sharp(await fs.readFile(source), { autoOrient: true })
        ),
        settings,
        target.encoders,
        options
      );
      planned.push({
        source,
        status: 'planned',
        width: plan.width,
        height: plan.height,
        sizes: plan.settings.map((setting) => {
          const identifier = plannedIdentifier(
            target.outputPath,
            setting,
            options.suffix
          );
          return {
            size: `${setting.width}x${setting.height}`,
            status: setting.skipped ? 'skipped' : 'planned',
            files:
              setting.skipped ?
                []
              : plan.encoders.map(({ format }) => `${identifier}.${format}`),
          };
        }),
      });
    } catch (error) {
      planned.push({ source, status: 'failed', sizes: [], error });
    }
  }

  return {
    sources: planned,
    files: planned.reduce(
      (sum, { sizes }) =>
        sum + sizes.reduce((count, { files }) => count + files.length, 0),
      0
    ),
    hooksNotRun,
  };
};
