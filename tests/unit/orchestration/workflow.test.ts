import { describe, expect, it } from "vitest";

import {
  createWorkflow,
  transitionWorkflow,
} from "../../../src/orchestration/workflow.js";
import type {
  Actor,
  ArtifactReference,
} from "../../../src/schemas/contracts.js";

const coordinator: Actor = {
  actorType: "AGENT",
  actorId: "workflow-coordinator",
};
const evaluator: Actor = {
  actorType: "AGENT",
  actorId: "scenario-quality-evaluator",
};
const human: Actor = { actorType: "HUMAN", actorId: "reviewer-1" };
const scenario: ArtifactReference = {
  artifactId: "scenario-001",
  artifactType: "scenario-specification",
  revision: 2,
  semanticChecksum: "a".repeat(64),
};
const playwrightTest: ArtifactReference = {
  artifactId: "playwright-login-001",
  artifactType: "playwright-test",
  revision: 1,
  semanticChecksum: "d".repeat(64),
};
const triage: ArtifactReference = {
  artifactId: "triage-001",
  artifactType: "failure-triage",
  revision: 1,
  semanticChecksum: "e".repeat(64),
};
const assessment: ArtifactReference = {
  artifactId: "assessment-001",
  artifactType: "final-quality-assessment",
  revision: 1,
  semanticChecksum: "f".repeat(64),
};
const executionSummary: ArtifactReference = {
  artifactId: "execution-001",
  artifactType: "execution-summary",
  revision: 1,
  semanticChecksum: "1".repeat(64),
};

describe("workflow transitions", () => {
  it("permits the legal happy path while recording transition evidence", () => {
    let workflow = createWorkflow({
      workflowId: "workflow-001",
      taskId: "task-001",
      provenance: {
        createdAt: "2026-07-29T10:00:00.000Z",
        gitCommit: "b".repeat(40),
        gitDirty: false,
        nodeVersion: "v22.18.0",
        platform: "darwin-arm64",
        provider: "codex",
        configurationChecksum: "c".repeat(64),
      },
    });

    workflow = transitionWorkflow(workflow, {
      to: "requirement-analysis",
      actor: coordinator,
      occurredAt: "2026-07-29T10:01:00.000Z",
    });
    workflow = transitionWorkflow(workflow, {
      to: "scenario-generation",
      actor: coordinator,
      occurredAt: "2026-07-29T10:02:00.000Z",
      gate: { kind: "NO_BLOCKING_AMBIGUITY" },
    });
    workflow = transitionWorkflow(workflow, {
      to: "scenario-evaluation",
      actor: coordinator,
      occurredAt: "2026-07-29T10:03:00.000Z",
      inputReferences: [scenario],
    });
    workflow = transitionWorkflow(workflow, {
      to: "human-scenario-review",
      actor: evaluator,
      occurredAt: "2026-07-29T10:04:00.000Z",
      gate: {
        kind: "EVALUATOR_PASS",
        subject: scenario,
      },
    });
    workflow = transitionWorkflow(workflow, {
      to: "playwright-implementation",
      actor: human,
      occurredAt: "2026-07-29T10:05:00.000Z",
      gate: {
        kind: "HUMAN_SCENARIO_APPROVAL",
        subject: scenario,
        decision: "APPROVED",
      },
    });

    expect(workflow.currentStage).toBe("playwright-implementation");
    expect(workflow.transitionHistory).toHaveLength(5);
    expect(workflow.transitionHistory.at(-1)?.inputReferences).toEqual([
      scenario,
    ]);
  });

  it("blocks human review without an evaluator pass by the evaluator", () => {
    const workflow = workflowAtScenarioEvaluation();

    expect(() =>
      transitionWorkflow(workflow, {
        to: "human-scenario-review",
        actor: coordinator,
        occurredAt: "2026-07-29T10:04:00.000Z",
        gate: { kind: "EVALUATOR_PASS", subject: scenario },
      }),
    ).toThrow(/scenario-quality-evaluator/);
  });

  it("blocks Playwright implementation without exact human approval", () => {
    const workflow = transitionWorkflow(workflowAtScenarioEvaluation(), {
      to: "human-scenario-review",
      actor: evaluator,
      occurredAt: "2026-07-29T10:04:00.000Z",
      gate: { kind: "EVALUATOR_PASS", subject: scenario },
    });

    expect(() =>
      transitionWorkflow(workflow, {
        to: "playwright-implementation",
        actor: human,
        occurredAt: "2026-07-29T10:05:00.000Z",
        gate: {
          kind: "HUMAN_SCENARIO_APPROVAL",
          subject: { ...scenario, revision: 1 },
          decision: "APPROVED",
        },
      }),
    ).toThrow(/exact evaluated scenario/);
  });

  it("executes only a registered Playwright test from the test engineer", () => {
    const workflow = createWorkflowAt("playwright-implementation");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "test-execution",
        actor: coordinator,
        occurredAt: "2026-07-29T10:06:00.000Z",
      }),
    ).toThrow(/playwright-test-engineer/);

    const executing = transitionWorkflow(workflow, {
      to: "test-execution",
      actor: {
        actorType: "AGENT",
        actorId: "playwright-test-engineer",
      },
      occurredAt: "2026-07-29T10:06:00.000Z",
      gate: { kind: "PLAYWRIGHT_TEST_READY", subject: playwrightTest },
    });

    expect(executing.transitionHistory.at(-1)?.inputReferences).toEqual([
      playwrightTest,
    ]);
  });

  it("allows test repair only after SCRIPT_ERROR classification", () => {
    const workflow = createWorkflowAt("failure-triage");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "test-repair",
        actor: { actorType: "AGENT", actorId: "playwright-test-engineer" },
        occurredAt: "2026-07-29T10:04:00.000Z",
        gate: {
          kind: "TRIAGE",
          classification: "PRODUCT_DEFECT",
          subject: triage,
        },
      }),
    ).toThrow(/SCRIPT_ERROR/);

    const repairing = transitionWorkflow(workflow, {
      to: "test-repair",
      actor: { actorType: "AGENT", actorId: "playwright-test-engineer" },
      occurredAt: "2026-07-29T10:05:00.000Z",
      gate: { kind: "TRIAGE", classification: "SCRIPT_ERROR", subject: triage },
    });

    expect(repairing.transitionHistory.at(-1)?.inputReferences).toEqual([
      triage,
    ]);
  });

  it("routes exact execution and triage evidence through the failure policy", () => {
    const failed = transitionWorkflow(createWorkflowAt("test-execution"), {
      to: "failure-triage",
      actor: { actorType: "AGENT", actorId: "playwright-test-engineer" },
      occurredAt: "2026-07-29T10:04:00.000Z",
      gate: {
        kind: "EXECUTION_RESULT",
        outcome: "FAILED",
        subject: executionSummary,
      },
    });
    expect(failed.transitionHistory.at(-1)?.inputReferences).toEqual([
      executionSummary,
    ]);

    const assessing = transitionWorkflow(failed, {
      to: "final-quality-assessment",
      actor: { actorType: "AGENT", actorId: "failure-triage-analyst" },
      occurredAt: "2026-07-29T10:05:00.000Z",
      gate: {
        kind: "TRIAGE",
        classification: "PRODUCT_DEFECT",
        subject: triage,
      },
    });
    expect(assessing.transitionHistory.at(-1)?.inputReferences).toEqual([
      triage,
    ]);

    expect(() =>
      transitionWorkflow(failed, {
        to: "final-quality-assessment",
        actor: { actorType: "AGENT", actorId: "failure-triage-analyst" },
        occurredAt: "2026-07-29T10:05:00.000Z",
        gate: {
          kind: "TRIAGE",
          classification: "SCRIPT_ERROR",
          subject: triage,
        },
      }),
    ).toThrow(/bounded test repair/);

    expect(() =>
      transitionWorkflow(failed, {
        to: "requirement-clarification",
        actor: { actorType: "AGENT", actorId: "failure-triage-analyst" },
        occurredAt: "2026-07-29T10:06:00.000Z",
        gate: {
          kind: "TRIAGE",
          classification: "TEST_DATA_FAILURE",
          subject: triage,
        },
      }),
    ).toThrow(/REQUIREMENT_AMBIGUITY/);

    const clarifying = transitionWorkflow(failed, {
      to: "requirement-clarification",
      actor: { actorType: "AGENT", actorId: "failure-triage-analyst" },
      occurredAt: "2026-07-29T10:07:00.000Z",
      gate: {
        kind: "TRIAGE",
        classification: "REQUIREMENT_AMBIGUITY",
        subject: triage,
      },
    });
    expect(clarifying.currentStage).toBe("requirement-clarification");
  });

  it("sends only passed execution evidence directly to final assessment", () => {
    const workflow = createWorkflowAt("test-execution");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "final-quality-assessment",
        actor: { actorType: "AGENT", actorId: "playwright-test-engineer" },
        occurredAt: "2026-07-29T10:04:00.000Z",
        gate: {
          kind: "EXECUTION_RESULT",
          outcome: "FAILED",
          subject: executionSummary,
        },
      }),
    ).toThrow(/PASSED/);

    const assessing = transitionWorkflow(workflow, {
      to: "final-quality-assessment",
      actor: { actorType: "AGENT", actorId: "playwright-test-engineer" },
      occurredAt: "2026-07-29T10:05:00.000Z",
      gate: {
        kind: "EXECUTION_RESULT",
        outcome: "PASSED",
        subject: executionSummary,
      },
    });
    expect(assessing.currentStage).toBe("final-quality-assessment");
  });

  it("requires a recorded human answer to leave clarification", () => {
    const workflow = createWorkflowAt("requirement-clarification");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "requirement-analysis",
        actor: coordinator,
        occurredAt: "2026-07-29T10:04:00.000Z",
      }),
    ).toThrow(/human actor/);
  });

  it("requires the final assessor to open final human review", () => {
    const workflow = createWorkflowAt("final-quality-assessment");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "final-human-review",
        actor: coordinator,
        occurredAt: "2026-07-29T10:04:00.000Z",
        gate: {
          kind: "FINAL_ASSESSMENT",
          decision: "READY_FOR_HUMAN_REVIEW",
          subject: assessment,
        },
      }),
    ).toThrow(/final-quality-assessor/);

    const review = transitionWorkflow(workflow, {
      to: "final-human-review",
      actor: { actorType: "AGENT", actorId: "final-quality-assessor" },
      occurredAt: "2026-07-29T10:05:00.000Z",
      gate: {
        kind: "FINAL_ASSESSMENT",
        decision: "READY_FOR_HUMAN_REVIEW",
        subject: assessment,
      },
    });

    expect(review.transitionHistory.at(-1)?.inputReferences).toEqual([
      assessment,
    ]);
  });

  it("enforces bounded scenario revision retries", () => {
    let workflow = createWorkflowAt("scenario-evaluation");
    for (let retry = 0; retry < 3; retry += 1) {
      workflow = transitionWorkflow(workflow, {
        to: "scenario-generation",
        actor: evaluator,
        occurredAt: `2026-07-29T10:0${String(retry + 4)}:00.000Z`,
        gate: { kind: "EVALUATOR_REVISE" },
      });
      workflow = transitionWorkflow(workflow, {
        to: "scenario-evaluation",
        actor: coordinator,
        occurredAt: `2026-07-29T10:0${String(retry + 5)}:00.000Z`,
      });
    }

    expect(() =>
      transitionWorkflow(workflow, {
        to: "scenario-generation",
        actor: evaluator,
        occurredAt: "2026-07-29T10:09:00.000Z",
        gate: { kind: "EVALUATOR_REVISE" },
      }),
    ).toThrow(/retry limit/);
  });
});

function createWorkflowAt(
  currentStage: ReturnType<typeof createWorkflow>["currentStage"],
) {
  return {
    ...createWorkflow({
      workflowId: "workflow-001",
      taskId: "task-001",
      provenance: {
        createdAt: "2026-07-29T10:00:00.000Z",
        gitCommit: "b".repeat(40),
        gitDirty: false,
        nodeVersion: "v22.18.0",
        platform: "darwin-arm64",
        provider: "codex",
        configurationChecksum: "c".repeat(64),
      },
    }),
    currentStage,
  };
}

function workflowAtScenarioEvaluation() {
  return createWorkflowAt("scenario-evaluation");
}
