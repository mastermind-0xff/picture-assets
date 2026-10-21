import path from 'path';

import { AtLeastOneProperty } from '@mmtypes/common';
import { parsePath } from '@mmutils/common';

import { AtLeastOneOutputFormat, OutputFormatsOptions } from '../types/output';
import { arrayValuesToKeys } from '../utils/helpers';
import { isSharpFormatEnum } from '../utils/type-guards';

/**
 * Converts uncertain destination and formats to a reliable data. If a string
 * list of formats is provided it's converted to empty settings formats object.
 * If formats are missing - output's file format is used, if it's also missing -
 * source's file format is used.
 *
 * @param srcPath Source file path.
 * @param destPath Destination file, directory or identifier.
 * @param formats List of output format strings or format-format options
 * key-value pairs. Can be omitted.
 * @returns Object containing output path and at least one format with or
 * without options.
 */
export const resolvePathsAndFormats = (
  srcPath: string,
  destPath: string,
  formats?: AtLeastOneOutputFormat
) => {
  const { baseName: srcBaseName, extension: srcExtension } = parsePath(srcPath);
  const {
    basePath: destBasePath,
    baseName: destBaseName,
    extension: destExtension,
    type: destType,
  } = parsePath(destPath);

  const combinedFormats: Partial<OutputFormatsOptions> =
    (Array.isArray(formats) ? arrayValuesToKeys(formats, {}) : formats) || {};

  let outputPath = path.join(destBasePath, destBaseName);

  if (destType === 'file') {
    if (isSharpFormatEnum(destExtension)) {
      combinedFormats[destExtension] ??= {};
    }
  } else {
    outputPath = path.join(
      destBasePath,
      destBaseName,
      destType === 'dir' ? srcBaseName : ''
    );

    if (
      srcExtension &&
      !Object.keys(combinedFormats).length &&
      isSharpFormatEnum(srcExtension)
    ) {
      combinedFormats[srcExtension] ??= {};
    }
  }
  return {
    outputPath,
    combinedFormats:
      combinedFormats as AtLeastOneProperty<OutputFormatsOptions>,
  };
};
