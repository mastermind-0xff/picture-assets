import fs from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import {
  createTempDir,
  listFiles,
  writeFixtures,
} from '../test-utils/fixtures.js';
import { EXIT_CODES, runCli, type CliIo } from './run.js';

let dir: string;
let remove: () => Promise<void>;
let file: (name: string) => string;
let testIndex = 0;

beforeAll(async () => {
  ({ dir, remove } = await createTempDir());
  file = await writeFixtures(dir);
});
afterAll(() => remove());

const outDir = () => path.join(dir, 'out', `${++testIndex}`);

/** Runs the command in a directory, capturing its output. */
const run = async (argv: string[], extra: Partial<CliIo> = {}) => {
  let stdout = '';
  let stderr = '';
  const code = await runCli(
    argv,
    {
      stdout: (text) => {
        stdout += text;
      },
      stderr: (text) => {
        stderr += text;
      },
      cwd: path.join(dir, 'empty'),
      colors: false,
      ...extra,
    },
    '1.2.3'
  );
  return { code, stdout, stderr };
};

describe('runCli', () => {
  test('help and version on stdout', async () => {
    expect(await run(['--help'])).toMatchObject({
      code: 0,
      stdout: expect.stringMatching(/^Usage: picture-assets/) as unknown,
    });
    expect(await run(['--version'])).toEqual({
      code: 0,
      stdout: '1.2.3\n',
      stderr: '',
    });
  });

  test('a batch: logs on stderr, files written, exit 0', async () => {
    const output = outDir();
    const { code, stdout, stderr } = await run([
      file('tree'),
      '-o',
      output,
      '-s',
      '100,50',
      '-f',
      'webp,fallback',
    ]);
    expect(code).toBe(EXIT_CODES.ok);
    expect(stdout).toBe('');
    expect(stderr).toMatch(/\[i\] +info +Found 3 source image\(s\)/);
    expect(stderr).toMatch(/Batch done: 3 of 3 sources, 12 files/);
    expect(await listFiles(output)).toEqual([
      'a@100w.jpg',
      'a@100w.webp',
      'a@50w.jpg',
      'a@50w.webp',
      'sub/b@100w.jpg',
      'sub/b@100w.webp',
      'sub/b@50w.jpg',
      'sub/b@50w.webp',
      'sub/deeper/c@100w.jpg',
      'sub/deeper/c@100w.webp',
      'sub/deeper/c@50w.jpg',
      'sub/deeper/c@50w.webp',
    ]);
  });

  test('--json: the result on stdout, errors readable', async () => {
    const output = outDir();
    const { code, stdout } = await run([
      file('landscape.jpg'),
      file('corrupt.jpg'),
      '-o',
      output,
      '-s',
      '50',
      '-f',
      'png',
      '--json',
      '--silent',
    ]);
    expect(code).toBe(EXIT_CODES.failed);
    const result = JSON.parse(stdout) as {
      status: string;
      sources: { status: string; error?: { name: string; message: string } }[];
    };
    expect(result.status).toBe('failed');
    expect(result.sources.map(({ status }) => status)).toEqual([
      'succeed',
      'failed',
    ]);
    expect(result.sources[1]?.error?.message).toMatch(
      /unsupported image format/
    );
  });

  test('--dry-run: the plan, nothing written', async () => {
    const output = outDir();
    const { code, stdout } = await run([
      file('landscape.jpg'),
      '-o',
      output,
      '-f',
      'avif',
      '--dry-run',
    ]);
    expect(code).toBe(EXIT_CODES.ok);
    expect(stdout.split('\n')).toEqual([
      `${path.relative(process.cwd(), file('landscape.jpg'))} (800x600)`,
      '  800x600     landscape@800w.avif',
      '  1920x1440   skipped: larger than the source',
      '  1280x960    skipped: larger than the source',
      '  960x720     skipped: larger than the source',
      '  640x480     landscape@640w.avif',
      '  320x240     landscape@320w.avif',
      '1 source(s), 3 file(s) to write.',
      '',
    ]);
    await expect(fs.access(output)).rejects.toThrow();
  });

  test('--dry-run: unchanged and failing sources, exit 1', async () => {
    const output = outDir();
    const manifest = path.join(output, 'assets.json');
    const common = ['-s', '50', '-f', 'png', '--manifest', manifest];
    await run([file('landscape.jpg'), '-o', output, ...common, '--silent']);
    const { code, stdout } = await run([
      file('landscape.jpg'),
      file('corrupt.jpg'),
      '-o',
      output,
      ...common,
      '--dry-run',
    ]);
    expect(code).toBe(EXIT_CODES.failed);
    expect(stdout.split('\n')).toEqual([
      `${path.relative(process.cwd(), file('landscape.jpg'))}: unchanged, skipped`,
      expect.stringMatching(
        /corrupt\.jpg: fails: Input buffer contains unsupported image format$/
      ) as unknown,
      '2 source(s), 0 file(s) to write.',
      '',
    ]);
  });

  test('a config file, flags over it, paths relative to it', async () => {
    const site = path.join(dir, `site-${++testIndex}`);
    await fs.mkdir(site);
    await fs.cp(file('tree'), path.join(site, 'images'), { recursive: true });
    await fs.writeFile(
      path.join(site, 'picture-assets.config.json'),
      JSON.stringify({
        input: 'images/sub',
        output: 'public',
        sizes: [80],
        formats: ['webp'],
        manifest: 'public/assets.json',
      })
    );
    const first = await run(['-s', '40'], { cwd: site });
    expect(first.code).toBe(EXIT_CODES.ok);
    expect(await listFiles(path.join(site, 'public'))).toEqual([
      'assets.json',
      'b@40w.webp',
      'deeper/c@40w.webp',
    ]);
    // incremental: nothing to do
    const second = await run(['-s', '40'], { cwd: site });
    expect(second.stderr).toMatch(/0 of 2 sources \(2 unchanged\), 0 files/);
  });

  test('usage and config errors: exit 2, a message on stderr', async () => {
    expect(await run(['--sizes'])).toMatchObject({
      code: EXIT_CODES.usage,
      stderr: expect.stringMatching(
        /^picture-assets: .*\nRun picture-assets --help for the options\.\n$/
      ) as unknown,
    });
    expect(await run([file('tree')])).toMatchObject({
      code: EXIT_CODES.usage,
      stderr: expect.stringMatching(
        /No output: pass --output <dir>/
      ) as unknown,
    });
    expect(await run(['-o', outDir()])).toMatchObject({
      code: EXIT_CODES.usage,
      stderr: expect.stringMatching(/No input/) as unknown,
    });
    expect(
      await run([file('tree'), '-o', outDir(), '-f', 'bmp'])
    ).toMatchObject({
      code: EXIT_CODES.usage,
      stderr:
        "picture-assets: Unknown output format 'bmp': expected one of avif, gif, heif, jpeg, jpg, jp2, jxl, png, tiff, tif, webp, or 'fallback'.\n",
    });
    expect(
      await run([file('tree'), '-o', outDir(), '-c', file('missing.json')])
    ).toMatchObject({ code: EXIT_CODES.usage });
  });

  test('a stopped run: exit 130', async () => {
    const { code } = await run(
      [file('tree'), '-o', outDir(), '-s', '50', '--silent'],
      { signal: AbortSignal.abort() }
    );
    expect(code).toBe(EXIT_CODES.interrupted);
  });

  test('--on-error batch: a failure stops the run, exit 1', async () => {
    const { code, stdout } = await run([
      file('corrupt.jpg'),
      file('landscape.jpg'),
      '-o',
      outDir(),
      '-s',
      '50',
      '-j',
      '1',
      '--on-error',
      'batch',
      '--json',
      '--silent',
    ]);
    expect(code).toBe(EXIT_CODES.failed);
    expect(
      (JSON.parse(stdout) as { sources: { status: string }[] }).sources.map(
        ({ status }) => status
      )
    ).toEqual(['failed', 'aborted']);
  });
});
