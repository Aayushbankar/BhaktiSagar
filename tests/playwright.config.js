const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 150000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost/bhakti-sagar/',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'],
    },
  },
});
