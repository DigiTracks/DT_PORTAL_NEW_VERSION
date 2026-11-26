import fs from "node:fs";
import { defineConfig } from "@playwright/test";

const systemChromium = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
const leadEndpoint = "http://127.0.0.1:4331/api/lead";
const origins = [
  { name: "sourcecraft", port: 4333 },
  { name: "procuresherpa", port: 4334 }
] as const;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "analytics.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-analytics" }]],
  use: {
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: systemChromium ? { executablePath: systemChromium, args: ["--no-sandbox"] } : undefined
  },
  webServer: origins.map(({ name, port }) => ({
    command: `PUBLIC_LEAD_ENDPOINT=${leadEndpoint} pnpm --filter @digitracks/${name} exec astro dev --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }))
});
