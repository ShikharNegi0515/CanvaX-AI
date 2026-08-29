/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('socket.io')) return 'vendor-socket';
            if (id.includes('roughjs') || id.includes('konva') || id.includes('perfect-freehand')) return 'vendor-canvas';
            if (id.includes('redux') || id.includes('zustand')) return 'vendor-redux';
            if (id.includes('react')) return 'vendor-react';
          }
        },
      },
    },
  },
})

