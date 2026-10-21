import { glob } from 'glob';
import path from 'path';

import { batchImageResizeAsync } from '../../src';
import { ImageResizeConfig } from '../../src/config/main';
import { AtLeastOneOutputFormat, OutputSettings } from '../../src/types/output';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');

const destPath = path.join(rootDest, '/test.8/');
// const srcPattern = '**/*.*';
const srcPattern = '/*.*';
const srcFiles = await glob(
  path.join(rootSrc, srcPattern).replaceAll('\\', '/')
);

const formats: AtLeastOneOutputFormat = ['webp', 'png', 'jpg'];
const settings: OutputSettings[] = [
  { width: 2048 },
  { width: 1024 },
  { width: 648 },
  { width: 324 },
  { width: 200 },
  { width: 100 },
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

console.log(expectedFiles);

ImageResizeConfig.logLevel = true;

await batchImageResizeAsync(
  { root: rootSrc, resource: srcPattern },
  destPath,
  settings,
  formats, 'max_threads'
);