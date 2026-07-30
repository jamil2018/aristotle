import { describe, expect, it } from "vitest";

import {
  artifactRegistry,
  resolveArtifactPath,
} from "../../../src/orchestration/artifact-registry.js";

describe("artifact registry", () => {
  it("defines versioned ownership and validation metadata", () => {
    expect(artifactRegistry["task-manifest"]).toMatchObject({
      producingRole: "workflow-coordinator",
      schemaVersion: 1,
    });
    expect(artifactRegistry["human-scenario-review"]).toMatchObject({
      producingRole: "human-scenario-reviewer",
      workflowStage: "human-scenario-review",
    });
  });

  it("registers requirement artifacts and their provenance chain", () => {
    expect(artifactRegistry["requirement-source"]).toMatchObject({
      producingRole: "workflow-coordinator",
      workflowStage: "requirement-intake",
    });
    expect(
      artifactRegistry["normalized-requirements"].requiredReferences,
    ).toEqual(["requirement-source"]);
    expect(artifactRegistry["requirement-analysis"].requiredReferences).toEqual(
      ["normalized-requirements"],
    );
    expect(artifactRegistry["requirement-exploration"].retentionPolicy).toBe(
      "RUN",
    );
  });

  it("registers auditable Playwright capability extensions", () => {
    expect(artifactRegistry["capability-extension"]).toMatchObject({
      producingRole: "playwright-test-engineer",
      workflowStage: "playwright-implementation",
      retentionPolicy: "PERMANENT",
      requiredReferences: ["scenario-specification", "human-scenario-review"],
    });
  });

  it("keeps knowledge and policy approval as separate permanent artifacts", () => {
    expect(artifactRegistry["knowledge-proposal"]).toMatchObject({
      producingRole: "knowledge-curator",
      workflowStage: "completed",
      requiredReferences: ["run-summary"],
    });
    expect(artifactRegistry["knowledge-approval"]).toMatchObject({
      producingRole: "human-knowledge-reviewer",
      requiredReferences: ["knowledge-proposal"],
    });
    expect(artifactRegistry["improvement-evaluation"]).toMatchObject({
      producingRole: "human-policy-reviewer",
      requiredReferences: ["improvement-proposal"],
    });
  });

  it("resolves a path below the configured artifact root", () => {
    expect(
      resolveArtifactPath("/repo/artifacts", {
        feature: "login",
        subfeature: "authentication",
        taskId: "task-001",
        runId: "run-001",
        artifactType: "workflow-manifest",
        revision: 2,
      }),
    ).toBe(
      "/repo/artifacts/login/authentication/task-001/run-001/workflow-manifest.r2.json",
    );
  });

  it.each(["../login", "/absolute", "contains spaces", "UPPERCASE"])(
    "rejects unsafe path segment %s",
    (feature) => {
      expect(() =>
        resolveArtifactPath("/repo/artifacts", {
          feature,
          subfeature: "authentication",
          taskId: "task-001",
          runId: "run-001",
          artifactType: "workflow-manifest",
          revision: 1,
        }),
      ).toThrow();
    },
  );
});
