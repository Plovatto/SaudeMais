import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { buildCsp, type CspAnalytics } from './src/config/csp';
import { parseEnv } from './src/config/parse-env';
import { seoPages } from './seo/pages';

const src = (path = '') => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

function staticHosting(apiUrl: string, analytics: CspAnalytics): Plugin {
  return {
    name: 'saudemais:static-hosting',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: buildCsp(apiUrl, analytics) },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ command, mode }) => {
  const env = command === 'build' ? parseEnv(loadEnv(mode, process.cwd(), 'VITE_')) : null;

  return {
    plugins: [react(), tailwindcss(), seoPages(), env && staticHosting(env.apiUrl, env.analytics)],
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
      setupFiles: ['./src/test/animation-event.ts', './src/test/setup.ts'],
      env: { VITE_API_URL: 'http://localhost:3001' },
      include: ['src/**/*.test.{ts,tsx}', 'seo/**/*.test.ts'],
      css: true,
    },
  };
});
