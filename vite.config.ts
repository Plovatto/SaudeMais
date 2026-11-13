import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = (path = '') => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': src(),
      '@app': src('app'),
      '@features': src('features'),
      '@components': src('components'),
      '@hooks': src('hooks'),
      '@lib': src('lib'),
      '@constants': src('constants'),
      '@config': src('config'),
    },
  },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_URL: 'http://localhost:3001' },
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
