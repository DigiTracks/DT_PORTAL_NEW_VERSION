import fs from "node:fs";
import { defineConfig } from "@playwright/test";

const systemChromium = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
const previewOrigins = [
  { name: "portal", port: 4321 },
  { name: "learn", port: 4322 },
  { name: "sourcecraft", port: 4323 },
  { name: "procuresherpa", port: 4324 },
  { name: "learnpmo", port: 4325 },
  { name: "hcmfusion", port: 4326 },
] as const;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/lead-form.spec.ts", "**/analytics.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4321",
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: systemChromium ? { executablePath: systemChromium, args: ["--no-sandbox"] } : undefined
  },
  webServer: previewOrigins.map(({ name, port }) => ({
    command: `pnpm --filter @digitracks/${name} preview`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }))
});
