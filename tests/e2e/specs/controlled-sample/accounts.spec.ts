import { expect, test } from "../../fixtures/controlled-sample/quality-test.js";
import { scenarioMetadata } from "../../support/metadata/scenario.js";

test("[TS-SAMPLE-0000000001] uses accessible locators and deterministic cleanup", async ({
  cleanup,
  controlledAccountPage,
  testDataId,
}) => {
  const metadata = scenarioMetadata("TS-SAMPLE-0000000001", [
    "REQ-SAMPLE-0000000001",
  ]);
  test.info().annotations.push({
    type: "requirements",
    description: metadata.requirementIds.join(","),
  });
  const username = testDataId("user");
  const createdUsers = new Set<string>();
  cleanup.add("sample user", () => {
    createdUsers.delete(username);
  });

  await controlledAccountPage.open();
  await controlledAccountPage.createAccount(username);
  createdUsers.add(username);

  await controlledAccountPage.expectCreated();
  expect(createdUsers.has(username)).toBe(true);
});

test("[TS-SAMPLE-0000000002] exercises scalable low-risk Playwright primitives", async ({
  controlledPreferencesPage,
}) => {
  const metadata = scenarioMetadata("TS-SAMPLE-0000000002", [
    "REQ-SAMPLE-0000000002",
  ]);
  test.info().annotations.push({
    type: "requirements",
    description: metadata.requirementIds.join(","),
  });
  await controlledPreferencesPage.open();
  await controlledPreferencesPage.selectPreferences();
  expect(await controlledPreferencesPage.preferencesAreSelected()).toBe(true);
});
