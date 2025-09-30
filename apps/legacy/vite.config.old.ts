import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from "lovable-tagger"
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Use custom tsconfig to avoid project reference issues
      tsDecorators: true,
    }),
    svgr(),
    // Temporarily disabled to fix h1-check.js error
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
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
  // Override TypeScript configuration completely to avoid project reference issues
  define: {
    __DEV__: mode === 'development',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
}))