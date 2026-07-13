import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for lead → coupon E2E tests.
 *
 * Requires the dev server to be running at http://localhost:8080.
 * The tests provision a throw-away Supabase user via the service role key,
 * so `.env` must expose SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and
 * SUPABASE_SERVICE_ROLE_KEY (already present in Lovable Cloud projects).
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
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
