import { defineConfig, devices } from "@playwright/test";

import factoryConfig from "./factory.config.js";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  ...(process.env["CI"] ? { workers: 1 } : {}),
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "artifacts/playwright-results.json" }],
  ],
  use: {
    baseURL: factoryConfig.baseUrl.toString(),
    screenshot: factoryConfig.evidence.screenshot,
    trace: factoryConfig.evidence.trace,
    video: factoryConfig.evidence.video,
  },
  projects: [
    {
      name: "authentication-setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["authentication-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
    {
      name: "firefox",
      dependencies: ["authentication-setup"],
      use: {
        ...devices["Desktop Firefox"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
    {
      name: "webkit",
      dependencies: ["authentication-setup"],
      use: {
        ...devices["Desktop Safari"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
  ],
});
