import { defineConfig, devices } from "@playwright/test";

import factoryConfig from "./factory.config.js";
import {
  resolvePlaywrightRunPaths,
  resolveProjectTestDirs,
} from "./src/playwright/run-config.js";

const runPaths = resolvePlaywrightRunPaths(
  process.env["FACTORY_RUN_ID"],
  process.env["FACTORY_GENERATED_RUN"],
);
const projectTestDirs = resolveProjectTestDirs(runPaths.testDir);

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
    ["json", { outputFile: runPaths.reportPath }],
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
      testDir: projectTestDirs.authenticationSetup,
      testMatch: /setup\/auth\.setup\.ts/,
    },
    {
      name: "chromium-smoke",
      dependencies: ["authentication-setup"],
      testDir: projectTestDirs.chromiumSmoke,
      ...(runPaths.testDir === "./tests/e2e"
        ? { testMatch: /specs\/controlled-sample\/accounts\.spec\.ts/ }
        : {}),
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
    {
      name: "chromium",
      dependencies: ["chromium-smoke"],
      testDir: projectTestDirs.chromium,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
    {
      name: "firefox",
      dependencies: ["chromium-smoke"],
      testDir: projectTestDirs.firefox,
      use: {
        ...devices["Desktop Firefox"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
    {
      name: "webkit",
      dependencies: ["chromium-smoke"],
      testDir: projectTestDirs.webkit,
      use: {
        ...devices["Desktop Safari"],
        storageState: "playwright/.auth/authorized-user.json",
      },
    },
  ],
});
