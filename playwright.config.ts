import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for lead → coupon E2E tests.
 *
 * Requires the dev server running at http://localhost:8080 and `.env` to
 * expose SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY
 * (already provided by Lovable Cloud).
 *
 * Override PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to point at a Chromium
 * binary on machines where `playwright install chromium` was not run.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 900 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
