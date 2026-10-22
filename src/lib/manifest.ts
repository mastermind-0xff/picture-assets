import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ResolvedOptions } from '../config/options.js';
import { isPlainObject } from '../config/validate.js';
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
}

/** What a source gave, and what it was when it gave it. */
export interface ManifestEntry {
  /** Size in bytes and modification time of the source when processed. */
  readonly bytes: number;
  readonly mtimeMs: number;
  /**
   * Hash of everything that decides the files: settings, formats and their
   * options, output path, suffix, resize strategy, upscaling.
   */
  readonly hash: string;
  /** Size of the source, as shown. */
  readonly width?: number;
  readonly height?: number;
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

/** Hash of what decides a source's files, see `ManifestEntry.hash`. */
export const targetHash = (
  manifestFile: string,
  target: SourceTarget,
  settings: readonly OutputSetting[],
  {
    suffix,
    resizeStrategyHint,
    upscale,
  }: Pick<ResolvedOptions, 'suffix' | 'resizeStrategyHint' | 'upscale'>
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
      })
    )
    .digest('hex')
    .slice(0, 16);

/**
 * Reads a manifest.
 *
 * @returns The manifest, or undefined when there is none; `problem` tells
 * why a file that exists can't be used (then the run processes everything).
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
