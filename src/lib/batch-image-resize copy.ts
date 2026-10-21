import path from 'path';
import os from 'os';

import { glob } from 'glob';
import { sec } from 'style-escape-codes';

import { AtLeastOneOutputFormat } from '../types/output';
import { OutputSetting } from '../types/output';
import { ResultSource } from '../types/output';

import { imageResize } from './image-resize';
import { createLogger } from '../log/logger';
import { ExecutionContext } from '../types/execution';
import { ImageResizeConfig } from '../config/main';

/**
 * Convert multiple files to a multiple output formats and resolutions. Glob
 * selection allowed. Set `ImageResizeConfig.logLevel` to true to enable debugging
 * output.
 * ---
 * **example**:
 * ```js  `
 * //123
 * ```
 *
 * @param srcPath String with path to source file or object containing 'root'
 * dir (to be matched against destination dir and used as prefix for the output)
 * and 'resource' to target a specific file in that root.
 * @param destRoot Directory to output all converted files.
 * @param settings Object containing width and/or height and additional "options"
 * params. Omit width or height to calc the other automatically.
 * @param formats List of output formats strings.
 * @param numOfWorkers How many jobs to run at the same time. Defaults to half
 * of the logical cores available.
 * Sharp utilize all available cores, but that might not saturate the CPU enough.
 * Adding more jobs at the same time can yield better performance. Adding too
 * much or too low might have the opposite effect.
 */
export const batchImageResize = async (
  srcPath: string | { root: string; resource: string },
  destRoot: string,
  settings: OutputSetting[],
  formats?: AtLeastOneOutputFormat,
  numOfWorkers: number | 'auto' | 'max_threads' = 'auto',
  executionContext: ExecutionContext = {
    logger: createLogger(ImageResizeConfig.logLevel),
    resizeStrategyHint: ImageResizeConfig.resizeStrategyHint,
    executionScope: 'batch',
    abortScope: ImageResizeConfig.abortScope,
  }
) => {
  const { logger } = executionContext;
  logger.info('Started.', 'batchImageResize');
  logger.debug(
    { srcPath, destRoot, settings, formats, numOfWorkers },
    'Arguments'
  );
  const resultSources: ResultSource[] = [];
  const srcPathCombined =
    typeof srcPath === 'object' ?
      path.join(srcPath.root, srcPath.resource)
    : path.join(srcPath);
    

  logger.debug(srcPathCombined, `Source path`);

  const srcFiles = await glob(srcPathCombined.replace(/\\/g, '/'));

  if (!srcFiles.length) {
    logger.warning('No files found.');
    return resultSources;
  }
  if (numOfWorkers === 'auto')
    numOfWorkers = Math.min(
      srcFiles.length,
      Math.ceil(os.availableParallelism() / 2)
    );
  if (numOfWorkers === 'max_threads') numOfWorkers = os.availableParallelism();
  if (srcFiles.length < numOfWorkers) {
    const styledN = sec.b.bgRed(` ${srcFiles.length} `);
    logger.warning(
      `Only ${styledN} file${srcFiles.length === 1 ? '' : 's'} found. ` +
        `Cutting workers to ${styledN}.`
    );
    numOfWorkers = srcFiles.length;
  }

  const spawnImageResize = async (n: number) => {
    logger.info(`Worker ${n} created.`);
    try {
      while (true) {
        const srcFile = srcFiles[index++];
        if (!srcFile) {
          logger.info(`Worker ${n} terminated. No more files.`);
          break;
        }
        const srcFileParentFolder = path.dirname(srcFile);
        // if src root directory is provided, apply same tree structure to dest
        const destPath =
          typeof srcPath === 'object' ?
            path.join(
              destRoot,
              path.relative(srcPath.root, srcFileParentFolder)
            ) + path.sep
          : destRoot;

        resultSources.push(
          await imageResize(srcFile, destPath, settings, formats)
        );
      }
    } catch (e) {
      logger.error(String(e));
    }
  };

  let index = 0;
  const start = performance.now();
  await Promise.all(
    Array.from({ length: numOfWorkers }, (_, i) => spawnImageResize(i + 1))
  ).then(() => {
    const duration = performance.now() - start;
    logger.info(`Finished. Total time ${duration} ms`, 'batchImageResize');
  });
  return resultSources;
};
