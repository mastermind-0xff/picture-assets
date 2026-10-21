import path from 'path';
import os from 'os';

import { glob } from 'glob';
import { sec } from 'style-escape-codes';

import { AtLeastOneOutputFormat, ResultBatch } from '../types/output';
import { OutputSetting } from '../types/output';
import { ResultSource } from '../types/output';

import { imageResize } from './image-resize';
import { createLogger } from '../log/logger';
import { ExecutionContext } from '../types/execution';
import { ImageResizeConfig } from '../config/main';
import {
  ResultBatchError,
  ResultSourceError,
} from '../errors/image-resize-errors';
import {
  allResultsSucceeded,
  formatMsTime,
  isAbortLevel,
  sampleCPUUsage,
  shouldAbort,
} from '../utils/helpers';
import { plotValues } from '../log/logger';
import { isNumber } from '@mmutils/assert';
import { clear } from 'console';

/**
 * Convert multiple files to multiple output resolutions and formats. Glob
 * selection allowed.
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
 * @param numberOfWorkers How many jobs to run at the same time. Defaults to half
 * of the logical cores available.
 * Sharp utilize all available cores, but that might not saturate the CPU enough.
 * Adding more jobs at the same time can yield better performance. Adding too
 * much or too low might have the opposite effect.
 * @param executionContext
 */
export const batchImageResize = async (
  srcPath: string | { root: string; resource: string },
  destRoot: string,
  settings: OutputSetting[],
  formats?: AtLeastOneOutputFormat,
  numberOfWorkers: number | 'auto' | 'max_threads' = 'auto',
  executionContext: ExecutionContext = {
    logger: createLogger(ImageResizeConfig.logLevel),
    resizeStrategyHint: ImageResizeConfig.resizeStrategyHint,
    executionScope: 'batch',
    abortScope: ImageResizeConfig.abortScope,
  }
): Promise<ResultBatch> => {
  const { logger } = executionContext;
  const timeStart = performance.now();
  const srcPathCombined =
    typeof srcPath === 'object' ?
      path.join(srcPath.root, srcPath.resource)
    : path.join(srcPath);
  const srcFiles = await glob(srcPathCombined.replace(/\\/g, '/'));
  const UV_THREADPOOL_SIZE = parseInt(process.env.UV_THREADPOOL_SIZE ?? '4');
  const uvMaxThreads = isNumber(UV_THREADPOOL_SIZE) ? UV_THREADPOOL_SIZE : 4;
  const availableThreads = os.availableParallelism();
  srcFiles.length = 5;

  logger.info(
    `Started batch: ${sec.fgBlue(srcPathCombined)} (${srcFiles.length} file(s)).`,
    'batchImageResize'
  );
  logger.debug(
    { srcPath, destRoot, settings, formats, numOfWorkers: numberOfWorkers },
    'Arguments'
  );
  logger.verbose(srcFiles, 'Source files');

  if (!srcFiles.length) {
    logger.warning(`No source files found in '${srcPathCombined}'.`);
    return { status: 'failed', sources: [] };
  }
  if (numberOfWorkers === 'auto')
    numberOfWorkers = Math.min(uvMaxThreads, availableThreads, srcFiles.length);
  else if (numberOfWorkers === 'max_threads')
    numberOfWorkers = availableThreads;

  logger.info(
    {
      'process.env.UV_THREADPOOL_SIZE': `${process.env.UV_THREADPOOL_SIZE} \
(default 4)`,
      availableThreads,
      uvMaxThreads,
      numberOfWorkers,
      sourceFiles: srcFiles.length,
    },
    'Performance configuration'
  );

  if (
    srcFiles.length - numberOfWorkers > 0 &&
    numberOfWorkers < uvMaxThreads &&
    availableThreads - numberOfWorkers > 0
  )
    logger.warning(
      `Using only ${sec.b.bgRed(` ${numberOfWorkers} `)} of available \
${sec.b.bgGreen(` ${availableThreads} `)} threads when \
${sec.b.bgBlue(` ${Math.min(srcFiles.length, availableThreads)} `)} can be \
allocated for this run. Set UV_THREADPOOL_SIZE and numberOfWorkers accordingly.`,
      'Performance will not be maximized'
    );

  if (srcFiles.length < numberOfWorkers) {
    const workersNeeded = Math.min(
      srcFiles.length,
      numberOfWorkers,
      uvMaxThreads,
      availableThreads
    );
    const styledN = sec.b.bgRed(` ${workersNeeded} `);
    logger.warning(
      `Only ${styledN} file${srcFiles.length === 1 ? '' : 's'} found. ` +
        `Cutting workers to ${styledN}.`
    );
    numberOfWorkers = workersNeeded;
  }

  const sources: ResultSource[] = [];
  const memoryUsage: number[] = [];
  const cpuUsage: number[] = [];
  const sourcesProcessed: number[] = [];

  let startCPUSample = sampleCPUUsage();
  const totalSources = srcFiles.length;
  const probeUsageId = setInterval(() => {
    cpuUsage.push(sampleCPUUsage(startCPUSample));
    startCPUSample = sampleCPUUsage();
    memoryUsage.push(process.memoryUsage.rss() / 1024 / 1024);
    sourcesProcessed.push(totalSources - srcFiles.length);
  }, 100);

  const spawnImageResize = async (n: number) => {
    logger.info(`Worker ${n} created.`);
    while (srcFiles.length) {
      const srcFile = srcFiles.shift();
      if (!srcFile) {
        logger.info(`Worker ${n} terminated. No more files.`);
        return;
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

      try {
        sources.push(
          await imageResize(
            srcFile,
            destPath,
            settings,
            formats,
            executionContext
          )
        );
      } catch (error: unknown) {
        if (error instanceof ResultSourceError) {
          const resultSource = error.resultSource;
          sources.push(resultSource);
        }

        if (shouldAbort(executionContext)) {
          if (isAbortLevel(executionContext))
            logger.error({ srcFile, error }, 'Source failed');

          throw new ResultBatchError(
            `Batch aborted.`,
            { status: 'aborted', sources: sources },
            { cause: error }
          );
        }

        logger.warning({ error }, 'Batch failed');
      }
    }
  };

  const workers = [...Array(numberOfWorkers)].map((_, i) =>
    spawnImageResize(i + 1)
  );
  // let upper logic take care if loop fails
  await Promise.all(workers);

  clearInterval(probeUsageId);

  const totalTime = Math.round(performance.now() - timeStart);
  logger.info(
    `Completed batch: ${sec.fgBlue(srcPathCombined)}. \
Time: ${formatMsTime(totalTime)}. CPU usage: \
${sampleCPUUsage(startCPUSample)}%.`,
    'batchImageResize'
  );

  logger.plot(cpuUsage, {
    size: { cols: 30, rows: 4 },
    maxValue: 100,
    title: 'CPU usage',
    valueSymbol: '%',
    totalTime,
  });
  logger.plot(memoryUsage, {
    size: { cols: 30, rows: 4 },
    title: 'Memory usage',
    valueSymbol: 'MB',
    totalTime,
  });
  logger.plot(sourcesProcessed, {
    size: { cols: 30, rows: 4 },
    title: 'Sources processed',
    totalTime,
  });

  return {
    status: allResultsSucceeded(sources) ? 'succeed' : 'failed',
    sources,
  };
};
