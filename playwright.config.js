// @ts-check
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, 'e2e', '.env') });
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  globalSetup: require.resolve('./e2e/auth.setup.js'),
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== '0',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'auth-smoke', testMatch: /auth-smoke/, use: { channel: 'chromium' } },
    {
      name: 'order-flow',
      testMatch: /order-flow\.spec/,
      use: { channel: 'chromium', storageState: path.join(__dirname, 'e2e/.auth/user.json') },
    },
    { name: 'edit-order-legacy', testMatch: /edit-order\.spec/, use: { channel: 'chromium', storageState: path.join(__dirname, 'e2e/.auth/user.json') } },
  ],
  outputDir: 'e2e/test-results',
});
