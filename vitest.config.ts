import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Only run tests in the unit tests directory
    include: ['tests/unit/**/*.test.ts'],
    // Explicitly exclude integration tests (Playwright tests)
    exclude: ['tests/integration/**', 'node_modules/**', '**/node_modules/**'],
    // Use node environment for unit tests
    environment: 'node',
    // Globals available (describe, it, expect, etc.)
    globals: true,
  },
  resolve: {
    // Configure path alias to match tsconfig.json
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

