import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @ maps to src/ — all components, pages, hooks, etc. live here
      '@': path.resolve(__dirname, './src'),
    },
  },
})
