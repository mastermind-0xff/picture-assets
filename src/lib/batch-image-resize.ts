import { glob } from 'glob';
import path from 'path';
import {
  AtLeastOneOutputFormat,
  imageResizeAsync,
  OutputSettings,
} from './image-resize';
import { ImageResizeConfig } from '../config/main';

/**
 * Convert multiple files to a multiple output formats and resolutions.
 * Glob selection allowed.
 *
 * @param srcPath String to source file or object containing 'root' dir (to be
 * matched against destination dir and used as prefix for the output)
 * and 'resource' to target a specific file in that root.
 * @param destRoot Directory to output all converted files.
 * @param settings Object containing width and/or height and additional "options"
 * params. Omit width or height to calc them automatically.
 * @param formats Array containing output format strings.
 * @param formatsOutputOptions Additional options for each provided format.
 * @param numAsyncSpawns How many processes to run at the same time while there are
 * files to be generated. Multi-core CPUs might benefit from this factor.
 */

/*
  srcPath: string,
  destPath: string,
  settings: OutputSettings[],
  formats?: AtLeastOneOutputFormat
  */
export const batchImageResizeAsync = async (
  srcPath: string | { root: string; resource: string },
  destRoot: string,
  settings: OutputSettings[],
  formats?: AtLeastOneOutputFormat,
  numAsyncSpawns = 3
) => {
  const srcPathCombined =
    typeof srcPath === 'object' ?
      path.join(srcPath.root, srcPath.resource)
    : path.join(srcPath);
  const srcFiles = await glob(srcPathCombined.replace(/\\/g, '/'));

  const spawnImageResize = async (n: number) => {
    console.log(`Spawn ${n} created.`);
    try {
      while (true) {
        const srcFile = srcFiles.shift();
        if (!srcFile) {
          console.log(`Spawn ${n} terminated. No more files`);
          break;
        }
        const srcFileParentFolder = path.dirname(srcFile);
        // if src root directory is provided, apply same tree structure to dest
        const destPath =
          typeof srcPath === 'object' ?
            path.join(
              destRoot,
              path.relative(srcPath.root, srcFileParentFolder)
            )
          : destRoot;
          
        ImageResizeConfig.DEBUG &&
          console.log(
            `Spawn ${n}: processing "${srcFile}" to dest "${destPath}"`
          );
        await imageResizeAsync(srcFile, destPath, settings, formats);
      }
    } catch (e) {
      console.log(e, srcFiles);
    }
  };

  console.time('batchImageResize');
  const spawns: Promise<void>[] = [];
  for (let i = 0; i < numAsyncSpawns; i++) {
    spawns.push(spawnImageResize(i));
  }
  await Promise.all(spawns).then((result) => {
    console.log('Finished.');
    console.timeEnd('batchImageResize');
  });
};
