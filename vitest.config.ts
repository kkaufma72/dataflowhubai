import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'dist/',
        'cypress/',
        'backend/',
        '**/*.test.{ts,tsx}',
        '**/*.cy.{ts,tsx}',
        '**/*.a11y.test.{ts,tsx}',
        'scripts/',
        'supabase/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
      ],
      include: [
        'src/**/*.{ts,tsx}'
      ],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      clean: true,
      skipFull: false,
    },
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/__tests__/**/*.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'cypress/',
      'backend/',
      '**/*.a11y.test.{ts,tsx}'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
