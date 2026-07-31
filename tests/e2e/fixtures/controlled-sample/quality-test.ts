import { test as base } from "@playwright/test";

import {
  createCleanupRegistry,
  createDeterministicTestId,
} from "../../../../src/playwright/pipeline.js";
import { ControlledAccountPage } from "../../pages/controlled-sample/account/account.page.js";
import { ControlledPreferencesPage } from "../../pages/controlled-sample/preferences/preferences.page.js";

interface QualityFixtures {
  readonly cleanup: ReturnType<typeof createCleanupRegistry>;
  readonly controlledAccountPage: ControlledAccountPage;
  readonly controlledPreferencesPage: ControlledPreferencesPage;
  readonly testDataId: (prefix: string) => string;
}

export const test = base.extend<QualityFixtures>({
  cleanup: async ({}, use) => {
    const cleanup = createCleanupRegistry();
    await use(cleanup);
    await cleanup.run();
  },
  controlledAccountPage: async ({ page }, use) => {
    await use(new ControlledAccountPage(page));
  },
  controlledPreferencesPage: async ({ page }, use) => {
    await use(new ControlledPreferencesPage(page));
  },
  testDataId: async ({}, use, testInfo) => {
    const runId = process.env["FACTORY_RUN_ID"] ?? "local-run";
    await use((prefix) =>
      createDeterministicTestId(
        `${runId}-${String(testInfo.workerIndex)}`,
        prefix,
      ),
    );
  },
});

export { expect } from "@playwright/test";
