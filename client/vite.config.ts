import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disable TypeScript checking in development and production
      babel: {
        plugins: []
      }
    })
  ],
  // Disable TypeScript checks completely
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
