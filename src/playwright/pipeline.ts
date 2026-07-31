import { createHash } from "node:crypto";

import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import { normalizedRequirementsSchema } from "../requirements/contracts.js";
import type { NormalizedRequirements } from "../requirements/analysis.js";
import { assertGeneratedTestPath } from "../remediation/artifact-integrity.js";
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
  capabilityExtensionProposalSchema,
  capabilityExtensionRecordSchema,
  executionSummarySchema,
  playwrightPreflightSchema,
  playwrightTestMetadataSchema,
  type AutomationPlan,
  type AutomationLocator,
  type CapabilityExtensionProposal,
  type CapabilityExtensionRecord,
  type ExecutionSummary,
  type PlaywrightTestMetadata,
  type PlaywrightPreflight,
} from "./contracts.js";

interface GeneratePlaywrightTestInput {
  readonly runId: string;
  readonly requirements: NormalizedRequirements;
  readonly specification: ScenarioSpecification;
  readonly evaluation: ScenarioEvaluation;
  readonly review: HumanScenarioReview;
  readonly scenarioId: string;
  readonly plan: AutomationPlan;
  readonly preflight: Omit<PlaywrightPreflight, "plan">;
}

export interface GeneratedPlaywrightTest {
  readonly metadata: PlaywrightTestMetadata;
  readonly source: string;
  readonly outputPath: string;
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
  runPlaywrightPreflight({ ...input.preflight, plan });

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
    outputPath: assertGeneratedTestPath(
      `artifacts/runs/${input.runId}/generated/${testId}.spec.ts`,
    ),
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

type AutomationAction = AutomationPlan["actions"][number];
type InteractionAction = Extract<
  AutomationAction,
  {
    kind:
      | "FILL"
      | "CLICK"
      | "CLEAR"
      | "NAVIGATE"
      | "CHECK"
      | "UNCHECK"
      | "SELECT_OPTION"
      | "PRESS_KEY";
  }
>;

const interactionKinds = new Set<AutomationAction["kind"]>([
  "FILL",
  "CLICK",
  "CLEAR",
  "NAVIGATE",
  "CHECK",
  "UNCHECK",
  "SELECT_OPTION",
  "PRESS_KEY",
]);

function renderAction(action: AutomationAction): string {
  return isInteractionAction(action)
    ? renderInteraction(action)
    : renderAssertion(action);
}

function isInteractionAction(
  action: AutomationAction,
): action is InteractionAction {
  return interactionKinds.has(action.kind);
}

function renderInteraction(action: InteractionAction): string {
  switch (action.kind) {
    case "FILL":
      return [
        `await ${renderLocator(action.locator)}.fill(`,
        `requireEnvironmentVariable(${JSON.stringify(action.valueEnvironmentVariable)}),`,
        ");",
      ].join("");
    case "CLICK":
      return `await ${renderLocator(action.locator)}.click();`;
    case "CLEAR":
      return `await ${renderLocator(action.locator)}.clear();`;
    case "NAVIGATE":
      return `await page.goto(${JSON.stringify(action.path)});`;
    case "CHECK":
      return `await ${renderLocator(action.locator)}.check();`;
    case "UNCHECK":
      return `await ${renderLocator(action.locator)}.uncheck();`;
    case "SELECT_OPTION":
      return `await ${renderLocator(action.locator)}.selectOption(${JSON.stringify(action.value)});`;
    case "PRESS_KEY":
      return `await ${renderLocator(action.locator)}.press(${JSON.stringify(action.key)});`;
  }
}

function renderAssertion(
  action: Exclude<AutomationAction, InteractionAction>,
): string {
  if (visibilityAssertionKinds.has(action.kind)) {
    return renderVisibilityAssertion(
      action as Extract<
        AutomationAction,
        { kind: "EXPECT_VISIBLE" | "EXPECT_HIDDEN" | "EXPECT_ABSENT" }
      >,
    );
  }
  if (nativeAssertionKinds.has(action.kind)) {
    return renderNativeAssertion(
      action as Extract<
        AutomationAction,
        {
          kind: "EXPECT_NATIVE_VALIDITY" | "EXPECT_NATIVE_VALIDATION_MESSAGE";
        }
      >,
    );
  }
  switch (action.kind) {
    case "EXPECT_ENABLED":
      return `await expect(${renderLocator(action.locator)}).toBeEnabled();`;
    case "EXPECT_CHECKED":
      return `await expect(${renderLocator(action.locator)}).toBeChecked();`;
    case "EXPECT_TEXT":
      return `await expect(${renderLocator(action.locator)}).toHaveText(${JSON.stringify(action.text)});`;
    case "EXPECT_VALUE":
      return `await expect(${renderLocator(action.locator)}).toHaveValue(${JSON.stringify(action.value)});`;
    case "EXPECT_COUNT":
      return `await expect(${renderLocator(action.locator)}).toHaveCount(${String(action.count)});`;
    case "EXPECT_URL":
      return `await expect(page).toHaveURL(new RegExp(${JSON.stringify(`${escapeRegExp(action.path)}$`)}));`;
  }
  throw new Error("Unsupported assertion");
}

const visibilityAssertionKinds = new Set<AutomationAction["kind"]>([
  "EXPECT_VISIBLE",
  "EXPECT_HIDDEN",
  "EXPECT_ABSENT",
]);
const nativeAssertionKinds = new Set<AutomationAction["kind"]>([
  "EXPECT_NATIVE_VALIDITY",
  "EXPECT_NATIVE_VALIDATION_MESSAGE",
]);

function renderVisibilityAssertion(
  action: Extract<
    AutomationAction,
    { kind: "EXPECT_VISIBLE" | "EXPECT_HIDDEN" | "EXPECT_ABSENT" }
  >,
): string {
  if (action.kind === "EXPECT_VISIBLE") {
    return `await expect(${renderLocator(action.locator)}).toBeVisible();`;
  }
  return action.kind === "EXPECT_HIDDEN"
    ? `await expect(${renderLocator(action.locator)}).toBeHidden();`
    : `await expect(${renderLocator(action.locator)}).toHaveCount(0);`;
}

function renderNativeAssertion(
  action: Extract<
    AutomationAction,
    {
      kind: "EXPECT_NATIVE_VALIDITY" | "EXPECT_NATIVE_VALIDATION_MESSAGE";
    }
  >,
): string {
  return action.kind === "EXPECT_NATIVE_VALIDITY"
    ? `await expect(${renderLocator(action.locator)}).toHaveJSProperty("validity", expect.objectContaining({ valid: ${String(action.valid)} }));`
    : `await expect(${renderLocator(action.locator)}).toHaveJSProperty("validationMessage", ${JSON.stringify(action.message)});`;
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
      return (locator.attribute ?? "data-testid") === "data-testid"
        ? `page.getByTestId(${JSON.stringify(locator.value)})`
        : `page.locator(${JSON.stringify(`[${locator.attribute ?? "data-testid"}="${locator.value}"]`)})`;
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

export function registerBrowserMatrix(
  summariesInput: readonly ExecutionSummary[],
  expectedTestIds: readonly string[],
): readonly ExecutionSummary[] {
  const summaries = summariesInput.map((summary) =>
    executionSummarySchema.parse(summary),
  );
  const required = ["chromium-smoke", "chromium", "firefox", "webkit"];
  if (expectedTestIds.length === 0) {
    throw new Error("Browser matrix requires at least one expected candidate");
  }
  if (new Set(summaries.map((summary) => summary.runId)).size !== 1) {
    throw new Error("Browser matrix summaries must belong to the same run");
  }
  for (const project of required) {
    const summary = summaries.find(
      (candidate) => candidate.project === project,
    );
    if (summary === undefined) {
      throw new Error(
        `Browser matrix is missing registered ${project} evidence`,
      );
    }
    requireProjectEvidence(summary, expectedTestIds);
  }
  const smoke = summaries.find(
    (summary) => summary.project === "chromium-smoke",
  );
  if (
    smoke?.tests.some(
      (test) =>
        expectedTestIds.includes(test.testId) && test.status !== "PASSED",
    ) !== false
  ) {
    throw new Error(
      "Chromium smoke must pass before registering the browser matrix",
    );
  }
  return summaries;
}

function requireProjectEvidence(
  summary: ExecutionSummary,
  expectedTestIds: readonly string[],
): void {
  for (const testId of expectedTestIds) {
    const result = summary.tests.find((test) => test.testId === testId);
    if (result === undefined || result.evidence.length === 0) {
      throw new Error(`${summary.project} is missing evidence for ${testId}`);
    }
    if (result.status === "SKIPPED" || result.status === "TIMED_OUT") {
      throw new Error(
        `${summary.project} did not execute or classify ${testId}`,
      );
    }
  }
}

export function runPlaywrightPreflight(input: unknown) {
  const preflight = playwrightPreflightSchema.parse(input);
  if (preflight.baseOrigin !== preflight.allowedOrigin) {
    throw new Error("Preflight origin is outside the task-scoped allowlist");
  }
  const requiredEnvironment = preflight.plan.actions.flatMap((action) =>
    action.kind === "FILL" ? [action.valueEnvironmentVariable] : [],
  );
  const missingEnvironment = requiredEnvironment.filter(
    (name) => !preflight.configuredEnvironmentVariables.includes(name),
  );
  if (missingEnvironment.length > 0) {
    throw new Error(
      `Preflight missing environment variables: ${missingEnvironment.join(", ")}`,
    );
  }
  const incompatible = preflight.plan.actions
    .map((action) => action.kind)
    .filter((kind) => !preflight.rendererActionKinds.includes(kind));
  if (incompatible.length > 0) {
    throw new Error(
      `Preflight renderer does not support: ${[...new Set(incompatible)].join(", ")}`,
    );
  }
  for (const action of preflight.plan.actions) {
    if (
      "locator" in action &&
      action.locator.kind === "TEST_ID" &&
      (action.locator.attribute ?? "data-testid") !== preflight.testIdAttribute
    ) {
      throw new Error(
        "Preflight test-ID attribute does not match locator configuration",
      );
    }
  }
  return {
    ready: true as const,
    smokeProject: "chromium-smoke" as const,
    fullProjects: ["chromium", "firefox", "webkit"] as const,
  };
}

export interface CapabilityExtensionClassification {
  readonly disposition: "AUTO_APPROVED" | "HUMAN_REVIEW_REQUIRED";
  readonly reasons: readonly string[];
  readonly policyVersion: 1;
}

const automaticCapabilityApis: Readonly<
  Record<"INTERACTION" | "ASSERTION", ReadonlySet<string>>
> = {
  INTERACTION: new Set([
    "locator.blur",
    "locator.check",
    "locator.clear",
    "locator.click",
    "locator.dblclick",
    "locator.fill",
    "locator.focus",
    "locator.hover",
    "locator.press",
    "locator.selectOption",
    "locator.tap",
    "locator.uncheck",
  ]),
  ASSERTION: new Set([
    "expect.toBeAttached",
    "expect.toBeChecked",
    "expect.toBeDisabled",
    "expect.toBeEditable",
    "expect.toBeEmpty",
    "expect.toBeEnabled",
    "expect.toBeFocused",
    "expect.toBeHidden",
    "expect.toBeInViewport",
    "expect.toBeVisible",
    "expect.toContainText",
    "expect.toHaveAttribute",
    "expect.toHaveClass",
    "expect.toHaveCount",
    "expect.toHaveCSS",
    "expect.toHaveId",
    "expect.toHaveJSProperty",
    "expect.toHaveRole",
    "expect.toHaveText",
    "expect.toHaveValue",
    "expect.toHaveValues",
  ]),
};

export function classifyCapabilityExtension(
  proposalInput: CapabilityExtensionProposal,
): CapabilityExtensionClassification {
  const proposal = capabilityExtensionProposalSchema.parse(proposalInput);
  const reviewReasons = capabilityReviewReasons(proposal);
  if (reviewReasons.length > 0) {
    return {
      disposition: "HUMAN_REVIEW_REQUIRED",
      reasons: reviewReasons,
      policyVersion: 1,
    };
  }
  return {
    disposition: "AUTO_APPROVED",
    reasons: [
      "Capability is a deterministic locator-based interaction or assertion within policy.",
    ],
    policyVersion: 1,
  };
}

function capabilityReviewReasons(
  proposal: CapabilityExtensionProposal,
): string[] {
  const reasons: string[] = [];
  if (
    proposal.category !== "INTERACTION" &&
    proposal.category !== "ASSERTION"
  ) {
    reasons.push(`Category ${proposal.category} is outside automatic policy.`);
  } else if (
    !automaticCapabilityApis[proposal.category].has(proposal.playwrightApi)
  ) {
    reasons.push(
      `Playwright API ${proposal.playwrightApi} is outside the versioned automatic catalog.`,
    );
  }
  if (!proposal.usesExistingLocator) {
    reasons.push("Capability requires a new locator boundary.");
  }
  if (!proposal.deterministicRenderer) {
    reasons.push("Capability renderer is not deterministic.");
  }
  const sensitiveFlags: readonly [keyof CapabilityExtensionProposal, string][] =
    [
      ["requiresArbitraryCode", "Capability executes arbitrary code."],
      ["accessesExternalOrigin", "Capability accesses an external origin."],
      ["changesBrowserPermissions", "Capability changes browser permissions."],
      ["accessesFileSystem", "Capability accesses the filesystem."],
      [
        "changesAuthenticationState",
        "Capability changes authentication state.",
      ],
      ["performsDestructiveWrite", "Capability performs a destructive write."],
      ["addsDependency", "Capability adds or changes a dependency."],
    ];
  for (const [flag, reason] of sensitiveFlags) {
    if (proposal[flag] === true) reasons.push(reason);
  }
  return reasons;
}

interface CreateCapabilityExtensionRecordInput {
  readonly runId: string;
  readonly actorId: "playwright-test-engineer";
  readonly proposal: CapabilityExtensionProposal;
  readonly existingRecords: readonly CapabilityExtensionRecord[];
  readonly requestedDisposition?: "AUTO_APPROVED" | "HUMAN_REVIEW_REQUIRED";
}

export function createCapabilityExtensionRecord(
  input: CreateCapabilityExtensionRecordInput,
): CapabilityExtensionRecord {
  const proposal = capabilityExtensionProposalSchema.parse(input.proposal);
  const classification = classifyCapabilityExtension(proposal);
  const existingAutomaticExtensions = input.existingRecords
    .map(validateCapabilityExtensionRecord)
    .filter(
      (record) =>
        record.runId === input.runId && record.disposition === "AUTO_APPROVED",
    ).length;
  if (
    classification.disposition === "AUTO_APPROVED" &&
    existingAutomaticExtensions >= 1
  ) {
    throw new Error(
      "Only one automatic capability extension is permitted per run",
    );
  }
  return capabilityExtensionRecordSchema.parse({
    schemaVersion: 1,
    runId: input.runId,
    actorId: input.actorId,
    policyVersion: classification.policyVersion,
    proposal,
    proposalChecksum: semanticChecksum(proposal),
    disposition: classification.disposition,
    reasons: classification.reasons,
  });
}

function validateCapabilityExtensionRecord(
  input: CapabilityExtensionRecord,
): CapabilityExtensionRecord {
  const record = capabilityExtensionRecordSchema.parse(input);
  if (record.proposalChecksum !== semanticChecksum(record.proposal)) {
    throw new Error("Capability extension proposal checksum is invalid");
  }
  return record;
}
