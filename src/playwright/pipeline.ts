import { createHash } from "node:crypto";

import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import { normalizedRequirementsSchema } from "../requirements/contracts.js";
import type { NormalizedRequirements } from "../requirements/analysis.js";
import {
  humanScenarioReviewSchema,
  scenarioEvaluationSchema,
  scenarioSpecificationSchema,
  type HumanScenarioReview,
  type ScenarioEvaluation,
  type ScenarioSpecification,
} from "../scenarios/contracts.js";
import {
  automationPlanSchema,
  executionSummarySchema,
  playwrightTestMetadataSchema,
  type AutomationPlan,
  type AutomationLocator,
  type ExecutionSummary,
  type PlaywrightTestMetadata,
} from "./contracts.js";

interface GeneratePlaywrightTestInput {
  readonly requirements: NormalizedRequirements;
  readonly specification: ScenarioSpecification;
  readonly evaluation: ScenarioEvaluation;
  readonly review: HumanScenarioReview;
  readonly scenarioId: string;
  readonly plan: AutomationPlan;
}

export interface GeneratedPlaywrightTest {
  readonly metadata: PlaywrightTestMetadata;
  readonly source: string;
}

export function generatePlaywrightTest(
  input: GeneratePlaywrightTestInput,
): GeneratedPlaywrightTest {
  const requirements = normalizedRequirementsSchema.parse(input.requirements);
  const specification = scenarioSpecificationSchema.parse(input.specification);
  const evaluation = scenarioEvaluationSchema.parse(input.evaluation);
  const review = humanScenarioReviewSchema.parse(input.review);
  const plan = automationPlanSchema.parse(input.plan);
  const scenarioChecksum = semanticChecksum(specification);

  if (
    evaluation.disposition !== "PASS" ||
    evaluation.scenarioRevision !== specification.revision ||
    evaluation.scenarioChecksum !== scenarioChecksum
  ) {
    throw new Error(
      "Playwright generation requires evaluator PASS for the exact scenario revision",
    );
  }
  if (
    review.scenarioRevision !== specification.revision ||
    review.scenarioChecksum !== scenarioChecksum ||
    review.evaluationChecksum !== semanticChecksum(evaluation)
  ) {
    throw new Error(
      "Playwright generation requires human approval for the exact scenario revision and evaluation",
    );
  }
  if (review.exclusions.includes(input.scenarioId)) {
    throw new Error("The selected scenario was excluded from human approval");
  }

  const scenario = specification.scenarios.find(
    (candidate) => candidate.scenarioId === input.scenarioId,
  );
  if (scenario === undefined) {
    throw new Error("The selected scenario does not exist");
  }
  if (scenario.automation !== "CANDIDATE") {
    throw new Error("Only automation-candidate scenarios may generate tests");
  }
  const requirementIds = new Set(
    requirements.requirements.map((requirement) => requirement.requirementId),
  );
  if (
    specification.requirementRevision !== requirements.revision ||
    specification.requirementChecksum !== semanticChecksum(requirements) ||
    scenario.requirementIds.some(
      (requirementId) => !requirementIds.has(requirementId),
    )
  ) {
    throw new Error(
      "Scenario requirements do not match the exact normalized requirement revision",
    );
  }

  const testId = createTestId(scenario.scenarioId);
  const metadata = playwrightTestMetadataSchema.parse({
    schemaVersion: 1,
    testId,
    scenarioId: scenario.scenarioId,
    scenarioRevision: specification.revision,
    scenarioChecksum,
    requirementRevision: requirements.revision,
    requirementChecksum: semanticChecksum(requirements),
    requirementIds: scenario.requirementIds,
  });
  return {
    metadata,
    source: renderTestSource(metadata, scenario.title, plan),
  };
}

function renderTestSource(
  metadata: PlaywrightTestMetadata,
  title: string,
  plan: AutomationPlan,
): string {
  const actions = plan.actions.map(renderAction);
  return [
    'import { expect, test } from "@playwright/test";',
    "",
    `// quality-metadata: ${JSON.stringify(metadata)}`,
    "function requireEnvironmentVariable(name: string): string {",
    "  const value = process.env[name];",
    "  if (value === undefined || value.length === 0) {",
    "    throw new Error(`Required test environment variable ${name} is missing`);",
    "  }",
    "  return value;",
    "}",
    "",
    `test(${JSON.stringify(`[${metadata.scenarioId}] ${title}`)}, async ({ page }) => {`,
    `  await page.goto(${JSON.stringify(plan.route)});`,
    ...actions.map((action) => `  ${action}`),
    "});",
    "",
  ].join("\n");
}

function renderAction(action: AutomationPlan["actions"][number]): string {
  switch (action.kind) {
    case "FILL":
      return [
        `await ${renderLocator(action.locator)}.fill(`,
        `requireEnvironmentVariable(${JSON.stringify(action.valueEnvironmentVariable)}),`,
        ");",
      ].join("");
    case "CLICK":
      return `await ${renderLocator(action.locator)}.click();`;
    case "EXPECT_VISIBLE":
      return `await expect(${renderLocator(action.locator)}).toBeVisible();`;
    case "EXPECT_TEXT":
      return `await expect(${renderLocator(action.locator)}).toHaveText(${JSON.stringify(action.text)});`;
    case "EXPECT_URL":
      return `await expect(page).toHaveURL(new RegExp(${JSON.stringify(`${escapeRegExp(action.path)}$`)}));`;
  }
}

function renderLocator(locator: AutomationLocator): string {
  switch (locator.kind) {
    case "ROLE":
      return `page.getByRole(${JSON.stringify(locator.role)}, { name: ${JSON.stringify(locator.name)} })`;
    case "LABEL":
      return `page.getByLabel(${JSON.stringify(locator.value)})`;
    case "PLACEHOLDER":
      return `page.getByPlaceholder(${JSON.stringify(locator.value)})`;
    case "TEST_ID":
      return `page.getByTestId(${JSON.stringify(locator.value)})`;
  }
  throw new Error("Unsupported locator");
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createTestId(scenarioId: string): string {
  return `pw-${scenarioId.toLowerCase()}`;
}

export function createDeterministicTestId(
  runId: string,
  prefix: string,
): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(runId)) {
    throw new Error("Run ID must be a safe identifier");
  }
  if (!/^[a-z][a-z0-9-]*$/.test(prefix)) {
    throw new Error("Test-data prefix must be a safe identifier");
  }
  const suffix = createHash("sha256")
    .update(`${runId}:${prefix}`)
    .digest("hex")
    .slice(0, 12);
  return `${prefix}-${suffix}`;
}

interface CleanupRegistry {
  readonly add: (name: string, cleanup: () => void | Promise<void>) => void;
  readonly run: () => Promise<void>;
}

export function createCleanupRegistry(): CleanupRegistry {
  const tasks: { readonly name: string; readonly cleanup: () => unknown }[] =
    [];
  return {
    add(name, cleanup) {
      if (name.trim().length === 0) throw new Error("Cleanup name is required");
      tasks.push({ name, cleanup });
    },
    async run() {
      const errors: Error[] = [];
      for (const task of tasks.reverse()) {
        try {
          await task.cleanup();
        } catch (error) {
          errors.push(
            new Error(`Cleanup failed for ${task.name}`, { cause: error }),
          );
        }
      }
      tasks.length = 0;
      if (errors.length > 0) {
        throw new AggregateError(
          errors,
          errors.map((error) => error.message).join(", "),
        );
      }
    },
  };
}

export function createExecutionSummary(
  input: Omit<ExecutionSummary, "schemaVersion">,
) {
  return executionSummarySchema.parse({ schemaVersion: 1, ...input });
}
