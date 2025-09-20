import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Override config to bypass TypeScript project reference issues
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    // Use esbuild for all TS processing, bypass tsc completely
    target: 'es2020',
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        useDefineForClassFields: true,
      }
    }
  },
  // Skip TypeScript project checking entirely
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: {}
    }
  }
})