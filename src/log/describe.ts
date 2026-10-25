import type { ResolvedOptions } from '../config/options.js';
import { HOOK_POINTS, type TargetEncoder } from '../config/validate.js';
import type { OutputSetting, ResultSource } from '../types/output.js';
import { formatBytes } from '../utils/helpers.js';

/**
 * A run's settings for a debug log, flat: the message plugin writes each
 * property on its line.
 *
 * @param encoders Formats and their complete options; undefined when each
 * source is written in its own format.
 */
export const describeSettings = (
  settings: readonly OutputSetting[],
  encoders: readonly TargetEncoder[] | undefined,
  {
    suffix,
    resizeStrategyHint,
    upscale,
    abortScope,
    hooks,
  }: Pick<
    ResolvedOptions,
    'suffix' | 'resizeStrategyHint' | 'upscale' | 'abortScope' | 'hooks'
  >
): Record<string, unknown> => {
  const options: Record<string, unknown> = {};
  for (const encoder of encoders ?? [])
    options[`${encoder.format} options`] =
      encoder.format === 'fallback' ?
        { jpg: encoder.opaque.options, png: encoder.transparent.options }
      : encoder.options;
  return {
    sizes: settings,
    formats:
      encoders === undefined ? "each source's own" : (
        encoders.map(({ format }) => format).join(', ')
      ),
    ...options,
    suffix,
    resizeStrategyHint,
    upscale,
    abortScope,
    hooks:
      hooks.all.length === 0 ?
        'none'
      : hooks.all
          .map(
            (hook) =>
              `${hook.name} (${HOOK_POINTS.filter((point) => hook[point] !== undefined).join(', ')}${hook.concurrency === undefined ? '' : `; ${hook.concurrency} at once`})`
          )
          .join(', '),
  };
};

/** Files of results: written, failed, and the written ones by format. */
export const tallyFiles = (
  sources: readonly Pick<ResultSource, 'outputsBySetting'>[]
) => {
  let written = 0;
  let bytes = 0;
  let failed = 0;
  const byFormat = new Map<string, { files: number; bytes: number }>();
  for (const { outputsBySetting } of sources)
    for (const { files } of outputsBySetting)
      for (const file of files) {
        if (file.status !== 'succeed') {
          failed++;
          continue;
        }
        written++;
        bytes += file.fileData.size;
        const format = byFormat.get(file.format) ?? { files: 0, bytes: 0 };
        format.files++;
        format.bytes += file.fileData.size;
        byFormat.set(file.format, format);
      }
  return { written, bytes, failed, byFormat };
};

/** `'3 files, 1.25 MB'`. */
export const describeFiles = (files: number, bytes: number) =>
  `${files} file${files === 1 ? '' : 's'}, ${formatBytes(bytes)}`;
