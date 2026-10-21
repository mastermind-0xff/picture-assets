import { readFileSync } from 'node:fs';
import typescript from '@rollup/plugin-typescript';

const { dependencies = {} } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const dependencyNames = Object.keys(dependencies);

// dependencies and node builtins stay imports, consumers install them;
// sharp ships native binaries, so it can never be bundled
const external = (id) =>
  id.startsWith('node:') ||
  dependencyNames.some((name) => id === name || id.startsWith(`${name}/`));

const typescriptPlugin = () =>
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false,
    declarationMap: false,
    emitDeclarationOnly: false,
    outDir: undefined,
  });

const input = 'src/index.ts';

export default [
  {
    input,
    external,
    plugins: [typescriptPlugin()],
    output: {
      dir: 'dist/esm',
      format: 'esm',
      entryFileNames: '[name].js',
      preserveModules: true,
      preserveModulesRoot: 'src',
      sourcemap: true,
    },
  },
  {
    input,
    external,
    plugins: [typescriptPlugin()],
    output: {
      // `.cjs`: the package is `"type": "module"`, so `.js` files would be
      // loaded as ESM by `require`
      dir: 'dist/cjs',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      exports: 'named',
      sourcemap: true,
    },
  },
];
