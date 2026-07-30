import { describe, expect, it } from "vitest";

import { semanticChecksum } from "../../../src/orchestration/artifact-lifecycle.js";
import {
  authorizeScriptRepair,
  createDefectCandidate,
  createFailureTriage,
  createFinalQualityAssessment,
} from "../../../src/failures/pipeline.js";

const evidence = [
  {
    kind: "TRACE" as const,
    path: "test-results/run-001/trace.zip",
    summary: "Checkout submission reached the confirmation response.",
  },
];

describe("failure and assessment pipeline", () => {
  it("records all six failure classifications with evidence and contrary evidence", () => {
    const classifications = [
      "SCRIPT_ERROR",
      "PRODUCT_DEFECT",
      "ENVIRONMENT_FAILURE",
      "TEST_DATA_FAILURE",
      "REQUIREMENT_AMBIGUITY",
      "FLAKY_OR_INCONCLUSIVE",
    ] as const;

    for (const classification of classifications) {
      const triage = createFailureTriage({
        triageId: `triage-${classification.toLowerCase().replaceAll("_", "-")}`,
        runId: "run-001",
        testId: "pw-ts-checkout-a1b2c3d4e5",
        executionSummaryChecksum: "a".repeat(64),
        classification,
        confidence: "MEDIUM",
        evidence,
        contraryEvidence: ["A rerun has not yet been attempted."],
        reproduction: {
          attempted: true,
          reproduced: classification !== "FLAKY_OR_INCONCLUSIVE",
          attempts: 1,
        },
        expectedBehavior: "The approved confirmation should be visible.",
        actualBehavior: "The confirmation was not visible.",
        intendedConditionReached: classification === "PRODUCT_DEFECT",
        ruledOutCauses:
          classification === "PRODUCT_DEFECT"
            ? ["SCRIPT", "ENVIRONMENT", "TEST_DATA", "AUTHENTICATION"]
            : [],
      });

      expect(triage.classification).toBe(classification);
      expect(triage.evidence).toEqual(evidence);
    }
  });

  it("authorizes bounded test repair only from an exact SCRIPT_ERROR triage record", () => {
    const triage = scriptErrorTriage();

    const repair = authorizeScriptRepair({
      repairId: "repair-001",
      triage,
      triageChecksum: semanticChecksum(triage),
      playwrightTestId: "pw-ts-checkout-a1b2c3d4e5",
      fromRevision: 1,
      toRevision: 2,
      attempt: 1,
      changeSummary: "Use the approved accessible confirmation locator.",
    });

    expect(repair.triageChecksum).toBe(semanticChecksum(triage));
    expect(repair.toRevision).toBe(2);
    expect(() =>
      authorizeScriptRepair({
        repairId: "repair-002",
        triage: { ...triage, classification: "PRODUCT_DEFECT" },
        triageChecksum: semanticChecksum({
          ...triage,
          classification: "PRODUCT_DEFECT",
        }),
        playwrightTestId: "pw-ts-checkout-a1b2c3d4e5",
        fromRevision: 1,
        toRevision: 2,
        attempt: 1,
        changeSummary: "This must not be authorized.",
      }),
    ).toThrow(/SCRIPT_ERROR/);
    expect(() =>
      authorizeScriptRepair({
        repairId: "repair-004",
        triage,
        triageChecksum: semanticChecksum(triage),
        playwrightTestId: "pw-ts-checkout-a1b2c3d4e5",
        fromRevision: 3,
        toRevision: 4,
        attempt: 4,
        changeSummary: "Exceeds the bounded repair loop.",
      }),
    ).toThrow(/at most 3/);
  });

  it("requires complete product-defect evidence and never authorizes application edits", () => {
    const triage = createFailureTriage({
      triageId: "triage-product-defect",
      runId: "run-001",
      testId: "pw-ts-checkout-a1b2c3d4e5",
      executionSummaryChecksum: "a".repeat(64),
      classification: "PRODUCT_DEFECT",
      confidence: "HIGH",
      evidence,
      contraryEvidence: [],
      reproduction: { attempted: true, reproduced: true, attempts: 2 },
      expectedBehavior: "The approved confirmation should be visible.",
      actualBehavior: "The server returned success without confirmation.",
      intendedConditionReached: true,
      ruledOutCauses: ["SCRIPT", "ENVIRONMENT", "TEST_DATA", "AUTHENTICATION"],
    });

    const candidate = createDefectCandidate({
      defectId: "defect-001",
      triage,
      triageChecksum: semanticChecksum(triage),
      requirementIds: ["req-checkout-confirmation"],
      scenarioIds: ["TS-CHECKOUT-A1B2C3D4E5"],
      title: "Checkout confirmation is absent after a successful submission",
    });

    expect(candidate.applicationChangeAuthorized).toBe(false);
    expect(() =>
      createDefectCandidate({
        defectId: "defect-002",
        triage: { ...triage, intendedConditionReached: false },
        triageChecksum: semanticChecksum({
          ...triage,
          intendedConditionReached: false,
        }),
        requirementIds: ["req-checkout-confirmation"],
        scenarioIds: ["TS-CHECKOUT-A1B2C3D4E5"],
        title: "Insufficiently evidenced candidate",
      }),
    ).toThrow(/intended condition/);
  });

  it("assesses complete traceability and exposes residual risk for human review", () => {
    const ready = createFinalQualityAssessment({
      assessmentId: "assessment-001",
      runId: "run-001",
      executionSummaryChecksums: ["a".repeat(64)],
      traceability: [
        {
          requirementId: "req-checkout-confirmation",
          scenarioId: "TS-CHECKOUT-A1B2C3D4E5",
          testId: "pw-ts-checkout-a1b2c3d4e5",
          result: "PASSED",
        },
      ],
      missingArtifacts: [],
      staleTestIds: [],
      unresolvedFailureIds: [],
      skippedCoverage: [],
      residualRisks: ["Real identity-provider integration remains untested."],
    });
    const revisionRequired = createFinalQualityAssessment({
      assessmentId: "assessment-002",
      runId: "run-001",
      executionSummaryChecksums: ["a".repeat(64)],
      traceability: [],
      missingArtifacts: ["scenario-evaluation"],
      staleTestIds: [],
      unresolvedFailureIds: [],
      skippedCoverage: [],
      residualRisks: [],
    });
    const blocked = createFinalQualityAssessment({
      assessmentId: "assessment-003",
      runId: "run-001",
      executionSummaryChecksums: ["a".repeat(64)],
      traceability: [],
      missingArtifacts: [],
      staleTestIds: [],
      unresolvedFailureIds: ["triage-environment"],
      skippedCoverage: [],
      residualRisks: ["The test environment is unavailable."],
    });

    expect(ready.decision).toBe("READY_FOR_HUMAN_REVIEW");
    expect(ready.finalApprovalGranted).toBe(false);
    expect(revisionRequired.decision).toBe("REVISION_REQUIRED");
    expect(blocked.decision).toBe("BLOCKED");
  });
});

function scriptErrorTriage() {
  return createFailureTriage({
    triageId: "triage-script-error",
    runId: "run-001",
    testId: "pw-ts-checkout-a1b2c3d4e5",
    executionSummaryChecksum: "a".repeat(64),
    classification: "SCRIPT_ERROR",
    confidence: "HIGH",
    evidence,
    contraryEvidence: [],
    reproduction: { attempted: true, reproduced: true, attempts: 1 },
    expectedBehavior: "The approved confirmation should be visible.",
    actualBehavior: "The generated locator did not match the confirmation.",
    intendedConditionReached: false,
    ruledOutCauses: [],
  });
}
