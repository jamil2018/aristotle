import { test as base } from "@playwright/test";

import {
  createCleanupRegistry,
  createDeterministicTestId,
} from "../../../src/playwright/pipeline.js";

interface QualityFixtures {
  readonly cleanup: ReturnType<typeof createCleanupRegistry>;
  readonly testDataId: (prefix: string) => string;
}

export const test = base.extend<QualityFixtures>({
  cleanup: async ({}, use) => {
    const cleanup = createCleanupRegistry();
    await use(cleanup);
    await cleanup.run();
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
