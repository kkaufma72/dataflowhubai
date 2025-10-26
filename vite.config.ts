import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
    host: true,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      timeout: 120000,
      protocol: 'ws',
      host: 'localhost',
      port: 3002,
      clientPort: 3002,
      overlay: true
    },
    fs: {
      strict: true,
      allow: ['.', '..']
    },
    middlewareMode: false
  },
  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only create chunks for actual dependencies that exist
          if (id.includes('node_modules')) {
            // Group all vendor dependencies together
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: ['swagger-ui-react'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  preview: {
    port: 3002,
    strictPort: true,
    host: true
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  }
}));