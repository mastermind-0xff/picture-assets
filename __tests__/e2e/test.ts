import path from 'path';
import { imageResize } from '../../src';
import { OutputSetting, AtLeastOneOutputFormat } from '../../src/types/output';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');

const srcPath = path.join(rootSrc, 'house-01.jpg');
const destPath = path.join(rootDest, '/test.1/');
const settings: OutputSetting[] = [
  { width: 'x1' },
  { width: 'x2' },
  { width: 'x3' },
  { width: 'x4' },
  { width: 'x5' },
  { width: 'x6' },
  { width: 'x7' },
];
const formats: AtLeastOneOutputFormat = ['jpg', 'webp', 'png', 'tiff'];

const result = await imageResize(srcPath, destPath, settings, formats);
//  console.dir(result, { depth: null});