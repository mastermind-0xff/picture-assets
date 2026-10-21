/**
 * The `image-assets` command.
 *
 * Sharp runs on libuv's thread pool, 4 threads unless `UV_THREADPOOL_SIZE`
 * says otherwise, and a pool as large as the machine's parallelism made
 * batches about a third faster (bench/README.md). libuv sizes its pool when
 * the process starts: setting the variable from here has no effect (measured
 * with Node 22, from ES modules and CommonJS alike). So without the
 * variable, the command runs itself again with it set, once; a size set by
 * the user is kept.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';

/**
 * Whether a stream is a terminal. Its type says `isTTY` is always a
 * boolean, but it is undefined on pipes and files: colors would be on.
 */
const isTerminal = (stream: { readonly isTTY?: boolean }) =>
  stream.isTTY === true;

/** Exit code of a process ended by a signal: 128 + its number. */
const signalExitCode = (signal: NodeJS.Signals) =>
  128 + ((os.constants.signals[signal] as number | undefined) ?? 0);

const runWithPool = () => {
  const child = spawn(
    process.execPath,
    [...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        UV_THREADPOOL_SIZE: String(os.availableParallelism()),
      },
    }
  );
  // Ctrl+C reaches both processes: the command stops its run, this one waits
  // for its exit code; a termination is passed on
  process.on('SIGINT', () => undefined);
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  child.on('error', (error) => {
    process.stderr.write(`image-assets: ${error.message}\n`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? signalExitCode(signal) : 1);
  });
};

const run = async () => {
  const { runCli } = await import('./cli/run.js');
  const { version } = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  ) as { version: string };

  // Ctrl+C: the files in progress finish, so none is left half written; a
  // second Ctrl+C quits at once
  const controller = new AbortController();
  process.once('SIGINT', () => {
    process.stderr.write(
      '\nStopping: the files in progress finish. Ctrl+C again to quit now.\n'
    );
    controller.abort(new Error('Interrupted'));
    process.once('SIGINT', () => process.exit(130));
  });

  try {
    process.exitCode = await runCli(
      process.argv.slice(2),
      {
        stdout: (text) => process.stdout.write(text),
        stderr: (text) => process.stderr.write(text),
        cwd: process.cwd(),
        colors: isTerminal(process.stderr) && !process.env.NO_COLOR,
        signal: controller.signal,
      },
      version
    );
  } catch (error) {
    process.stderr.write(
      `image-assets: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`
    );
    process.exitCode = 1;
  }
};

if (process.env.UV_THREADPOOL_SIZE === undefined) runWithPool();
else await run();
