import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: mode === 'production' ? [
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ] : []
      }
    })
  ],
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
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart': ['chart.js', 'react-chartjs-2'],
          'd3': ['d3'],
          'ui': ['lucide-react', 'react-hot-toast', 'react-loading-skeleton'],
          'data': ['papaparse', 'file-saver', 'jszip'],
          'swagger': ['swagger-ui-react'],
          'ai': ['openai'],
          'langchain': ['langchain', '@langchain/core', '@langchain/openai', '@langchain/community'],
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
          'stripe': ['stripe', '@stripe/stripe-js'],
          'utils': ['react-window', 'react-dnd', 'react-dnd-html5-backend', 'react-error-boundary', 'idb']
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
      target: 'esnext',
      drop: mode === 'production' ? ['console', 'debugger'] : []
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