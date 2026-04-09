import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: 'e2e',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  /* Use platform-agnostic snapshot names so they work on both macOS and Linux
   * {testFilePath} is relative to {testDir}, so we need to include {testDir} in the path
   * Format: {testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}
   */
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 60000, // Increased for 3D canvas screenshot stability checks
    /**
     * Threshold for visual comparisons:
     * - threshold: Perceived color difference per pixel (0-1, default 0.2)
     * - maxDiffPixelRatio: Ratio of pixels that can differ (0-1, default very strict)
     */
    toHaveScreenshot: {
      threshold: 0.3, // Color difference tolerance per pixel
      maxDiffPixelRatio: 0.15, // Allow up to 15% of pixels to differ (within threshold)
      animations: 'disabled',
    },
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 4 : 2,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://127.0.0.1:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* On CI, WebKit needs headed mode (via --headed CLI flag) for WebGL under xvfb.
     * Don't force headless here so the CLI flag takes effect. */

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Set consistent viewport size for screenshots across all browsers */
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox']
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari']
      }
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    /**
     * Use the dev server by default for faster feedback loop.
     * Use the preview server on CI for more realistic testing.
     * Playwright will re-use the local server if there is already a dev-server running.
     * Note: preview requires a build first, so we ensure dist/ exists.
     */
    command:
      process.env.PLAYWRIGHT_USE_PREBUILT_DIST === 'true'
        ? 'yarn preview -- --host 127.0.0.1 --strictPort --port 5173'
        : 'yarn build-only && yarn preview -- --host 127.0.0.1 --strictPort --port 5173',
    port: 5173,
    reuseExistingServer: false,
    timeout: Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS ?? 180 * 1000),
  }
})
