import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, isPlainObject } from '../config/validate.js';
import { isInputFile } from '../image/formats.js';
import { fileSystemKey } from '../utils/helpers.js';

/**
 * Sources of a batch:
 * - a file: `'photos/hero.jpg'`;
 * - a directory: every image in it and its subdirectories;
 * - a glob: `'photos/**\/*.jpg'`, `'photos/*.{jpg,png}'`;
 * - a root and a pattern inside it: `{ root: 'photos', pattern: '**\/*' }`.
 *
 * The directory tree below the root (the directory, the part of the glob
 * before its first wildcard, or `root`) is mirrored in the destination.
 */
export type BatchSource =
  string | { readonly root: string; readonly pattern: string };

/** A source file found for a batch. */
export interface FoundSource {
  /** Path of the file: the root joined with its path inside the root. */
  readonly path: string;
  /** Directory of the file relative to the root, mirrored in the destination. */
  readonly relativeDir: string;
}

const GLOB_MAGIC = /[*?[\]{}()!]/;

/**
 * Splits a glob at its first segment with a wildcard: the static root and the
 * pattern inside it. `'photos/**\/*.jpg'` gives `photos` and `'**\/*.jpg'`.
 * Backslashes are separators on Windows only: elsewhere they escape.
 */
export const splitGlob = (glob: string): { root: string; pattern: string } => {
  const normalized =
    process.platform === 'win32' ? glob.replaceAll('\\', '/') : glob;
  const segments = normalized.split('/');
  const magicIndex = segments.findIndex((segment) => GLOB_MAGIC.test(segment));
  const index = magicIndex === -1 ? segments.length - 1 : magicIndex;
  let root = segments.slice(0, index).join('/');
  // keep filesystem roots: '/**' is '/', 'C:/**' is 'C:/'
  if (root === '' && normalized.startsWith('/')) root = '/';
  else if (/^[a-z]:$/i.test(root)) root += '/';
  return {
    root: root === '' ? '.' : root,
    pattern: segments.slice(index).join('/'),
  };
};

/** Checks the batch's `srcPath` argument. */
export const assertBatchSource = (value: unknown): BatchSource => {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (
    isPlainObject(value) &&
    typeof value.root === 'string' &&
    typeof value.pattern === 'string' &&
    value.pattern.trim() !== ''
  )
    return { root: value.root, pattern: value.pattern };
  throw new TypeError(
    `Source must be a file, a directory, a glob or { root, pattern }, got ${describe(value)}.`
  );
};

const byPath = (a: FoundSource, b: FoundSource) =>
  a.path < b.path ? -1
  : a.path > b.path ? 1
  : 0;

/**
 * Finds the images of a batch: files sharp can read, sorted by path. Files
 * inside `exclude` are left out, so outputs written inside the source tree
 * are never processed again.
 *
 * @param input File, directory, glob, or root and pattern.
 * @param exclude Directory to leave out, usually the destination.
 * @returns The root the tree is mirrored from, and the sources.
 */
export const findSources = async (
  input: BatchSource,
  exclude?: string
): Promise<{ root: string; sources: FoundSource[] }> => {
  let root: string;
  let pattern: string;
  if (typeof input === 'string') {
    const stats = await fs.stat(input).catch(() => undefined);
    // a file is taken as is, even with an unusual extension: sharp decides
    if (stats?.isFile())
      return {
        root: path.dirname(input),
        sources: [{ path: input, relativeDir: '' }],
      };
    ({ root, pattern } =
      stats?.isDirectory() ?
        { root: input, pattern: '**/*' }
      : splitGlob(input));
  } else ({ root, pattern } = input);

  const absoluteRoot = path.resolve(root);
  // in the file system's case: `-o Public/img` is inside `public`
  const excluded =
    exclude === undefined ? undefined : fileSystemKey(path.resolve(exclude));
  const isExcluded = (file: string) => {
    if (excluded === undefined) return false;
    const key = fileSystemKey(file);
    return key === excluded || key.startsWith(`${excluded}${path.sep}`);
  };

  const sources: FoundSource[] = [];
  for await (const entry of fs.glob(pattern, {
    cwd: absoluteRoot,
    withFileTypes: true,
  })) {
    if (!(entry.isFile() || entry.isSymbolicLink()) || !isInputFile(entry.name))
      continue;
    const absolute = path.join(entry.parentPath, entry.name);
    if (isExcluded(absolute)) continue;
    sources.push({
      path: path.join(root, path.relative(absoluteRoot, absolute)),
      relativeDir: path.relative(absoluteRoot, entry.parentPath),
    });
  }

  return { root, sources: sources.sort(byPath) };
};
