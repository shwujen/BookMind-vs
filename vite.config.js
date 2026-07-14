import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyVA2cEhKV7MuaepzA5oMWiSpNlW5juIbfU-hR11HWt5rJQTk1tVhfJR9geKBfLGZNn/exec';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/gas': {
        target: GAS_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gas/, ''),
      }
    }
  }
})
