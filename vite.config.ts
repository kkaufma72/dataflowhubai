import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts']
  },
  server: {
    port: 5173,  // Changed port to force fresh cache
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
      port: 5173,  // Changed HMR port
      clientPort: 5173,
      overlay: true
    },
    fs: {
      strict: true,
      allow: ['.', '..']
    },
    middlewareMode: false,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  define: {
    'process.env': {},
    'global': {}
  },
  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,
    cssCodeSplit: true,
    rollupOptions: {
      external: ['swagger-ui-react', 'pg', 'neo4j-driver'], // Exclude server-side libraries
      output: {
        manualChunks: (id) => {
          // Split vendor into smaller chunks for better caching
          if (id.includes('node_modules')) {
            // Separate large libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            if (id.includes('d3')) {
              return 'd3';
            }
            if (id.includes('langchain') || id.includes('openai')) {
              return 'ai';
            }
            if (id.includes('swagger')) {
              return 'swagger';
            }
            if (id.includes('supabase')) {
              return 'supabase';
            }
            if (id.includes('stripe')) {
              return 'stripe';
            }
            // Group other vendor dependencies
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
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
      onwarn(warning, warn) {
        // Suppress LangChain circular dependency warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('@langchain')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react',
      // LangChain ES module dependencies that need pre-bundling
      'camelcase',
      'decamelize',
      'uuid',
      'p-retry',
      'p-queue',
      'semver'
    ],
    exclude: ['swagger-ui-react', 'jsdom', '@langchain/langgraph', '@langchain/core', '@langchain/openai', 'pg', 'neo4j-driver'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  preview: {
    port: 5173,  // Changed preview port
    strictPort: true,
    host: true
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
    legalComments: 'none'
  },
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
}));