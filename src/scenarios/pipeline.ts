import { createHash } from "node:crypto";

import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import type { NormalizedRequirements } from "../requirements/analysis.js";
import { normalizedRequirementsSchema } from "../requirements/contracts.js";
import type { Actor } from "../schemas/contracts.js";
import {
  humanScenarioReviewSchema,
  scenarioEvaluationSchema,
  scenarioSpecificationSchema,
  type HumanScenarioReview,
  type Scenario,
  type ScenarioEvaluation,
  type ScenarioSpecification,
} from "./contracts.js";

const MAX_REVISION_CYCLES = 3;

export function generateScenarioSpecification(
  requirementsInput: NormalizedRequirements,
): ScenarioSpecification {
  const requirements = normalizedRequirementsSchema.parse(requirementsInput);
  const scenarios = requirements.requirements
    .filter(
      (requirement) => requirement.classification === "STATED_REQUIREMENT",
    )
    .flatMap((requirement) => scenariosFor(requirement));
  if (scenarios.length === 0) {
    throw new Error("Scenario generation requires stated requirements");
  }
  return scenarioSpecificationSchema.parse({
    schemaVersion: 1,
    revision: 1,
    revisionCycle: 0,
    requirementRevision: requirements.revision,
    requirementChecksum: semanticChecksum(requirements),
    scenarios,
    removedScenarios: [],
    evaluation: "PENDING",
    humanReview: "PENDING",
  });
}

export function projectScenarioMarkdown(
  specificationInput: ScenarioSpecification,
): string {
  const specification = scenarioSpecificationSchema.parse(specificationInput);
  const header = [
    "# Test scenarios",
    "",
    `**Schema version:** ${String(specification.schemaVersion)}`,
    `**Scenario revision:** ${String(specification.revision)}`,
    `**Requirement revision:** ${String(specification.requirementRevision)}`,
    `**Requirement checksum:** ${specification.requirementChecksum}`,
    "",
  ];
  const scenarios = specification.scenarios.flatMap(renderScenario);
  return [...header, ...scenarios].join("\n").trimEnd() + "\n";
}

export function validateScenarioProjection(
  authoritativeMarkdown: string,
  projectionInput: ScenarioSpecification,
): { readonly semanticChecksum: string } {
  const projection = scenarioSpecificationSchema.parse(projectionInput);
  if (
    normalizeMarkdown(authoritativeMarkdown) !==
    projectScenarioMarkdown(projection)
  ) {
    throw new Error(
      "JSON scenario projection disagrees with authoritative Markdown",
    );
  }
  return { semanticChecksum: semanticChecksum(projection) };
}

export function evaluateScenarios(
  requirementsInput: NormalizedRequirements,
  specificationInput: ScenarioSpecification,
): ScenarioEvaluation {
  const requirements = normalizedRequirementsSchema.parse(requirementsInput);
  const specification = scenarioSpecificationSchema.parse(specificationInput);
  const knownRequirementIds = new Set(
    requirements.requirements
      .filter(
        (requirement) => requirement.classification === "STATED_REQUIREMENT",
      )
      .map((requirement) => requirement.requirementId),
  );
  const findings: ScenarioEvaluation["findings"][number][] = [];
  findings.push(
    ...findScenarioFindings(specification.scenarios, knownRequirementIds),
    ...findCoverageFindings(requirements, specification.scenarios),
    ...findDuplicateScenarios(specification.scenarios),
  );

  const disposition = findings.some(
    (finding) => finding.kind === "UNKNOWN_REQUIREMENT",
  )
    ? "BLOCKED"
    : findings.length > 0
      ? "REVISE"
      : "PASS";
  return scenarioEvaluationSchema.parse({
    schemaVersion: 1,
    scenarioRevision: specification.revision,
    scenarioChecksum: semanticChecksum(specification),
    disposition,
    findings,
  });
}

function findScenarioFindings(
  scenarios: readonly Scenario[],
  knownRequirementIds: ReadonlySet<string>,
): ScenarioEvaluation["findings"] {
  return scenarios.flatMap((scenario) => [
    ...referenceFindings(scenario, knownRequirementIds),
    ...qualityFindings(scenario),
  ]);
}

function referenceFindings(
  scenario: Scenario,
  knownRequirementIds: ReadonlySet<string>,
): ScenarioEvaluation["findings"] {
  const unknown = scenario.requirementIds.filter(
    (requirementId) => !knownRequirementIds.has(requirementId),
  );
  return unknown.length === 0
    ? []
    : [
        {
          kind: "UNKNOWN_REQUIREMENT",
          message:
            "Scenario references requirements outside the approved revision.",
          requirementIds: unknown,
          scenarioIds: [scenario.scenarioId],
        },
      ];
}

function qualityFindings(scenario: Scenario): ScenarioEvaluation["findings"] {
  return [
    ...setupFindings(scenario),
    ...outcomeFindings(scenario),
    ...feasibilityFindings(scenario),
  ];
}

function setupFindings(scenario: Scenario): ScenarioEvaluation["findings"] {
  const findings: ScenarioEvaluation["findings"][number][] = [];
  if (
    scenario.preconditions.length === 0 ||
    scenario.testData.length === 0 ||
    scenario.cleanup.length === 0
  ) {
    findings.push({
      kind: "MISSING_STATE_SETUP",
      message: "Scenario must define state setup, concrete data, and cleanup.",
      requirementIds: scenario.requirementIds,
      scenarioIds: [scenario.scenarioId],
    });
  }
  return findings;
}

function outcomeFindings(scenario: Scenario): ScenarioEvaluation["findings"] {
  const findings: ScenarioEvaluation["findings"][number][] = [];
  if (
    scenario.steps.some((step) =>
      /works|appropriate|correctly/i.test(step.expectedResult),
    )
  ) {
    findings.push({
      kind: "UNOBSERVABLE_RESULT",
      message: "Scenario contains a vague or unobservable expected result.",
      requirementIds: scenario.requirementIds,
      scenarioIds: [scenario.scenarioId],
    });
  }
  if (
    scenario.steps.some(
      (step) =>
        semanticText(step.action) === semanticText(step.expectedResult) ||
        semanticText(step.expectedResult) === semanticText(scenario.objective),
    )
  ) {
    findings.push({
      kind: "CIRCULAR_OUTCOME",
      message: "Expected outcome restates the action or objective.",
      requirementIds: scenario.requirementIds,
      scenarioIds: [scenario.scenarioId],
    });
  }
  return findings;
}

function feasibilityFindings(
  scenario: Scenario,
): ScenarioEvaluation["findings"] {
  const findings: ScenarioEvaluation["findings"][number][] = [];
  if (
    scenario.steps.some(
      (step) =>
        !/\b(visible|hidden|absent|url|value|valid|invalid|rejected|recorded|state|count|message)\b/i.test(
          step.expectedResult,
        ),
    )
  ) {
    findings.push({
      kind: "INSUFFICIENT_ASSERTION",
      message: "Expected outcome does not identify an observable assertion.",
      requirementIds: scenario.requirementIds,
      scenarioIds: [scenario.scenarioId],
    });
  }
  if (
    (scenario.feasibility === "MANUAL" && scenario.automation !== "MANUAL") ||
    (scenario.feasibility === "BLOCKED" && scenario.automation !== "UNSUITABLE")
  ) {
    findings.push({
      kind: "UNSUPPORTED_COVERAGE",
      message: "Automation classification conflicts with feasibility.",
      requirementIds: scenario.requirementIds,
      scenarioIds: [scenario.scenarioId],
    });
  }
  return findings;
}

function findCoverageFindings(
  requirements: NormalizedRequirements,
  scenarios: readonly Scenario[],
): ScenarioEvaluation["findings"] {
  return requirements.requirements
    .filter((item) => item.classification === "STATED_REQUIREMENT")
    .flatMap<ScenarioEvaluation["findings"][number]>((requirement) => {
      const linked = scenarios.filter((scenario) =>
        scenario.requirementIds.includes(requirement.requirementId),
      );
      if (linked.length === 0) {
        return [
          {
            kind: "ORPHANED_REQUIREMENT" as const,
            message: "Approved requirement has no scenario.",
            requirementIds: [requirement.requirementId],
            scenarioIds: [],
          },
        ];
      }
      const actualCoverage = new Set(
        linked.map((scenario) => scenario.coverage),
      );
      const missing = applicableCoverage(requirement.text).filter(
        (coverage) => !actualCoverage.has(coverage),
      );
      return missing.length === 0
        ? []
        : [
            {
              kind: "MISSING_COVERAGE" as const,
              message: `Missing applicable coverage: ${missing.join(", ")}.`,
              requirementIds: [requirement.requirementId],
              scenarioIds: linked.map((scenario) => scenario.scenarioId),
            },
          ];
    });
}

function findDuplicateScenarios(
  scenarios: readonly Scenario[],
): ScenarioEvaluation["findings"] {
  const keys = new Map<string, string>();
  return scenarios.flatMap((scenario) => {
    const key = [
      [...scenario.requirementIds].sort().join(","),
      scenario.semanticDomain,
      scenario.coverage,
      semanticText(scenario.objective),
      scenario.steps.map((step) => semanticText(step.action)).join("|"),
    ].join(":");
    const existing = keys.get(key);
    keys.set(key, scenario.scenarioId);
    return existing === undefined
      ? []
      : [
          {
            kind: "SEMANTIC_DUPLICATE" as const,
            message: "Scenarios duplicate the same intent.",
            requirementIds: scenario.requirementIds,
            scenarioIds: [existing, scenario.scenarioId],
          },
        ];
  });
}

export interface RevisionInput {
  readonly findings: readonly string[];
  readonly revise: (scenarios: readonly Scenario[]) => readonly Scenario[];
  readonly removedScenarios?: readonly {
    readonly scenarioId: string;
    readonly reason: string;
  }[];
}

export function reviseScenarioSpecification(
  currentInput: ScenarioSpecification,
  input: RevisionInput,
): ScenarioSpecification {
  const current = scenarioSpecificationSchema.parse(currentInput);
  if (current.revisionCycle >= MAX_REVISION_CYCLES) {
    throw new Error(
      `Scenario revision limit of ${String(MAX_REVISION_CYCLES)} exceeded`,
    );
  }
  if (input.findings.length === 0) {
    throw new Error("Material scenario revisions require recorded findings");
  }
  return scenarioSpecificationSchema.parse({
    ...current,
    revision: current.revision + 1,
    revisionCycle: current.revisionCycle + 1,
    scenarios: input.revise(current.scenarios),
    removedScenarios: [
      ...current.removedScenarios,
      ...(input.removedScenarios ?? []),
    ],
    evaluation: "PENDING",
    humanReview: "PENDING",
  });
}

interface HumanReviewInput {
  readonly actor: Actor;
  readonly specification: ScenarioSpecification;
  readonly evaluation: ScenarioEvaluation;
  readonly decision: "APPROVED" | "APPROVED_WITH_EXCLUSIONS";
  readonly exclusions?: readonly string[];
}

export function createHumanScenarioReview(
  input: HumanReviewInput,
): HumanScenarioReview {
  if (input.actor.actorType !== "HUMAN") {
    throw new Error("Scenario approval requires a human actor");
  }
  const specification = scenarioSpecificationSchema.parse(input.specification);
  const evaluation = scenarioEvaluationSchema.parse(input.evaluation);
  const scenarioChecksum = semanticChecksum(specification);
  if (
    evaluation.disposition !== "PASS" ||
    evaluation.scenarioRevision !== specification.revision ||
    evaluation.scenarioChecksum !== scenarioChecksum
  ) {
    throw new Error(
      "Human review requires evaluator PASS for the exact scenario revision and checksum",
    );
  }
  const exclusions = input.exclusions ?? [];
  if (
    input.decision === "APPROVED_WITH_EXCLUSIONS" &&
    exclusions.length === 0
  ) {
    throw new Error(
      "Approval with exclusions must identify excluded scenarios",
    );
  }
  if (input.decision === "APPROVED" && exclusions.length > 0) {
    throw new Error("Complete approval cannot contain scenario exclusions");
  }
  if (
    exclusions.some(
      (scenarioId) =>
        !specification.scenarios.some(
          (scenario) => scenario.scenarioId === scenarioId,
        ),
    )
  ) {
    throw new Error("Human review references an unknown scenario exclusion");
  }
  return humanScenarioReviewSchema.parse({
    schemaVersion: 1,
    scenarioRevision: specification.revision,
    scenarioChecksum,
    evaluationChecksum: semanticChecksum(evaluation),
    actorId: input.actor.actorId,
    decision: input.decision,
    exclusions,
  });
}

export interface TraceabilityMatrix {
  readonly requirementRevision: number;
  readonly scenarioRevision: number;
  readonly requirements: readonly {
    readonly requirementId: string;
    readonly scenarioIds: readonly string[];
  }[];
  readonly scenarios: readonly {
    readonly scenarioId: string;
    readonly requirementIds: readonly string[];
  }[];
}

export function validateTraceability(
  requirementsInput: NormalizedRequirements,
  specificationInput: ScenarioSpecification,
): TraceabilityMatrix {
  const requirements = normalizedRequirementsSchema.parse(requirementsInput);
  const specification = scenarioSpecificationSchema.parse(specificationInput);
  const requirementIds = new Set(
    requirements.requirements
      .filter(
        (requirement) => requirement.classification === "STATED_REQUIREMENT",
      )
      .map((requirement) => requirement.requirementId),
  );
  const invalidScenario = specification.scenarios.some((scenario) =>
    scenario.requirementIds.some(
      (requirementId) => !requirementIds.has(requirementId),
    ),
  );
  const requirementLinks = [...requirementIds].map((requirementId) => ({
    requirementId,
    scenarioIds: specification.scenarios
      .filter((scenario) => scenario.requirementIds.includes(requirementId))
      .map((scenario) => scenario.scenarioId),
  }));
  if (
    invalidScenario ||
    requirementLinks.some((link) => link.scenarioIds.length === 0)
  ) {
    throw new Error(
      "Scenario set does not provide valid bidirectional traceability",
    );
  }
  return {
    requirementRevision: requirements.revision,
    scenarioRevision: specification.revision,
    requirements: requirementLinks,
    scenarios: specification.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      requirementIds: scenario.requirementIds,
    })),
  };
}

function scenariosFor(
  requirement: NormalizedRequirements["requirements"][number],
): Scenario[] {
  return applicableCoverage(requirement.text).map((coverage) =>
    createScenario(requirement, coverage),
  );
}

function applicableCoverage(text: string): Scenario["coverage"][] {
  const coverage: Scenario["coverage"][] = ["POSITIVE"];
  if (/\b(sign[ -]?in|credential|password|email|input|form)\b/i.test(text)) {
    coverage.push("NEGATIVE");
  }
  if (
    /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\b(maximum|minimum|limit|range|threshold)\b/i.test(
      text,
    )
  ) {
    coverage.push("BOUNDARY");
  }
  return coverage;
}

function createScenario(
  requirement: NormalizedRequirements["requirements"][number],
  coverage: Scenario["coverage"],
): Scenario {
  const suffix = createHash("sha256")
    .update(`${requirement.requirementId}:${coverage}`)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
  const subject = requirement.text.replace(/[.!?]+$/, "");
  const feasibility = classifyScenarioFeasibility(requirement.text);
  const action =
    coverage === "POSITIVE"
      ? `Exercise the supported behavior: ${subject}.`
      : coverage === "NEGATIVE"
        ? `Exercise the behavior with invalid or disallowed input: ${subject}.`
        : `Exercise the stated limit immediately below, at, and above its boundary: ${subject}.`;
  return {
    scenarioId: `TS-REQ-${suffix}`,
    title: `${coverage.toLowerCase().replace("_", " ")}: ${subject}`,
    requirementIds: [requirement.requirementId],
    objective: `Verify ${coverage.toLowerCase().replace("_", " ")} coverage for the linked requirement.`,
    coverage,
    semanticDomain: semanticDomain(requirement.text),
    priority: "HIGH",
    testType: "FUNCTIONAL",
    automation:
      feasibility === "MANUAL"
        ? "MANUAL"
        : feasibility === "BLOCKED"
          ? "UNSUITABLE"
          : "CANDIDATE",
    feasibility,
    actor: "Authorized user",
    preconditions: ["The configured test environment is available."],
    testData: [
      {
        field: "Scenario input",
        strategy: "Use a deterministic, non-production fixture.",
        sensitivity: "NONE",
      },
    ],
    steps: [
      {
        step: 1,
        action,
        expectedResult:
          coverage === "NEGATIVE"
            ? "The operation is rejected and a visible validation response identifies the invalid input."
            : coverage === "BOUNDARY"
              ? "Each boundary value produces a visible state or validation message that proves the linked requirement."
              : `The visible application state records the required outcome: ${subject}.`,
      },
    ],
    postconditions: ["The observed outcome is recorded."],
    cleanup: ["Restore any mutable test data created by the scenario."],
    assumptions: [],
    exclusions: [],
    risks: [],
    notes: [],
  };
}

function classifyScenarioFeasibility(
  requirementText: string,
): Scenario["feasibility"] {
  if (
    /\b(unknown|not specified|to be decided|unsupported dependency)\b/i.test(
      requirementText,
    )
  ) {
    return "BLOCKED";
  }
  if (
    /\b(physical device|paper document|telephone call|visual inspection)\b/i.test(
      requirementText,
    )
  ) {
    return "MANUAL";
  }
  if (
    /\b(file upload|download|geolocation|camera|new browser capability)\b/i.test(
      requirementText,
    )
  ) {
    return "CAPABILITY_EXTENSION_REQUIRED";
  }
  return "AUTOMATABLE";
}

function semanticDomain(text: string): Scenario["semanticDomain"] {
  if (/\b(permission|role|access|authorize|forbid|security)\b/i.test(text)) {
    return "SECURITY_ACCESS_CONTROL";
  }
  if (/\b(sign[ -]?in|sign[ -]?out|session|authenticated)\b/i.test(text)) {
    return "AUTHENTICATION_STATE";
  }
  if (
    /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\b(maximum|minimum|limit|range|threshold)\b/i.test(
      text,
    )
  ) {
    return "NUMERIC_BOUNDARY";
  }
  if (/\b(policy|retention|approval|operation|procedure)\b/i.test(text)) {
    return "OPERATIONAL_POLICY";
  }
  if (/\b(valid|invalid|required|input|form|format)\b/i.test(text)) {
    return "VALIDATION";
  }
  return "GENERAL_FUNCTIONAL";
}

function semanticText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function renderScenario(scenario: Scenario): string[] {
  return [
    `## ${scenario.scenarioId}: ${markdownText(scenario.title)}`,
    "",
    `**Requirements:** ${scenario.requirementIds.join(", ")}  `,
    `**Priority:** ${scenario.priority}  `,
    `**Type:** ${scenario.testType}, ${scenario.coverage}  `,
    `**Automation:** ${scenario.automation}  `,
    `**Actor:** ${markdownText(scenario.actor)}`,
    "",
    "### Objective",
    "",
    markdownText(scenario.objective),
    "",
    "### Preconditions",
    "",
    ...scenario.preconditions.map(
      (item, index) => `${String(index + 1)}. ${markdownText(item)}`,
    ),
    "",
    "### Test data",
    "",
    "| Field | Strategy | Sensitivity |",
    "| --- | --- | --- |",
    ...scenario.testData.map(
      (item) =>
        `| ${markdownCell(item.field)} | ${markdownCell(item.strategy)} | ${item.sensitivity} |`,
    ),
    "",
    "### Steps and expected results",
    "",
    "| Step | Action | Expected result |",
    "| ---: | --- | --- |",
    ...scenario.steps.map(
      (step) =>
        `| ${String(step.step)} | ${markdownCell(step.action)} | ${markdownCell(step.expectedResult)} |`,
    ),
    "",
    "### Postconditions and cleanup",
    "",
    ...scenario.postconditions.map(
      (item) => `- Postcondition: ${markdownText(item)}`,
    ),
    ...scenario.cleanup.map((item) => `- Cleanup: ${markdownText(item)}`),
    "",
  ];
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replaceAll("\r\n", "\n").trimEnd() + "\n";
}

function markdownText(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

function markdownCell(value: string): string {
  return markdownText(value).replaceAll("|", "\\|");
}
