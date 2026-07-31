import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import type { NormalizedRequirements } from "../requirements/analysis.js";
import {
  evaluateScenarios,
  generateScenarioSpecification,
} from "../scenarios/pipeline.js";
import type {
  Scenario,
  ScenarioEvaluation,
  ScenarioSpecification,
} from "../scenarios/contracts.js";

export type BenchmarkDisposition = "PASS" | "REVISE" | "BLOCKED";
type FailureClass =
  | "SAFE_COMPLETE"
  | "CIRCULAR_OUTCOME"
  | "UNSUPPORTED_COVERAGE"
  | "SEMANTIC_DUPLICATE"
  | "MISSING_STATE_SETUP"
  | "INSUFFICIENT_ASSERTION";

export interface SyntheticBenchmarkCase {
  readonly caseId: string;
  readonly failureClass: FailureClass;
  readonly expected: BenchmarkDisposition;
}

export const syntheticQualityCorpus: readonly SyntheticBenchmarkCase[] = [
  ...cases("safe", "SAFE_COMPLETE", "PASS", 5),
  ...cases("circular", "CIRCULAR_OUTCOME", "REVISE", 3),
  ...cases("unsupported", "UNSUPPORTED_COVERAGE", "REVISE", 3),
  ...cases("duplicate", "SEMANTIC_DUPLICATE", "REVISE", 3),
  ...cases("state", "MISSING_STATE_SETUP", "REVISE", 3),
  ...cases("assertion", "INSUFFICIENT_ASSERTION", "REVISE", 3),
];

export function evaluateSyntheticBenchmark(
  corpus: readonly SyntheticBenchmarkCase[] = syntheticQualityCorpus,
) {
  const results = corpus.map((candidate) => executeCandidate(candidate));
  const unsafeFalsePasses = results.filter(
    (result) =>
      result.expected !== "PASS" &&
      (result.builtIn === "PASS" || result.independent === "PASS"),
  ).length;
  const agreements = results.filter(
    (result) => result.builtIn === result.independent,
  ).length;
  const expectedMatches = results.filter(
    (result) =>
      result.expected === result.builtIn &&
      result.expected === result.independent,
  ).length;
  return {
    results,
    unsafeFalsePasses,
    dispositionAgreement: agreements / results.length,
    expectedAgreement: expectedMatches / results.length,
  };
}

function executeCandidate(candidate: SyntheticBenchmarkCase) {
  const requirements = benchmarkRequirements(candidate.caseId);
  const generated = generateScenarioSpecification(requirements);
  const specification = mutateCandidate(generated, candidate.failureClass);
  const evaluation = evaluateScenarios(requirements, specification);
  return {
    caseId: candidate.caseId,
    expected: candidate.expected,
    builtIn: evaluation.disposition,
    independent: independentlyClassify(evaluation),
    executedOrClassified: true,
  };
}

function independentlyClassify(
  evaluation: ScenarioEvaluation,
): BenchmarkDisposition {
  if (
    evaluation.findings.some(
      (finding) => finding.kind === "UNKNOWN_REQUIREMENT",
    )
  ) {
    return "BLOCKED";
  }
  return evaluation.findings.length === 0 ? "PASS" : "REVISE";
}

function mutateCandidate(
  generated: ScenarioSpecification,
  failureClass: FailureClass,
): ScenarioSpecification {
  const first = generated.scenarios[0];
  if (first === undefined || failureClass === "SAFE_COMPLETE") return generated;
  const changed = mutateScenario(first, failureClass);
  const scenarios =
    failureClass === "SEMANTIC_DUPLICATE"
      ? [first, { ...first, scenarioId: duplicateId(first.scenarioId) }]
      : [changed, ...generated.scenarios.slice(1)];
  return {
    ...generated,
    scenarios,
    evaluation: "PENDING",
    humanReview: "PENDING",
  };
}

function mutateScenario(
  scenario: Scenario,
  failureClass: FailureClass,
): Scenario {
  switch (failureClass) {
    case "CIRCULAR_OUTCOME":
      return {
        ...scenario,
        steps: scenario.steps.map((step) => ({
          ...step,
          expectedResult: step.action,
        })),
      };
    case "UNSUPPORTED_COVERAGE":
      return { ...scenario, feasibility: "MANUAL", automation: "CANDIDATE" };
    case "MISSING_STATE_SETUP":
      return { ...scenario, preconditions: [], testData: [], cleanup: [] };
    case "INSUFFICIENT_ASSERTION":
      return {
        ...scenario,
        steps: scenario.steps.map((step) => ({
          ...step,
          expectedResult: "The behavior completes.",
        })),
      };
    default:
      return scenario;
  }
}

function benchmarkRequirements(caseId: string): NormalizedRequirements {
  const requirements = {
    schemaVersion: 1 as const,
    revision: 1,
    sourceId: `source-${caseId}`,
    sourceChecksum: semanticChecksum(caseId),
    requirements: [
      {
        requirementId: `req-${caseId}`,
        text: "The neutral form must display a visible confirmation message.",
        classification: "STATED_REQUIREMENT" as const,
        source: {
          sourceId: `source-${caseId}`,
          sourceChecksum: semanticChecksum(caseId),
          startLine: 1,
          endLine: 1,
        },
      },
    ],
  };
  return requirements;
}

function duplicateId(scenarioId: string): string {
  const suffix = scenarioId.slice(-10);
  return `TS-DUP-${suffix === "FFFFFFFFFF" ? "EEEEEEEEEE" : "FFFFFFFFFF"}`;
}

function cases(
  prefix: string,
  failureClass: FailureClass,
  expected: BenchmarkDisposition,
  count: number,
): SyntheticBenchmarkCase[] {
  return Array.from({ length: count }, (_, index) => ({
    caseId: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    failureClass,
    expected,
  }));
}
