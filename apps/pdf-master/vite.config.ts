import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: '/app.html',
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    open: '/app.html',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, '../../static/utilities/pdf-master'),
    rollupOptions: {
      input: path.resolve(__dirname, 'app.html'),
    },
    sourcemap: true,
    target: 'es2022',
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
