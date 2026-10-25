import fs from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import {
  createTempDir,
  listFiles,
  writeFixtures,
} from '../test-utils/fixtures.js';
import type { ResultBatch } from '../types/output.js';
import { displayPath } from '../utils/helpers.js';
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
      `${displayPath(path.relative(process.cwd(), file('landscape.jpg')))} (800x600)`,
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
      `${displayPath(path.relative(process.cwd(), file('landscape.jpg')))}: unchanged, skipped`,
      expect.stringMatching(
        /corrupt\.jpg: fails: Input buffer contains unsupported image format$/
      ) as unknown,
      '2 source(s), 0 file(s) to write.',
      '',
    ]);
  });

  test('--dry-run with hooks from a .js config: a note, as they are not run', async () => {
    const site = path.join(dir, `site-${++testIndex}`);
    await fs.mkdir(site);
    await fs.writeFile(
      path.join(site, 'picture-assets.config.mjs'),
      `export default {
        output: 'public',
        sizes: [200],
        formats: ['webp'],
        hooks: [{ name: 'grade', source: (image) => image.modulate({ saturation: 1.1 }) }],
      };`
    );
    const { code, stdout, stderr } = await run(
      [file('landscape.jpg'), '--dry-run'],
      { cwd: site }
    );
    expect(code).toBe(EXIT_CODES.ok);
    expect(stdout.split('\n').slice(-3)).toEqual([
      '1 source(s), 1 file(s) to write.',
      'Hooks not run by the plan: grade. They can change sizes, file names and formats.',
      '',
    ]);
    expect(stderr).toMatch(/The plan doesn't run the hooks \(grade\)/);
  });

  describe('--hooks <file>', () => {
    /** A directory with files, the command run in it. */
    const site = async (files: Record<string, string>) => {
      const root = path.join(dir, `hooks-${++testIndex}`);
      await fs.mkdir(root);
      for (const [name, text] of Object.entries(files))
        await fs.writeFile(path.join(root, name), text);
      return root;
    };
    /** The hooks named by the dry run's note. */
    const notedHooks = (stdout: string) =>
      /Hooks not run by the plan: (.*)\. They/.exec(stdout)?.[1];

    test('a list of hooks, applied to the run', async () => {
      const cwd = await site({
        'hooks.mjs': `export default [
          { name: 'shrink', source: (image) => image.resize(40, 30) },
        ];`,
      });
      const { code, stdout } = await run(
        [
          file('landscape.jpg'),
          '-o',
          'out',
          '-s',
          '20',
          '-f',
          'webp',
          '--hooks',
          'hooks.mjs',
          '--json',
          '--silent',
        ],
        { cwd }
      );
      expect(code).toBe(EXIT_CODES.ok);
      const batch = JSON.parse(stdout) as ResultBatch;
      // the source as the hook made it
      expect(batch.sources[0]).toMatchObject({ width: 40, height: 30 });
    });

    test('a hook, or a function returning hooks; over the config file', async () => {
      const cwd = await site({
        'picture-assets.config.mjs': `export default {
          output: 'out',
          hooks: [{ name: 'fromConfig', source: () => undefined }],
        };`,
        'one.mjs': `export default { name: 'one', source: () => undefined };`,
        'factory.mjs': `export default async () => [
          { name: 'a', source: () => undefined },
          { name: 'b', beforeFormat: () => undefined },
        ];`,
      });
      const dryRun = async (...extra: string[]) =>
        notedHooks(
          (
            await run(
              [file('landscape.jpg'), '--dry-run', '--silent', ...extra],
              { cwd }
            )
          ).stdout
        );
      expect(await dryRun()).toBe('fromConfig');
      expect(await dryRun('--hooks', 'one.mjs')).toBe('one');
      expect(await dryRun('--hooks', 'factory.mjs')).toBe('a, b');
    });

    test('a module without hooks, or invalid hooks: exit 2', async () => {
      const cwd = await site({
        'none.mjs': `export const hooks = [];`,
        'invalid.mjs': `export default [{ name: 'x' }];`,
      });
      const common = [file('landscape.jpg'), '-o', 'out', '--hooks'];
      expect(await run([...common, 'none.mjs'], { cwd })).toMatchObject({
        code: EXIT_CODES.usage,
        stderr: expect.stringMatching(
          /none\.mjs must export its hooks as its default export/
        ) as unknown,
      });
      expect(await run([...common, 'invalid.mjs'], { cwd })).toMatchObject({
        code: EXIT_CODES.usage,
        stderr: expect.stringMatching(
          /Hook 0 .*has no function at any point/
        ) as unknown,
      });
      expect(await run([...common, 'missing.mjs'], { cwd })).toMatchObject({
        code: EXIT_CODES.usage,
      });
    });
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
    expect(first.stderr).toMatch(
      /info +Config file: picture-assets\.config\.json\n/
    );
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
