import path from 'node:path';

import {
  graphPlugin,
  isLogLevel,
  Logger,
  messagePlugin,
  type LogLevel,
} from '@mmutils/logger';

import { ResultBatchError } from '../errors/result-errors.js';
import {
  generateAssets,
  planAssets,
  type AssetsConfig,
  type AssetsPlan,
} from '../lib/generate-assets.js';
import type { AssetsLogger } from '../log/logger.js';
import { HELP, parseCliArgs, UsageError, type CliArgs } from './args.js';
import {
  findConfigFile,
  loadConfigFile,
  loadHooksFile,
  mergeConfig,
  resolveConfigPaths,
} from './config.js';

/** Exit codes of the command. */
export const EXIT_CODES = {
  ok: 0,
  failed: 1,
  usage: 2,
  interrupted: 130,
} as const;

/** Where the command reads and writes: the process's, or a test's. */
export interface CliIo {
  /** Results: the plan, `--json`. Written as given, newlines included. */
  readonly stdout: (text: string) => void;
  /** Logs and errors. */
  readonly stderr: (text: string) => void;
  /** Directory the config file is looked for in. */
  readonly cwd: string;
  /** Colors in the logs. */
  readonly colors: boolean;
  /** Stops the run: Ctrl+C. */
  readonly signal?: AbortSignal;
}

/**
 * The command's logger: `@mmutils/logger`, on stderr, timestamps to the
 * millisecond, a fixed width (a hook's start and end logs tell its time).
 */
export const createCliLogger = (
  level: LogLevel,
  write: (line: string) => void,
  colors: boolean
): AssetsLogger =>
  new Logger({
    level,
    useStyles: colors,
    timestamp: 'HH:mm:ss.SSS',
    plugins: [messagePlugin({ write }), graphPlugin({ write })],
  });

/** JSON of results: errors as their name and message. */
const toJson = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, nested: unknown) =>
      nested instanceof Error ?
        { name: nested.name, message: nested.message }
      : nested,
    2
  );

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** The plan of `--dry-run`, as text. */
const formatPlan = (plan: AssetsPlan) => {
  const lines: string[] = [];
  for (const source of plan.sources) {
    if (source.status === 'unchanged') {
      lines.push(`${source.source}: unchanged, skipped`);
      continue;
    }
    if (source.status === 'failed') {
      lines.push(`${source.source}: fails: ${errorMessage(source.error)}`);
      continue;
    }
    lines.push(`${source.source} (${source.width}x${source.height})`);
    for (const { size, status, files } of source.sizes)
      lines.push(
        `  ${size.padEnd(11)} ${
          status === 'skipped' ?
            'skipped: larger than the source'
          : files.map((file) => path.basename(file)).join(', ')
        }`
      );
  }
  lines.push(
    `${plan.sources.length} source(s), ${plan.files} file(s) to write.`
  );
  if (plan.hooksNotRun.length > 0)
    lines.push(
      `Hooks not run by the plan: ${plan.hooksNotRun.join(', ')}. They can change sizes, file names and formats.`
    );
  return `${lines.join('\n')}\n`;
};

/** Reads the config file and merges the flags over it. */
const readConfig = async (args: CliArgs, cwd: string) => {
  const file =
    args.configFile !== undefined ?
      path.resolve(cwd, args.configFile)
    : await findConfigFile(cwd);
  const fileConfig = file === undefined ? {} : await loadConfigFile(file);
  const config = mergeConfig(fileConfig, resolveConfigPaths(args.config, cwd));
  // over the config file's, as every flag
  if (args.hooksFile !== undefined)
    config.hooks = await loadHooksFile(path.resolve(cwd, args.hooksFile));
  if (config.input === undefined)
    throw new UsageError(
      'No input: name files, directories or globs, or set input in a config file.'
    );
  if (config.output === undefined)
    throw new UsageError(
      'No output: pass --output <dir>, or set output in a config file.'
    );
  return { config, file };
};

/**
 * Runs the `picture-assets` command.
 *
 * @param argv Arguments after the command.
 * @param io Streams, directory, colors and stop signal.
 * @param version Printed by `--version`.
 * @returns The exit code, see `EXIT_CODES`.
 */
export const runCli = async (
  argv: readonly string[],
  io: CliIo,
  version: string
): Promise<number> => {
  const fail = (message: string, hint = '') => {
    io.stderr(`picture-assets: ${message}\n${hint}`);
    return EXIT_CODES.usage;
  };

  let args: CliArgs;
  let config;
  let configFile;
  try {
    args = parseCliArgs(argv);
    if (args.help) {
      io.stdout(HELP);
      return EXIT_CODES.ok;
    }
    if (args.version) {
      io.stdout(`${version}\n`);
      return EXIT_CODES.ok;
    }
    ({ config, file: configFile } = await readConfig(args, io.cwd));
  } catch (error) {
    return fail(
      errorMessage(error),
      error instanceof UsageError ?
        'Run picture-assets --help for the options.\n'
      : ''
    );
  }

  // a level from the flags or a JSON file gets the command's logger; a JS
  // config file can bring its own
  const level = config.logger ?? 'info';
  const cliLogger =
    isLogLevel(level) ?
      createCliLogger(
        level,
        (line) => {
          io.stderr(`${line}\n`);
        },
        io.colors
      )
    : undefined;
  const logger = cliLogger ?? level;
  // a JS config's own logger is checked by the library, before any log
  if (configFile !== undefined)
    cliLogger?.info(
      `Config file: ${path.relative(io.cwd, configFile) || configFile}`
    );
  const assetsConfig = {
    ...config,
    logger,
    ...(io.signal && { signal: io.signal }),
  } as AssetsConfig;

  try {
    if (args.dryRun) {
      const plan = await planAssets(assetsConfig);
      io.stdout(args.json ? `${toJson(plan)}\n` : formatPlan(plan));
      return plan.sources.some(({ status }) => status === 'failed') ?
          EXIT_CODES.failed
        : EXIT_CODES.ok;
    }
    const batch = await generateAssets(assetsConfig);
    if (args.json) io.stdout(`${toJson(batch)}\n`);
    return (
      batch.status === 'succeed' ? EXIT_CODES.ok
      : batch.status === 'aborted' ? EXIT_CODES.interrupted
      : EXIT_CODES.failed
    );
  } catch (error) {
    if (error instanceof ResultBatchError) {
      if (args.json) io.stdout(`${toJson(error.resultBatch)}\n`);
      return EXIT_CODES.failed;
    }
    // the library's checks of the config, before any work
    if (
      error instanceof TypeError ||
      error instanceof RangeError ||
      error instanceof SyntaxError
    )
      return fail(errorMessage(error));
    throw error;
  }
};
