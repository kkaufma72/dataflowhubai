import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default ({ mode }) => {
  // Load environment variables from .env files for the given mode
  const env = loadEnv(mode, process.cwd(), '')

  // Optionally map VITE_ prefixed envs into process.env for plugins that expect process.env.*
  Object.keys(env).forEach((k) => {
    if (k.startsWith('VITE_')) process.env[k] = env[k]
  })

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3002,
      strictPort: false,
    },
    preview: {
      port: 3002,
      strictPort: true,
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  })
}
