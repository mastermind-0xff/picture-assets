import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

// import packageJson from './package.json' assert { type: 'json' };

const entryFileNameNodeModules = (chunkInfo) => {
  if (chunkInfo.name.includes('node_modules')) {
    return chunkInfo.name.replace('node_modules', 'external') + '.js';
  }

  return '[name].js';
};

export default [
  {
    input: './src/index.ts',
    output: [
      {
        // file: packageJson.main,
        dir: './dist/cjs',
        format: 'cjs',
        sourcemap: true,
        preserveModules: true,
        exports: 'auto',
        preserveModulesRoot: 'src',
        // entryFileNames: entryFileNameNodeModules,
      },
      {
        // file: packageJson.module,
        dir: './dist/esm',
        format: 'esm',
        sourcemap: true,
        preserveModules: true,
        exports: 'auto',
        preserveModulesRoot: 'src',
        // entryFileNames: entryFileNameNodeModules,
      },
    ],
    plugins: [
      json(),
      resolve({ moduleDirectories: ['node_modules'] }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    external: (id) => {
      if (String(id).indexOf('node_modules') !== -1) return true;
      return false;
    },
  },
  // {
  //   input: './dist/esm/types/index.d.ts',
  //   output: [{ file: './dist/index.d.ts', format: 'esm' }],
  //   plugins: [dts()],
  // },
];
