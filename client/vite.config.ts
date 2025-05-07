import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [unocss(), vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5556',
        changeOrigin: true,
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
})
