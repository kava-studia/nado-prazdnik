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
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['motion'],
          icons: ['lucide-react'],
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
