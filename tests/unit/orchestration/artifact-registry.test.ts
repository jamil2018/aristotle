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
