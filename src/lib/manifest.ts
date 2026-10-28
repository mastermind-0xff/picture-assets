import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ResolvedOptions } from '../config/options.js';
import { HOOK_POINTS, isPlainObject } from '../config/validate.js';
import type { Hook, HookData } from '../types/hooks.js';
import type {
  OutputFormat,
  OutputSetting,
  ResultSource,
} from '../types/output.js';
import type { SourceTarget } from './generate-single-source-assets.js';

/** Version of the manifest's shape: a manifest of another is ignored. */
export const MANIFEST_VERSION = 1;

/** A file written for a source. */
export interface ManifestOutput {
  /** Path relative to the manifest's directory, with `/`. */
  readonly file: string;
  readonly format: OutputFormat;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  /** What hooks recorded for the file, see `ResultFormat.data`. */
  readonly data?: HookData;
}

/** What a source gave, and what it was when it gave it. */
export interface ManifestEntry {
  /** Size in bytes and modification time of the source when processed. */
  readonly bytes: number;
  readonly mtimeMs: number;
  /**
   * Hash of everything that decides the files: settings, formats and their
   * options, output path, suffix, resize strategy, upscaling,
   * `removeOpaqueAlpha`, and the hooks' names and keys (their code without
   * a key).
   */
  readonly hash: string;
  /** Size of the source, as shown. */
  readonly width?: number;
  readonly height?: number;
  /**
   * What the source's hooks recorded, see `ResultSource.data`. Kept while
   * the source is unchanged: its hooks don't run again.
   */
  readonly data?: HookData;
  readonly outputs: readonly ManifestOutput[];
}

/**
 * The manifest of a run: every source that succeeded or was unchanged, by
 * its path relative to the manifest's directory, with `/`. Frameworks and
 * templates can read it to write `<picture>` and `srcset`.
 */
export interface Manifest {
  readonly version: typeof MANIFEST_VERSION;
  readonly sources: Readonly<Record<string, ManifestEntry>>;
}

/** A path as the manifest has it: relative to its directory, with `/`. */
export const manifestPath = (manifestFile: string, file: string) =>
  path
    .relative(path.dirname(path.resolve(manifestFile)), path.resolve(file))
    .split(path.sep)
    .join('/');

/** JSON with sorted keys: equal values give the same text. */
const stableStringify = (value: unknown) =>
  JSON.stringify(value, (_key, nested: unknown) =>
    isPlainObject(nested) ?
      Object.fromEntries(
        Object.entries(nested).sort(([a], [b]) =>
          a < b ? -1
          : a > b ? 1
          : 0
        )
      )
    : nested
  );

/**
 * What of a hook decides the files: its name, and its key, or without one
 * its code, so an edit remakes the sources. Settings a function closes over
 * (a factory's) and external models aren't in its code: they need a key.
 */
const hookIdentity = (hook: Hook) => ({
  name: hook.name,
  ...(hook.key !== undefined ?
    { key: hook.key }
  : { code: HOOK_POINTS.map((point) => hook[point]?.toString() ?? '') }),
});

/** Hash of what decides a source's files, see `ManifestEntry.hash`. */
export const targetHash = (
  manifestFile: string,
  target: SourceTarget,
  settings: readonly OutputSetting[],
  {
    suffix,
    resizeStrategyHint,
    upscale,
    hooks,
    removeOpaqueAlpha,
  }: Pick<
    ResolvedOptions,
    'suffix' | 'resizeStrategyHint' | 'upscale' | 'hooks' | 'removeOpaqueAlpha'
  >
) =>
  createHash('sha256')
    .update(
      stableStringify({
        version: MANIFEST_VERSION,
        outputPath: manifestPath(manifestFile, target.outputPath),
        encoders: target.encoders,
        settings,
        suffix,
        resizeStrategyHint,
        upscale,
        // left out without hooks: their hashes stay those of earlier runs
        ...(hooks.all.length > 0 && { hooks: hooks.all.map(hookIdentity) }),
        // the same, left out when off: its default
        ...(removeOpaqueAlpha && { removeOpaqueAlpha }),
      })
    )
    .digest('hex')
    .slice(0, 16);

/**
 * Reads a manifest.
 *
 * @returns `{ manifest }`; `{}` when there is no file; `{ problem }` when
 * the file can't be used (not JSON, or another version): a run then
 * processes every source.
 * @throws When the file exists but can't be read.
 */
export const readManifest = async (
  manifestFile: string
): Promise<{ manifest?: Manifest; problem?: string }> => {
  let text: string;
  try {
    text = await fs.readFile(manifestFile, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
  try {
    const manifest: unknown = JSON.parse(text);
    if (
      isPlainObject(manifest) &&
      manifest.version === MANIFEST_VERSION &&
      isPlainObject(manifest.sources)
    )
      return { manifest: manifest as unknown as Manifest };
    return { problem: `not a version ${MANIFEST_VERSION} manifest` };
  } catch {
    return { problem: 'not valid JSON' };
  }
};

/**
 * Whether a source can be skipped: the same file (size and modification
 * time), the same hash, and every output still there.
 */
export const isUnchanged = async (
  manifestFile: string,
  entry: ManifestEntry | undefined,
  stats: { size: number; mtimeMs: number },
  hash: string
): Promise<boolean> => {
  if (
    entry?.bytes !== stats.size ||
    entry.mtimeMs !== stats.mtimeMs ||
    entry.hash !== hash
  )
    return false;
  const directory = path.dirname(path.resolve(manifestFile));
  try {
    await Promise.all(
      entry.outputs.map((output) =>
        fs.access(path.join(directory, output.file))
      )
    );
    return true;
  } catch {
    return false;
  }
};

/** The entry of a source that succeeded. */
export const manifestEntry = (
  manifestFile: string,
  result: ResultSource,
  stats: { size: number; mtimeMs: number },
  hash: string
): ManifestEntry => ({
  bytes: stats.size,
  mtimeMs: stats.mtimeMs,
  hash,
  ...(result.width !== undefined && { width: result.width }),
  ...(result.height !== undefined && { height: result.height }),
  ...(result.data && { data: result.data }),
  outputs: result.outputsBySetting.flatMap(({ files }) =>
    files.flatMap((file) =>
      file.status === 'succeed' ?
        [
          {
            file: manifestPath(manifestFile, file.file),
            format: file.format,
            width: file.fileData.width,
            height: file.fileData.height,
            bytes: file.fileData.size,
            ...(file.data && { data: file.data }),
          },
        ]
      : []
    )
  ),
});

/** Writes a manifest: to a temporary file first, so it is never half written. */
export const writeManifest = async (
  manifestFile: string,
  manifest: Manifest
) => {
  await fs.mkdir(path.dirname(path.resolve(manifestFile)), { recursive: true });
  const temporary = `${manifestFile}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.rename(temporary, manifestFile);
};
