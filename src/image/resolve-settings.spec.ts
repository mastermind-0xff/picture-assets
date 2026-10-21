import { describe, expect, test } from 'vitest';

import { createRecordingLogger } from '../test-utils/logger.js';
import type { OutputSetting } from '../types/output.js';
import type { ResizeStrategyHint } from '../types/size.js';
import {
  findSettingsResolutionBoundaries,
  getSourceMultiplier,
  limitToSource,
  resolveOutputSettings,
  type SourceDimensions,
} from './resolve-settings.js';

const fullHd: SourceDimensions = { srcWidth: 1920, srcHeight: 1080 };

describe('findSettingsResolutionBoundaries', () => {
  test('with empty set', () => {
    expect(findSettingsResolutionBoundaries([], fullHd)).toEqual({
      maxMultiplier: undefined,
      minWidth: undefined,
      minHeight: undefined,
    });
  });

  test('with no multiplier: other aspect ratios are ignored', () => {
    expect(
      findSettingsResolutionBoundaries(
        [
          { width: 1920 },
          { height: 540 },
          { width: 1920, height: 800 },
          { width: 2560, height: 1440 },
        ],
        fullHd
      )
    ).toEqual({ maxMultiplier: undefined, minWidth: 960, minHeight: 540 });
    expect(
      findSettingsResolutionBoundaries(
        [
          { width: 960 },
          { height: 1080 },
          { width: 1920, height: 800 },
          { width: 2560, height: 1440 },
        ],
        fullHd
      )
    ).toEqual({ maxMultiplier: undefined, minWidth: 960, minHeight: 540 });
  });

  test('with one width multiplier', () => {
    expect(
      findSettingsResolutionBoundaries(
        [{ width: 'x1' }, { height: 1080 }, { width: 2560, height: 1440 }],
        fullHd
      )
    ).toEqual({ maxMultiplier: 1, minWidth: 1920, minHeight: 1080 });
  });

  test('with one width and one height multiplier', () => {
    expect(
      findSettingsResolutionBoundaries(
        [{ width: 'x1' }, { height: 'x2' }, { width: 2560, height: 1440 }],
        fullHd
      )
    ).toEqual({ maxMultiplier: 2, minWidth: 2560, minHeight: 1440 });
  });

  test('with many multipliers', () => {
    expect(
      findSettingsResolutionBoundaries(
        [
          { width: 'x1' },
          { height: 'x2' },
          { width: 'x3', height: 'x4' },
          { width: 'x1', height: 'x1' },
          { width: 'x5', height: 'x5' },
          { width: 2560, height: 1440 },
        ],
        fullHd
      )
    ).toEqual({ maxMultiplier: 5, minWidth: 2560, minHeight: 1440 });
  });
});

describe('getSourceMultiplier', () => {
  const { logger, messages } = createRecordingLogger();
  const multiplier = (
    settings: OutputSetting[],
    dimensions: SourceDimensions,
    hint: ResizeStrategyHint
  ) => getSourceMultiplier(settings, dimensions, hint, logger);

  test('with multipliers hint', () => {
    expect(multiplier([], fullHd, 'x1')).toBe(1);
    expect(multiplier([], fullHd, 'x3')).toBe(3);
    expect(multiplier([], fullHd, 'x1.5')).toBe(1.5);
  });

  test('with object x1 hint: the multiplier satisfying both sides', () => {
    const x1 = { width: 200, height: 100 };
    expect(multiplier([], { srcWidth: 400, srcHeight: 200 }, x1)).toBe(2);
    expect(multiplier([], { srcWidth: 400, srcHeight: 300 }, x1)).toBe(2);
    expect(multiplier([], { srcWidth: 600, srcHeight: 200 }, x1)).toBe(2);
    expect(multiplier([], { srcWidth: 100, srcHeight: 50 }, x1)).toBe(0.5);
    expect(multiplier([], { srcWidth: 100, srcHeight: 200 }, x1)).toBe(0.5);
    expect(multiplier([], { srcWidth: 200, srcHeight: 50 }, x1)).toBe(0.5);
  });

  test('downsample: the smallest pixel size is x1', () => {
    expect(multiplier([{ width: 960 }], fullHd, 'downsample')).toBe(2);
    expect(multiplier([{ width: 640 }], fullHd, 'downsample')).toBe(3);
    expect(
      multiplier(
        [{ width: 640 }, { width: 'x1' }, { width: 'x5' }],
        fullHd,
        'downsample'
      )
    ).toBe(3);
  });

  test('downsample: else the largest multiplier is the source', () => {
    expect(
      multiplier(
        [{ width: 'x1' }, { width: 'x2' }, { width: 'x3' }],
        fullHd,
        'downsample'
      )
    ).toBe(3);
    expect(
      multiplier(
        [{ width: 3840 }, { width: 'x2' }, { width: 'x3' }],
        fullHd,
        'downsample'
      )
    ).toBe(3);
  });

  test('downsample not possible: 1, with a warning', () => {
    expect(multiplier([{ width: 3840 }], fullHd, 'downsample')).toBe(1);
    expect(messages('warning')).toContain(
      'Unable to downsample with current config. Source multiplier set to 1.'
    );
  });

  test('upsample', () => {
    expect(multiplier([], fullHd, 'upsample')).toBe(1);
  });
});

describe('resolveOutputSettings', () => {
  const { logger } = createRecordingLogger();
  const source = { srcWidth: 800, srcHeight: 400 };

  test('pixels and multipliers, from the largest', () => {
    const settings: OutputSetting[] = [
      // x1 will become 200x100
      { width: 200, suffix: 'x1' },
      { height: 200, suffix: 'x2' },
      { width: 'x3', suffix: 'x3' },
      { height: 'x4', suffix: 'x4' },
      { width: 'x5', height: 'x5', suffix: 'x5' },
      { width: 1200, height: 600, suffix: 'x6' },
    ];
    const resolved = resolveOutputSettings(
      settings,
      source,
      'downsample',
      logger
    );

    expect(resolved.map(({ suffix }) => suffix)).toEqual([
      'x6',
      'x5',
      'x4',
      'x3',
      'x2',
      'x1',
    ]);
    expect(resolved).toEqual(
      [6, 5, 4, 3, 2, 1].map((multiplier) => ({
        suffix: `x${multiplier}`,
        width: 200 * multiplier,
        height: 100 * multiplier,
        aspectRatio: 2,
        widthMultiplier: multiplier,
        heightMultiplier: multiplier,
        sizeMultiplier: multiplier,
        isMatchingSourceAspectRatio: true,
        // the source is x4: larger sizes come from it, smaller ones chain
        useAsNextResizeIteration: multiplier <= 4,
        generateFromSource: multiplier > 4,
      }))
    );
  });

  test('crops and other aspect ratios are never reused', () => {
    const extractRegion = { top: 50, left: 0, width: 400, height: 100 };
    const resolved = resolveOutputSettings(
      [
        { width: 200, suffix: 'x1' },
        { width: 400, extractRegion },
        { width: 600, height: 100, suffix: 'x3ish' },
        { width: 'x5', suffix: 'x5' },
      ],
      source,
      'downsample',
      logger
    );

    expect(resolved).toMatchObject([
      { width: 1000, height: 500, sizeMultiplier: 5, generateFromSource: true },
      {
        width: 400,
        height: 200,
        sizeMultiplier: 2,
        extractRegion,
        useAsNextResizeIteration: false,
        generateFromSource: false,
      },
      {
        width: 600,
        height: 100,
        aspectRatio: 6,
        widthMultiplier: 3,
        heightMultiplier: 1,
        sizeMultiplier: 2,
        isMatchingSourceAspectRatio: false,
        useAsNextResizeIteration: false,
        generateFromSource: false,
      },
      { width: 200, height: 100, useAsNextResizeIteration: true },
    ]);
  });

  test('explicit flags win over the computed ones', () => {
    expect(
      resolveOutputSettings(
        [
          {
            width: 200,
            useAsNextResizeIteration: false,
            generateFromSource: true,
          },
        ],
        source,
        'downsample',
        logger
      )
    ).toMatchObject([
      { width: 200, useAsNextResizeIteration: false, generateFromSource: true },
    ]);
  });

  test('flags explicitly undefined keep the computed ones', () => {
    const setting = {
      width: 200,
      generateFromSource: undefined,
      useAsNextResizeIteration: undefined,
    } as unknown as OutputSetting;
    expect(
      resolveOutputSettings([setting], source, 'downsample', logger)
    ).toMatchObject([
      { useAsNextResizeIteration: true, generateFromSource: false },
    ]);
  });

  test('only resolved values: no multiplier strings, no unknown keys', () => {
    const [resolved] = resolveOutputSettings(
      [{ width: 'x2', resizeOptions: { fit: 'contain' } }],
      source,
      'x1',
      logger
    );
    expect(resolved).toEqual({
      width: 1600,
      height: 800,
      aspectRatio: 2,
      widthMultiplier: 2,
      heightMultiplier: 2,
      sizeMultiplier: 2,
      isMatchingSourceAspectRatio: true,
      useAsNextResizeIteration: false,
      generateFromSource: true,
      resizeOptions: { fit: 'contain' },
    });
  });

  test('the source multiplier is not rounded: no pixel lost', () => {
    // 3901 / 640 = 6.0953…, rounded to 6.1 it gave 640, 1279 and 1919
    const resolved = resolveOutputSettings(
      [{ width: 'x3' }, { width: 'x2' }, { width: 'x1' }],
      { srcWidth: 3901, srcHeight: 2926 },
      { width: 640, height: 480 },
      logger
    );
    expect(resolved.map(({ width }) => width)).toEqual([1920, 1280, 640]);
    expect(resolved.map(({ sizeMultiplier }) => sizeMultiplier)).toEqual([
      3, 2, 1,
    ]);
  });

  test('sizes are at least 1 pixel', () => {
    expect(
      resolveOutputSettings([{ width: 'x0.001' }], source, 'x1', logger)
    ).toMatchObject([{ width: 1, height: 1 }]);
  });

  test.each([
    ['downsample', [300, 200, 100]],
    ['upsample', [900, 600, 300]],
    ['x2', [450, 300, 150]],
    [{ width: 50, height: 50 }, [150, 100, 50]],
  ] as const)("imageResize's documented example with %j", (hint, widths) => {
    const resolved = resolveOutputSettings(
      [{ width: 'x3' }, { width: 'x2' }, { width: 'x1' }],
      { srcWidth: 300, srcHeight: 300 },
      hint,
      logger
    );
    expect(resolved.map(({ width }) => width)).toEqual(widths);
  });
});

describe('limitToSource', () => {
  const { logger } = createRecordingLogger();
  const source = { srcWidth: 800, srcHeight: 600 };
  const limit = (settings: OutputSetting[]) =>
    limitToSource(
      resolveOutputSettings(settings, source, 'downsample', logger),
      source
    ).map(({ width, height, skipped, generateFromSource }) => ({
      size: `${width}x${height}`,
      skipped: skipped ?? false,
      generateFromSource,
    }));

  test('the largest of the larger sizes made at the source size, the others skipped', () => {
    expect(limit([{ width: 2000 }, { width: 1200 }, { width: 400 }])).toEqual([
      { size: '800x600', skipped: false, generateFromSource: true },
      { size: '1200x900', skipped: true, generateFromSource: true },
      { size: '400x300', skipped: false, generateFromSource: false },
    ]);
  });

  test('another aspect ratio: the largest that fits', () => {
    expect(limit([{ width: 1600, height: 400 }])).toEqual([
      { size: '800x200', skipped: false, generateFromSource: true },
    ]);
  });

  test('skipped when a size already is the source size', () => {
    expect(limit([{ width: 1000 }, { width: 800 }])).toEqual([
      { size: '1000x750', skipped: true, generateFromSource: true },
      { size: '800x600', skipped: false, generateFromSource: false },
    ]);
  });

  test('crops are skipped, the next larger size is made instead', () => {
    expect(
      limit([
        {
          width: 2000,
          extractRegion: { left: 0, top: 0, width: 100, height: 100 },
        },
        { width: 1000 },
      ])
    ).toEqual([
      { size: '2000x1500', skipped: true, generateFromSource: true },
      { size: '800x600', skipped: false, generateFromSource: true },
    ]);
  });

  test('the multipliers follow the new size', () => {
    const [made] = limitToSource(
      resolveOutputSettings([{ width: 1600 }], source, 'x1', logger),
      source
    );
    expect(made).toMatchObject({
      width: 800,
      widthMultiplier: 1,
      sizeMultiplier: 1,
      useAsNextResizeIteration: true,
    });
  });
});
