export function resolvePlaywrightRunPaths(
  configuredRunId: string | undefined,
  generatedRun: string | undefined,
) {
  if (
    configuredRunId !== undefined &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(configuredRunId)
  ) {
    throw new Error("FACTORY_RUN_ID must be a safe identifier");
  }
  const runId = configuredRunId ?? "local-run";
  if (generatedRun !== undefined && generatedRun !== runId) {
    throw new Error(
      "FACTORY_GENERATED_RUN must match the validated FACTORY_RUN_ID",
    );
  }
  return {
    runId,
    testDir:
      generatedRun === undefined
        ? "./tests/e2e"
        : `./artifacts/runs/${runId}/generated`,
    reportPath: `artifacts/runs/${runId}/playwright-results.json`,
  };
}

export function resolveProjectTestDirs(generatedTestDir: string) {
  return {
    authenticationSetup: "./tests/e2e",
    chromiumSmoke: generatedTestDir,
    chromium: generatedTestDir,
    firefox: generatedTestDir,
    webkit: generatedTestDir,
  } as const;
}
