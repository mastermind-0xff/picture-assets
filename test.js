import { imageResizeAsync } from './dist/esm/lib/image-resize.js';
import path from 'path';

const root = './__tests__/e2e/assets/';
const rootSrc = path.join(root, '/raw-images/');
const rootDest = path.join(root, '/optimized-images/image-resize/');
const srcFilePath = path.join(rootSrc, 'house-01.jpg');
const destFilePath = path.join(rootDest, '/test.2/new-name.jpg');

const result = await imageResizeAsync(
  srcFilePath,
  destFilePath,
  // [
  //   { width: 2048, suffix: '@2x({w}w)' },
  //   { width: 1024, suffix: '@1x({w}w)' },
  // ],
  [
    { width: 'x3', suffix: '@3x({w}w)' },
    { width: 'x2', suffix: '@2x({w}w)' },
    { width: 'x1', suffix: '@1x({w}w)' },
  ],
  ['webp']
);
console.log(result);
