import { describe, expect, it } from "vitest";

import {
  artifactManifestSchema,
  decisionManifestSchema,
  humanActorSchema,
  taskManifestSchema,
  workflowManifestSchema,
} from "../../../src/schemas/contracts.js";

const provenance = {
  createdAt: "2026-07-29T10:00:00.000Z",
  gitCommit: "a".repeat(40),
  gitDirty: false,
  nodeVersion: "v22.18.0",
  platform: "darwin-arm64",
  provider: "codex",
  configurationChecksum: "b".repeat(64),
};

describe("artifact contracts", () => {
  it("accepts a versioned task manifest", () => {
    const result = taskManifestSchema.parse({
      artifactType: "task-manifest",
      schemaVersion: 1,
      producingRole: "workflow-coordinator",
      workflowStage: "requirement-intake",
      revision: 1,
      taskId: "task-authentication",
      runId: "run-001",
      feature: "login",
      subfeature: "authentication",
      status: "ACTIVE",
      provenance,
      references: [],
    });

    expect(result.taskId).toBe("task-authentication");
  });

  it("rejects an agent pretending to be a human actor", () => {
    expect(() =>
      humanActorSchema.parse({
        actorType: "AGENT",
        actorId: "scenario-designer",
      }),
    ).toThrow();
  });

  it("requires decisions to reference an exact artifact revision and checksum", () => {
    expect(() =>
      decisionManifestSchema.parse({
        artifactType: "decision-manifest",
        schemaVersion: 1,
        producingRole: "human-scenario-reviewer",
        workflowStage: "human-scenario-review",
        revision: 1,
        decisionId: "decision-001",
        taskId: "task-authentication",
        decision: "APPROVED",
        actor: { actorType: "HUMAN", actorId: "reviewer-1" },
        subject: {
          artifactId: "scenario-001",
          revision: 1,
        },
        provenance,
        references: [],
      }),
    ).toThrow();
  });

  it("rejects malformed workflow and artifact manifests", () => {
    expect(() =>
      workflowManifestSchema.parse({
        artifactType: "workflow-manifest",
        schemaVersion: 1,
        producingRole: "workflow-coordinator",
        workflowStage: "scenario-generation",
        revision: 0,
      }),
    ).toThrow();

    expect(() =>
      artifactManifestSchema.parse({
        artifactType: "scenario-specification",
        schemaVersion: 1,
        producingRole: "scenario-designer",
        workflowStage: "scenario-generation",
        revision: 1,
        artifactId: "scenario-001",
        taskId: "task-authentication",
        path: "../outside.json",
        status: "DRAFT",
        provenance,
        references: [],
      }),
    ).toThrow();
  });
});
