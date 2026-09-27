import { defineConfig, devices } from "@playwright/test";

// Live-site smoke suite. Read-only by design: tests never submit forms to
// production (no contact/discovery/unsubscribe POSTs), they only assert
// rendering, client-side validation, and response headers.
export default defineConfig({
  testDir: "./e2e",
  // Live site: be gentle — 2 workers, generous timeouts.
  fullyParallel: false,
  workers: 2,
  timeout: 90000,
  retries: 1,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    // Default to the live site. Override with E2E_BASE_URL to run the same
    // suite against a local dev server, which is how logic changes get proven
    // before they are deployed.
    baseURL: process.env.E2E_BASE_URL ?? "https://www.shenodev.tech",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 60000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
