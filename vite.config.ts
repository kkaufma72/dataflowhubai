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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart': ['chart.js', 'react-chartjs-2'],
          'ui': ['lucide-react'],
          'data': ['papaparse', 'file-saver', 'jszip']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
    force: true,
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