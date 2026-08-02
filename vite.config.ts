import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/node_modules/react/')
            || normalizedId.includes('/node_modules/react-dom/')
            || normalizedId.includes('/node_modules/scheduler/')) {
            return 'react-core';
          }

          if (normalizedId.includes('/node_modules/react-router')
            || normalizedId.includes('/node_modules/@remix-run/router/')) {
            return 'router';
          }

          if (normalizedId.includes('/node_modules/motion/')
            || normalizedId.includes('/node_modules/motion-dom/')
            || normalizedId.includes('/node_modules/motion-utils/')) {
            return 'motion';
          }

          if (normalizedId.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    // HMR отключается в AI Studio через переменную DISABLE_HMR.
    hmr: process.env.DISABLE_HMR !== 'true',
    // При отключённом HMR наблюдение за файлами не расходует CPU.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
