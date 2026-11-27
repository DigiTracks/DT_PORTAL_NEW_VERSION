import { defineConfig } from "@playwright/test";

const configuredOrigin = process.env.PLAYWRIGHT_PREVIEW_ORIGIN ?? "http://127.0.0.1:4331";
const leadEndpoint = process.env.PLAYWRIGHT_LEAD_ENDPOINT ?? `${configuredOrigin}/api/lead`;
const testSiteKey = "1x00000000000000000000AA";
const forceServer = process.env.PLAYWRIGHT_FORCE_SERVER === "1" ? " --force" : "";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "lead-form.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-lead-form" }]],
  use: {
    baseURL: configuredOrigin,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] }
  },
  webServer: {
    command: `PUBLIC_LEAD_ENDPOINT=${leadEndpoint} PUBLIC_TURNSTILE_SITE_KEY=${testSiteKey} pnpm --filter @digitracks/portal exec astro dev --host 127.0.0.1 --port ${new URL(configuredOrigin).port}${forceServer}`,
    url: configuredOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
