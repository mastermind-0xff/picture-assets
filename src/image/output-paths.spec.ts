import path from 'path';
import { resolvePathsAndFormats } from './output-paths';

describe('check resolvePathsAndFormats', () => {
  const root = './__tests__/e2e/assets/';
  const rootSrc = path.join(root, '/raw-images/');
  const rootDest = path.join(root, '/optimized-images/specs/');

  test('with formats and dest format', () => {
    const resolvedObject = resolvePathsAndFormats(
      path.join(rootSrc, 'house-01.jpg'),
      path.join(rootDest, '/test.1/house-01.webp'),
      ['png', 'tiff']
    );

    expect(resolvedObject).toHaveProperty(
      'outputPath',
      path.join(rootDest, '/test.1/house-01')
    );
    expect(resolvedObject).toHaveProperty('combinedFormats', {
      png: {},
      tiff: {},
      webp: {},
    });
  });

  test('with formats and no dest format', () => {
    const resolvedObject = resolvePathsAndFormats(
      path.join(rootSrc, 'house-01.jpg'),
      path.join(rootDest, '/test.1/house-01'),
      ['png', 'tiff']
    );

    expect(resolvedObject).toHaveProperty(
      'outputPath',
      path.join(rootDest, '/test.1/house-01')
    );
    expect(resolvedObject).toHaveProperty('combinedFormats', {
      png: {},
      tiff: {},
    });
  });

  test('with no formats and no dest format', () => {
    const resolvedObject = resolvePathsAndFormats(
      path.join(rootSrc, 'house-01.jpg'),
      path.join(rootDest, '/test.1/house-01')
    );

    expect(resolvedObject).toHaveProperty(
      'outputPath',
      path.join(rootDest, '/test.1/house-01')
    );
    expect(resolvedObject).toHaveProperty('combinedFormats', {
      jpg: {},
    });
  });

  test('with object formats', () => {
    const resolvedObject = resolvePathsAndFormats(
      path.join(rootSrc, 'house-01.jpg'),
      path.join(rootDest, '/test.1/house-01'),
      { webp: { quality: 50 }, jpeg: {} }
    );

    expect(resolvedObject).toHaveProperty(
      'outputPath',
      path.join(rootDest, '/test.1/house-01')
    );
    expect(resolvedObject).toHaveProperty('combinedFormats', {
      webp: { quality: 50 },
      jpeg: {},
    });
  });
});
