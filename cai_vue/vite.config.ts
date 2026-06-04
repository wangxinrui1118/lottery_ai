import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/query': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/memory': 'http://localhost:8000',
      '/crawl': 'http://localhost:8000',
      '/insight': 'http://localhost:8000',
    },
  },
})
