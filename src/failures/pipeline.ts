import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import {
  manualResultSchema,
  type ManualResult,
} from "../remediation/artifact-integrity.js";
import {
  defectCandidateSchema,
  failureTriageSchema,
  finalQualityAssessmentSchema,
  scriptRepairRecordSchema,
  type FailureTriage,
  type FinalQualityAssessment,
} from "./contracts.js";

type FailureTriageInput = Omit<FailureTriage, "schemaVersion">;

export function createFailureTriage(input: FailureTriageInput): FailureTriage {
  return failureTriageSchema.parse({ schemaVersion: 1, ...input });
}

interface AuthorizeScriptRepairInput {
  readonly repairId: string;
  readonly triage: FailureTriage;
  readonly triageChecksum: string;
  readonly playwrightTestId: string;
  readonly fromRevision: number;
  readonly toRevision: number;
  readonly attempt: number;
  readonly changeSummary: string;
}

export function authorizeScriptRepair(input: AuthorizeScriptRepairInput) {
  const triage = failureTriageSchema.parse(input.triage);
  requireExactTriageChecksum(triage, input.triageChecksum);
  if (triage.classification !== "SCRIPT_ERROR") {
    throw new Error("Only SCRIPT_ERROR authorizes automatic test repair");
  }
  if (input.attempt > 3) {
    throw new Error("Script repair permits at most 3 attempts per failure");
  }
  if (input.toRevision !== input.fromRevision + 1) {
    throw new Error("Script repair must create the next test revision");
  }
  return scriptRepairRecordSchema.parse({
    schemaVersion: 1,
    repairId: input.repairId,
    triageId: triage.triageId,
    triageChecksum: input.triageChecksum,
    classification: triage.classification,
    playwrightTestId: input.playwrightTestId,
    fromRevision: input.fromRevision,
    toRevision: input.toRevision,
    attempt: input.attempt,
    changeSummary: input.changeSummary,
    applicationChangeAuthorized: false,
  });
}

interface CreateDefectCandidateInput {
  readonly defectId: string;
  readonly triage: FailureTriage;
  readonly triageChecksum: string;
  readonly requirementIds: readonly string[];
  readonly scenarioIds: readonly string[];
  readonly title: string;
}

export function createDefectCandidate(input: CreateDefectCandidateInput) {
  const triage = failureTriageSchema.parse(input.triage);
  requireExactTriageChecksum(triage, input.triageChecksum);
  if (triage.classification !== "PRODUCT_DEFECT") {
    throw new Error("Only PRODUCT_DEFECT triage can create a defect candidate");
  }
  if (!triage.reproduction.attempted || !triage.reproduction.reproduced) {
    throw new Error("Product defect candidates require reproduction evidence");
  }
  if (!triage.intendedConditionReached) {
    throw new Error(
      "Product defect candidates require evidence that the intended condition was reached",
    );
  }
  const requiredCauses = [
    "SCRIPT",
    "ENVIRONMENT",
    "TEST_DATA",
    "AUTHENTICATION",
  ] as const;
  if (
    requiredCauses.some((required) => !triage.ruledOutCauses.includes(required))
  ) {
    throw new Error(
      "Product defect candidates must rule out scripting, environment, test data, and authentication causes",
    );
  }
  return defectCandidateSchema.parse({
    schemaVersion: 1,
    defectId: input.defectId,
    triageId: triage.triageId,
    triageChecksum: input.triageChecksum,
    requirementIds: input.requirementIds,
    scenarioIds: input.scenarioIds,
    title: input.title,
    expectedBehavior: triage.expectedBehavior,
    actualBehavior: triage.actualBehavior,
    evidence: triage.evidence,
    applicationChangeAuthorized: false,
  });
}

type FinalQualityAssessmentInput = Omit<
  FinalQualityAssessment,
  | "schemaVersion"
  | "decision"
  | "finalApprovalGranted"
  | "manualResultChecksums"
  | "requiredManualScenarioIds"
  | "completedManualScenarioIds"
> & {
  readonly requiredManualScenarios?: readonly {
    readonly scenarioId: string;
    readonly scenarioRevision: number;
    readonly scenarioChecksum: string;
  }[];
  readonly manualResults?: readonly ManualResult[];
};

export function createFinalQualityAssessment(
  input: FinalQualityAssessmentInput,
): FinalQualityAssessment {
  const requiredManualScenarios = input.requiredManualScenarios ?? [];
  const manualResults = (input.manualResults ?? []).map((result) =>
    manualResultSchema.parse(result),
  );
  const completedManualScenarioIds = requiredManualScenarios.flatMap(
    (required) => {
      const result = manualResults.find(
        (candidate) =>
          candidate.runId === input.runId &&
          candidate.scenarioId === required.scenarioId &&
          candidate.scenarioRevision === required.scenarioRevision &&
          candidate.scenarioChecksum === required.scenarioChecksum &&
          candidate.outcome === "PASSED" &&
          semanticChecksum({
            schemaVersion: candidate.schemaVersion,
            manualResultId: candidate.manualResultId,
            runId: candidate.runId,
            scenarioId: candidate.scenarioId,
            scenarioRevision: candidate.scenarioRevision,
            scenarioChecksum: candidate.scenarioChecksum,
            reviewer: candidate.reviewer,
            procedure: candidate.procedure,
            evidence: candidate.evidence,
            outcome: candidate.outcome,
            completedAt: candidate.completedAt,
          }) === candidate.semanticChecksum,
      );
      return result === undefined ? [] : [required.scenarioId];
    },
  );
  const hasBlocker = input.unresolvedFailureIds.length > 0;
  const needsRevision =
    input.traceability.length === 0 ||
    input.missingArtifacts.length > 0 ||
    input.staleTestIds.length > 0 ||
    input.skippedCoverage.length > 0 ||
    requiredManualScenarios.some(
      ({ scenarioId }) => !completedManualScenarioIds.includes(scenarioId),
    ) ||
    input.traceability.some((link) => link.result !== "PASSED");
  const decision = hasBlocker
    ? "BLOCKED"
    : needsRevision
      ? "REVISION_REQUIRED"
      : "READY_FOR_HUMAN_REVIEW";
  return finalQualityAssessmentSchema.parse({
    schemaVersion: 1,
    ...input,
    requiredManualScenarioIds: requiredManualScenarios.map(
      ({ scenarioId }) => scenarioId,
    ),
    completedManualScenarioIds,
    manualResultChecksums: manualResults.map(
      ({ semanticChecksum: checksum }) => checksum,
    ),
    decision,
    finalApprovalGranted: false,
  });
}

function requireExactTriageChecksum(
  triage: FailureTriage,
  expectedChecksum: string,
): void {
  if (semanticChecksum(triage) !== expectedChecksum) {
    throw new Error("Triage checksum does not match the exact triage record");
  }
}
