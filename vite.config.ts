import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { parseEnv } from './src/config/parse-env';

const src = (path = '') => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig(({ command, mode }) => {
  if (command === 'build') parseEnv(loadEnv(mode, process.cwd(), 'VITE_'));

  return {
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
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      env: { VITE_API_URL: 'http://localhost:3001' },
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
