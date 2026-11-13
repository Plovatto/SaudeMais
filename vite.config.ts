import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { buildCsp } from './src/config/csp';
import { parseEnv } from './src/config/parse-env';

const src = (path = '') => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

function staticHosting(apiUrl: string): Plugin {
  let outDir = '';
  return {
    name: 'saudemais:static-hosting',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: buildCsp(apiUrl) },
        injectTo: 'head-prepend',
      },
    ],
    async writeBundle() {
      await copyFile(join(outDir, 'index.html'), join(outDir, '404.html'));
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = command === 'build' ? parseEnv(loadEnv(mode, process.cwd(), 'VITE_')) : null;

  return {
    base: env ? '/SaudeMais/' : '/',
    plugins: [react(), tailwindcss(), env && staticHosting(env.apiUrl)],
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
      css: true,
    },
  };
});
