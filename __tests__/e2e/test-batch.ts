import path from 'path';

import { glob } from 'glob';

import { OutputSetting, AtLeastOneOutputFormat } from '../../src/types/output';
import { batchImageResize } from '../../src/lib/batch-image-resize';
import { createLogger } from '../../src/log/logger';
import { ImageResizeConfig } from '../../src/config/main';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/batch-image-resize/');

const destPath = path.join(rootDest, '/test.1/');
const srcPattern = '**/*.*';
const srcFiles = await glob(
  path.join(rootSrc, srcPattern).replaceAll('\\', '/')
);

const formats: AtLeastOneOutputFormat = ['webp', 'png', 'jpg'];
const settings: OutputSetting[] = [
  { width: 'x1' },
  { width: 'x2' },
  { width: 'x3' },
  { width: 'x4' },
  { width: 'x5' },
];

const expectedFiles: string[] = [];
srcFiles.reduce((acc: string[], curFilePath: string) => {
  const relativePath = path.relative(rootSrc, curFilePath);
  const { dir, name } = path.parse(relativePath);
  let destFile: string = path.join(dir, name);
  formats.forEach((format) => {
    settings.forEach((setting) => {
      acc.push(`${destFile}@${setting['width']}w.${format}`);
    });
  });
  return acc;
}, expectedFiles);

console.log(srcFiles);

await batchImageResize(
  { root: rootSrc, resource: srcPattern },
  destPath,
  settings,
  formats,
  6,
  {
    logger: createLogger('verbose'),
    resizeStrategyHint: ImageResizeConfig.resizeStrategyHint,
    executionScope: 'batch',
    abortScope: ImageResizeConfig.abortScope,
  }
);
//  console.dir(result, { depth: null});
