/**
 * Vitest Configuration for Property-Based Tests
 * 
 * This configuration is optimized for running property-based tests with fast-check.
 * It includes:
 * - Increased timeout for property tests (which run many iterations)
 * - Proper environment setup for jsdom
 * - Coverage configuration for property tests
 * - Reporter configuration for CI/CD
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Property tests need more time due to multiple iterations
    testTimeout: 60000, // 60 seconds per test
    hookTimeout: 60000,
    // Include only property test files
    include: ['**/*.property.test.ts'],
    // Reporter for CI/CD
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './property-test-results.json',
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/**/*.property.test.ts',
        'src/lib/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'es2020',
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        useDefineForClassFields: true,
      }
    }
  },
})
