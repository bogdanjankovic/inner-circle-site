import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/stratz': {
        target: 'https://api.stratz.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/stratz/, '/graphql'),
      },
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
