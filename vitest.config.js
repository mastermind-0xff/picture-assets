import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // end to end specs encode real images with sharp
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // src/cli.ts is the process entry, checked on the build
      exclude: [
        'src/**/*.spec.ts',
        'src/test-utils/**',
        'src/types/**',
        'src/cli.ts',
      ],
      reporter: ['text', 'html'],
      thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
  },
});
