import { parseArgs } from 'node:util';

import { isFormatPreset, isSizePreset } from '../config/presets.js';
import { describe } from '../config/validate.js';
import { isOutputFormat } from '../image/formats.js';
import { isSizeMultiplier } from '../image/size-multiplier.js';
import type { AssetsConfig } from '../lib/generate-assets.js';

/** A command line that can't be understood: exit code 2. */
export class UsageError extends Error {
  override name = 'UsageError';
}

/** Config built from the command line, before the config file is merged. */
export type CliConfig = { -readonly [K in keyof AssetsConfig]?: unknown };

export interface CliArgs {
  readonly help: boolean;
  readonly version: boolean;
  /** `--config`: a config file instead of the one found in the directory. */
  readonly configFile?: string;
  /** `--hooks`: a JS module exporting the hooks, over the config file's. */
  readonly hooksFile?: string;
  readonly dryRun: boolean;
  readonly json: boolean;
  readonly config: CliConfig;
}

const OPTIONS = {
  output: { type: 'string', short: 'o' },
  sizes: { type: 'string', short: 's' },
  formats: { type: 'string', short: 'f' },
  quality: { type: 'string', short: 'q' },
  suffix: { type: 'string' },
  strategy: { type: 'string' },
  'on-error': { type: 'string' },
  concurrency: { type: 'string', short: 'j' },
  config: { type: 'string', short: 'c' },
  hooks: { type: 'string' },
  manifest: { type: 'string' },
  force: { type: 'boolean' },
  upscale: { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  json: { type: 'boolean' },
  verbose: { type: 'boolean', short: 'v' },
  silent: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean' },
} as const;

/** Formats a bare `--quality` sets: those with a quality option. */
const QUALITY_FORMATS = ['avif', 'heif', 'jpeg', 'webp', 'tiff'] as const;

const list = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');

/** `1920,1280,640`, `x1,x2,x3` or a preset. */
export const parseSizesFlag = (value: string): unknown => {
  const items = list(value);
  if (items.length === 1 && isSizePreset(items[0])) return items[0];
  if (items.length === 0) throw new UsageError('--sizes is empty.');
  return items.map((item) => {
    if (/^\d+$/.test(item)) return Number(item);
    if (isSizeMultiplier(item)) return item;
    throw new UsageError(
      `Unknown size ${describe(item)} in --sizes: widths like 1280, multipliers like x2, or a preset: responsive, retina.`
    );
  });
};

/** `avif,webp,jpg`, `fallback` included, or a preset. */
export const parseFormatsFlag = (value: string): unknown => {
  const items = list(value);
  if (items.length === 1 && isFormatPreset(items[0])) return items[0];
  if (items.length === 0) throw new UsageError('--formats is empty.');
  return items;
};

/** `75` for every lossy format, or `avif=55,webp=75`. */
export const parseQualityFlag = (value: string) => {
  const quality = (text: string) => {
    if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 100)
      throw new UsageError(
        `Invalid quality ${describe(text)} in --quality: a whole number from 1 to 100.`
      );
    return Number(text);
  };
  if (/^\d+$/.test(value.trim()))
    return Object.fromEntries(
      QUALITY_FORMATS.map((format) => [
        format,
        { quality: quality(value.trim()) },
      ])
    );
  return Object.fromEntries(
    list(value).map((item) => {
      const [format = '', setting = '', ...rest] = item.split('=');
      if (rest.length > 0 || !isOutputFormat(format.trim()))
        throw new UsageError(
          `Invalid ${describe(item)} in --quality: expected a format and a quality, like avif=55.`
        );
      return [format.trim(), { quality: quality(setting.trim()) }];
    })
  );
};

/** `downsample`, `upsample`, `x2`, or the size of x1: `1024x768`. */
export const parseStrategyFlag = (value: string): unknown => {
  const size = /^(\d+)x(\d+)$/.exec(value.trim());
  return size ?
      { width: Number(size[1]), height: Number(size[2]) }
    : value.trim();
};

/** `auto`, `max` or a number. */
export const parseConcurrencyFlag = (value: string): unknown =>
  /^\d+$/.test(value.trim()) ? Number(value.trim()) : value.trim();

/**
 * Reads the command line. Values are checked here as far as the flags'
 * syntax goes; `generateAssets` checks the rest.
 *
 * @param argv Arguments after the command.
 * @throws UsageError for unknown flags and malformed values.
 */
export const parseCliArgs = (argv: readonly string[]): CliArgs => {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: OPTIONS,
      allowPositionals: true,
      allowNegative: true,
      strict: true,
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error)
    );
  }
  const { values, positionals } = parsed;
  if (values.verbose && values.silent)
    throw new UsageError("--verbose and --silent can't be used together.");

  const config: CliConfig = {};
  if (positionals.length > 0) config.input = positionals;
  if (values.output !== undefined) config.output = values.output;
  if (values.sizes !== undefined) config.sizes = parseSizesFlag(values.sizes);
  if (values.formats !== undefined)
    config.formats = parseFormatsFlag(values.formats);
  if (values.quality !== undefined)
    config.formatOptions = parseQualityFlag(values.quality);
  if (values.suffix !== undefined) config.suffix = values.suffix;
  if (values.strategy !== undefined)
    config.resizeStrategyHint = parseStrategyFlag(values.strategy);
  if (values['on-error'] !== undefined) config.abortScope = values['on-error'];
  if (values.concurrency !== undefined)
    config.concurrency = parseConcurrencyFlag(values.concurrency);
  if (values.manifest !== undefined) config.manifest = values.manifest;
  if (values.force !== undefined) config.force = values.force;
  if (values.upscale !== undefined) config.upscale = values.upscale;
  if (values.verbose) config.logger = 'debug';
  else if (values.silent) config.logger = 'silent';

  return {
    help: values.help ?? false,
    version: values.version ?? false,
    ...(values.config !== undefined && { configFile: values.config }),
    ...(values.hooks !== undefined && { hooksFile: values.hooks }),
    dryRun: values['dry-run'] ?? false,
    json: values.json ?? false,
    config,
  };
};

export const HELP = `Usage: picture-assets <input...> --output <dir> [options]

Turns images into web assets: every size in every format, the tree below
each input mirrored in the output directory.

Input: files, directories (every image below them) or globs. Quote globs
so the shell leaves them to picture-assets: 'photos/**/*.jpg'.

Options:
  -o, --output <dir>       Destination directory (required)
  -s, --sizes <sizes>      Widths 1920,1280,640, multipliers x1,x2,x3, or a
                           preset: responsive, retina          [responsive]
  -f, --formats <formats>  avif,webp,jpg,png,... and fallback (jpg, or png
                           for transparent sources), or a preset: web,
                           modern, lossless                    [web]
  -q, --quality <q>        75 for every lossy format, or avif=55,webp=75
      --suffix <pattern>   File name suffix, with {w} {h} the width and
                           height in pixels, {x} the multiplier (@{x}x
                           gives @2x), {wx} {hx} those of the width and
                           height. Starting with a dash: --suffix=-{w}
                                                               [@{w}w]
      --strategy <hint>    What x1 is: downsample (the smallest width in
                           pixels, else the source is the largest
                           multiplier), upsample (the source is x1), x2
                           (the source is x2), or the size of x1 like
                           1024x768                            [downsample]
      --[no-]upscale       Make sizes larger than the source   [no with a
                           sizes preset, yes with sizes]
      --on-error <scope>   What a failure stops: none, source, batch  [none]
  -j, --concurrency <n>    Sources at a time: auto, max or a number  [auto]
  -c, --config <file>      Config file   [picture-assets.config.json, .js or
                           .mjs in the current directory]
      --hooks <file>       A JS module exporting the hooks: a list of hooks,
                           a hook, or a function returning them
      --manifest <file>    Write a manifest of the files; unchanged sources
                           are skipped by the next runs
      --force              Process every source, even unchanged ones
      --dry-run            Print what would be written, write nothing
      --json               Print the result as JSON on stdout
  -v, --verbose            Debug logs: settings, each size and hook, details
      --silent             Log nothing
  -h, --help               This help
      --version            The version

Logs go to stderr. Exit codes: 0 done, 1 some sources failed, 2 invalid
arguments or config, 130 interrupted.

A config file holds the options of generateAssets as JSON (or a .js module
exporting them): { "input": "src/images", "output": "public/img",
"formats": ["avif", "webp"] }. Its paths are relative to it; flags win over
it, it wins over the PICTURE_ASSETS_* environment variables.

Examples:
  picture-assets src/images -o public/img
  picture-assets 'photos/**/*.jpg' -o dist/img -s 1920,1280,640 -f avif,webp,jpg
  picture-assets logo.png -o public -s x1,x2,x3 --strategy 160x40
  picture-assets src/images -o public/img --manifest public/img/assets.json
`;
