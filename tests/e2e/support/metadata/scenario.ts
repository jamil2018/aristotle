export function scenarioMetadata(
  scenarioId: string,
  requirementIds: readonly string[],
): {
  readonly scenarioId: string;
  readonly requirementIds: readonly string[];
} {
  if (!/^TS-[A-Z0-9-]+$/.test(scenarioId)) {
    throw new Error("Scenario ID is invalid");
  }
  if (requirementIds.length === 0) {
    throw new Error("At least one requirement ID is required");
  }
  return { scenarioId, requirementIds };
}
