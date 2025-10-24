import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries
          'vendor': ['react', 'react-dom', 'react-router-dom'],

          // Charting libraries
          'chart': ['chart.js', 'react-chartjs-2'],

          // Large visualization libraries
          'd3': ['d3'],

          // UI components
          'ui': ['lucide-react'],

          // Data processing
          'data': ['papaparse', 'file-saver', 'jszip'],

          // Heavy third-party libraries (lazy loaded)
          'swagger': ['swagger-ui-react'],

          // AI/ML libraries (heavy dependencies)
          'ai': ['openai'],
          'langchain': ['langchain', '@langchain/core', '@langchain/openai', '@langchain/community'],

          // Supabase and authentication
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],

          // Stripe payment processing
          'stripe': ['stripe', '@stripe/stripe-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  preview: {
    port: 3002,
    strictPort: true,
    host: true
  }
});