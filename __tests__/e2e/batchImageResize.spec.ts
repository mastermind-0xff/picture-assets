import fs from 'fs';
import path from 'path';

import { glob } from 'glob';
import { sec } from 'style-escape-codes';

import { ImageResizeConfig, ImageResizeOptions } from '../../src/config/main';
import { AtLeastOneOutputFormat, OutputSettings } from '../../src/types/output';
import { batchImageResizeAsync } from '../../src';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');

const allFilesExist = (basePath: string, filesList: string[]) => {
  for (const fileName of filesList) {
    const filePath = path.join(basePath, fileName);
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      console.log(
        `${sec.b.bgRed(' File does not exist ')}${basePath}${sec.red(fileName)}`
      );
      return false;
    }
  }
  return true;
};

let ImageResizeConfigOrg: Partial<ImageResizeOptions> = {};
Object.assign(ImageResizeConfigOrg, ImageResizeConfig);

beforeEach(() => {
  Object.assign(ImageResizeConfig, ImageResizeConfigOrg);
});

describe('Batch create assets', () => {
  test(
    'with all files in a directory, recursively.',
    async () => {
      const destPath = path.join(rootDest, '/test.8/');
      const srcPattern = '**/*.*';
      const srcFiles = await glob(
        path.join(rootSrc, srcPattern).replaceAll('\\', '/')
      );

      // TODO make ImageResizeConfig writable in tests
      ImageResizeConfig.logLevel = 'silent';

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

      await batchImageResizeAsync(
        { root: rootSrc, resource: srcPattern },
        destPath,
        settings,
        formats
      );

      expect(allFilesExist(destPath, expectedFiles)).toBe(true);
    },
    50 * 1000
  );
  // test('with a missing file, outputs warning', async () => {
  //   const srcFilePath = path.join(rootSrc, 'house-0X.jpg');
  //   const destPath = path.join(rootDest, '/test.9/');

  //   ImageResizeConfig.logLevel = true;
  //   const result = await batchImageResizeAsync(
  //     srcFilePath,
  //     destPath,
  //     [{ width: 2048 }, { width: 1024 }],
  //     ['webp']
  //   );

  //   const expectedFileNames = ['house-01@1024w.webp', 'house-01@2048w.webp'];

  //   expect(allFilesExist(destPath, expectedFileNames)).toBe(true);
  // });
});
