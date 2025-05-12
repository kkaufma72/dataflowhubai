import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.a11y.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});