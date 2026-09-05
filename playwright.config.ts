import { defineConfig, devices } from '@playwright/test';

const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: `http://127.0.0.1:4173${base}`,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
