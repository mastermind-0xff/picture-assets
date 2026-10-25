import path from 'node:path';

import { parsePath } from '@mmutils/common';

import type { FormatSelector } from '../types/output.js';
import { displayPath } from '../utils/helpers.js';
import { canWriteFormat, isOutputFormat } from './formats.js';

/** Formats of an output, with the options given with each. */
export type FormatsMap = ReadonlyMap<FormatSelector, object | undefined>;

/**
 * Converts uncertain destination and formats to a reliable data.
 *
 * - Destination directory (trailing slash): outputs are named after the
 *   source, `dir/` + `house` + suffix.
 * - Destination file with a format extension (`dir/hero.webp`): outputs are
 *   named `dir/hero` + suffix, and the format is added to the formats.
 * - Anything else is an identifier used as the name as is: `dir/hero`, or
 *   `dir/hero.v2` (an extension that isn't a format is part of the name).
 *
 * Without formats, the source's format is used when sharp can write it.
 *
 * @param srcPath Source file path.
 * @param destPath Destination directory, file or identifier.
 * @param formats Formats from the `formats` argument. Not modified.
 * @returns Output path without suffix and extension, and at least one
 * format.
 * @throws TypeError when no output format can be found.
 */
export const resolvePathsAndFormats = (
  srcPath: string,
  destPath: string,
  formats: FormatsMap
): { outputPath: string; formats: FormatsMap } => {
  const src = parsePath(srcPath);
  const dest = parsePath(destPath);
  const destExtension = dest.extension.toLowerCase();
  const destFormat =
    dest.type === 'file' && isOutputFormat(destExtension) ?
      destExtension
    : undefined;

  const outputPath =
    dest.type === 'dir' ? path.join(dest.basePath, dest.baseName, src.baseName)
    : destFormat ? path.join(dest.basePath, dest.baseName)
    : path.join(dest.basePath, dest.name);

  const combined = new Map(formats);
  if (destFormat && !combined.has(destFormat))
    combined.set(destFormat, undefined);

  if (combined.size === 0) {
    const srcFormat = src.extension.toLowerCase();
    if (!isOutputFormat(srcFormat) || !canWriteFormat(srcFormat))
      throw new TypeError(
        `No output format for ${displayPath(srcPath)}: pass formats, or a destination with a format extension. The source's own format (${src.extension === '' ? 'no extension' : `'${src.extension}'`}) can't be written.`
      );
    combined.set(srcFormat, undefined);
  }

  return { outputPath, formats: combined };
};
