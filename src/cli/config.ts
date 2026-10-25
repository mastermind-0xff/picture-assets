import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, isPlainObject } from '../config/validate.js';
import type { CliConfig } from './args.js';

/** Config files looked for in the current directory, in this order. */
export const CONFIG_FILES = [
  'picture-assets.config.json',
  'picture-assets.config.js',
  'picture-assets.config.mjs',
];

/** Config keys holding paths: relative to the config file. */
const PATH_KEYS = ['input', 'output', 'manifest'] as const;

/** The first config file of `CONFIG_FILES` in a directory, if any. */
export const findConfigFile = async (
  directory: string
): Promise<string | undefined> => {
  for (const name of CONFIG_FILES) {
    const file = path.join(directory, name);
    try {
      if ((await fs.stat(file)).isFile()) return file;
    } catch {
      // not there: the next one
    }
  }
  return undefined;
};

/**
 * Resolves the paths of a config against a directory, as paths relative to
 * the current directory.
 */
export const resolveConfigPaths = (
  config: CliConfig,
  directory: string
): CliConfig => {
  const resolved = { ...config };
  // relative to the current directory, which the library reads them from:
  // logs show the short paths users type
  const resolve = (value: unknown) =>
    typeof value === 'string' ?
      path.relative(process.cwd(), path.resolve(directory, value)) || '.'
    : value;
  for (const key of PATH_KEYS) {
    const value = resolved[key];
    if (value !== undefined)
      resolved[key] =
        Array.isArray(value) ? value.map(resolve) : resolve(value);
  }
  return resolved;
};

/**
 * Loads a config file: JSON, or a JavaScript module whose default export is
 * the config (or a function returning it). Its paths are made relative to
 * the file's directory.
 *
 * @throws SyntaxError for invalid JSON, TypeError when the file holds no
 * config object.
 */
export const loadConfigFile = async (file: string): Promise<CliConfig> => {
  const absolute = path.resolve(file);
  let config: unknown;
  if (absolute.toLowerCase().endsWith('.json')) {
    const text = await fs.readFile(absolute, 'utf8');
    try {
      config = JSON.parse(text);
    } catch (error) {
      throw new SyntaxError(
        `${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  } else {
    const module = (await import(pathToFileURL(absolute).href)) as {
      default?: unknown;
    };
    config = module.default;
    if (typeof config === 'function')
      config = await (config as () => unknown)();
  }
  if (!isPlainObject(config))
    throw new TypeError(
      `${file} must hold a config object (a JS module as its default export), got ${describe(config)}.`
    );
  return resolveConfigPaths(config, path.dirname(absolute));
};

/**
 * Loads the hooks of `--hooks`: a JavaScript module whose default export is
 * a list of hooks, a hook, or a function returning either (or a promise of
 * it). The hooks themselves are checked by the library.
 *
 * @throws TypeError when the module has no default export.
 */
export const loadHooksFile = async (file: string): Promise<unknown[]> => {
  const module = (await import(pathToFileURL(path.resolve(file)).href)) as {
    default?: unknown;
  };
  let hooks = module.default;
  if (typeof hooks === 'function') hooks = await (hooks as () => unknown)();
  if (hooks === undefined || hooks === null)
    throw new TypeError(
      `${file} must export its hooks as its default export: a list of hooks, a hook, or a function returning them.`
    );
  return Array.isArray(hooks) ? (hooks as unknown[]) : [hooks];
};

/**
 * The config of a run: the file's, then the flags' over it. Format options
 * are merged per format, so `--quality` keeps the file's other options.
 */
export const mergeConfig = (file: CliConfig, flags: CliConfig): CliConfig => {
  const merged: CliConfig = { ...file, ...flags };
  if (isPlainObject(file.formatOptions) && isPlainObject(flags.formatOptions)) {
    const formatOptions: Record<string, unknown> = { ...file.formatOptions };
    for (const [format, options] of Object.entries(flags.formatOptions))
      formatOptions[format] = {
        ...(isPlainObject(formatOptions[format]) ? formatOptions[format] : {}),
        ...(isPlainObject(options) ? options : {}),
      };
    merged.formatOptions = formatOptions;
  }
  return merged;
};
