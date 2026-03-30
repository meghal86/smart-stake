import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Override config to bypass TypeScript project reference issues
export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    '__HMR_CONFIG_NAME__': '"default"',
    'process.env': {}
  },
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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Suppress circular dependency warnings from framer-motion internals
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        defaultHandler(warning);
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'web3-vendor': ['wagmi', 'viem', '@rainbow-me/rainbowkit', 'ethers'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
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
    esbuildOptions: {},
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@radix-ui/react-dialog', 'lucide-react',
      'framer-motion', 'motion-dom'
    ]
  }
})