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

  it("allows test repair only after SCRIPT_ERROR classification", () => {
    const workflow = createWorkflowAt("failure-triage");

    expect(() =>
      transitionWorkflow(workflow, {
        to: "test-repair",
        actor: coordinator,
        occurredAt: "2026-07-29T10:04:00.000Z",
        gate: { kind: "TRIAGE", classification: "PRODUCT_DEFECT" },
      }),
    ).toThrow(/SCRIPT_ERROR/);
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
        },
      }),
    ).toThrow(/final-quality-assessor/);
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
