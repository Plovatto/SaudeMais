import { defineConfig, devices } from '@playwright/test';
import { API_URL, WEB_ORIGIN } from './e2e/support/env';

const CI = Boolean(process.env.CI);

const viewports = {
  mobile: { width: 402, height: 874 },
  desktop: { width: 1280, height: 800 },
};

const browsers = {
  chromium: devices['Desktop Chrome'],
  webkit: devices['Desktop Safari'],
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: CI,
  retries: 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `${WEB_ORIGIN}/SaudeMais/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    ...Object.entries(browsers).flatMap(([browser, device]) =>
      Object.entries(viewports).map(([size, viewport]) => ({
        name: `${browser}-${size}`,
        testMatch: /\.spec\.ts/,
        dependencies: ['setup'],
        use: { ...device, viewport },
      })),
    ),
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --strictPort',
    url: `${WEB_ORIGIN}/SaudeMais/`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    env: { VITE_API_URL: API_URL },
  },
});
