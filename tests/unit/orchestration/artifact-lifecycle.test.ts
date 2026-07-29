import { describe, expect, it } from "vitest";

import {
  acceptArtifact,
  createArtifactRevision,
  invalidateDownstreamArtifacts,
  semanticChecksum,
} from "../../../src/orchestration/artifact-lifecycle.js";
import type {
  Actor,
  ArtifactManifest,
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
const designer: Actor = {
  actorType: "AGENT",
  actorId: "scenario-designer",
};

describe("artifact lifecycle", () => {
  it("produces a stable checksum independent of object key order", () => {
    expect(semanticChecksum({ title: "Login", id: "scenario-1" })).toBe(
      semanticChecksum({ id: "scenario-1", title: "Login" }),
    );
  });

  it("accepts only artifacts produced by the registered actor at the right stage", () => {
    const accepted = acceptArtifact(draftScenario(), {
      actor: designer,
      content: { id: "scenario-1", title: "Login" },
      acceptedAt: "2026-07-29T10:01:00.000Z",
      availableArtifacts: [acceptedRequirement()],
    });

    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.semanticChecksum).toMatch(/^[a-f0-9]{64}$/);

    expect(() =>
      acceptArtifact(draftScenario(), {
        actor: {
          actorType: "AGENT",
          actorId: "workflow-coordinator",
        },
        content: {},
        acceptedAt: "2026-07-29T10:01:00.000Z",
        availableArtifacts: [acceptedRequirement()],
      }),
    ).toThrow(/registered producing role/);
  });

  it("never permits an agent to author a human review", () => {
    const review: ArtifactManifest = {
      ...draftScenario(),
      artifactType: "human-scenario-review",
      producingRole: "human-scenario-reviewer",
      workflowStage: "human-scenario-review",
      artifactId: "review-001",
      path: "review-001.r1.json",
    };

    expect(() =>
      acceptArtifact(review, {
        actor: {
          actorType: "AGENT",
          actorId: "workflow-coordinator",
        },
        content: { decision: "APPROVED" },
        acceptedAt: "2026-07-29T10:01:00.000Z",
      }),
    ).toThrow(/human actor/);
  });

  it("rejects missing, stale, or checksum-mismatched references", () => {
    expect(() =>
      acceptArtifact(draftScenario(), {
        actor: designer,
        content: { id: "scenario-1" },
        acceptedAt: "2026-07-29T10:01:00.000Z",
        availableArtifacts: [],
      }),
    ).toThrow(/exact accepted revision/);
  });

  it("creates a new draft revision without mutating the accepted artifact", () => {
    const accepted = acceptArtifact(draftScenario(), {
      actor: designer,
      content: { id: "scenario-1" },
      acceptedAt: "2026-07-29T10:01:00.000Z",
      availableArtifacts: [acceptedRequirement()],
    });

    const revision = createArtifactRevision(
      accepted,
      "scenario-001.r2.json",
      provenance,
    );

    expect(accepted.status).toBe("ACCEPTED");
    expect(revision).toMatchObject({
      revision: 2,
      status: "DRAFT",
      path: "scenario-001.r2.json",
    });
    expect(revision.semanticChecksum).toBeUndefined();
  });

  it("marks exact downstream references stale after material change", () => {
    const oldChecksum = "c".repeat(64);
    const dependent: ArtifactManifest = {
      ...draftScenario(),
      artifactType: "playwright-test",
      producingRole: "playwright-test-engineer",
      workflowStage: "playwright-implementation",
      artifactId: "test-001",
      path: "test-001.r1.json",
      status: "ACCEPTED",
      semanticChecksum: "d".repeat(64),
      acceptedAt: "2026-07-29T10:01:00.000Z",
      references: [
        {
          artifactId: "scenario-001",
          artifactType: "scenario-specification",
          revision: 1,
          semanticChecksum: oldChecksum,
        },
      ],
    };

    const [invalidated] = invalidateDownstreamArtifacts(
      {
        artifactId: "scenario-001",
        artifactType: "scenario-specification",
        revision: 1,
        semanticChecksum: oldChecksum,
      },
      [dependent],
    );

    expect(invalidated?.status).toBe("STALE");
  });
});

function draftScenario(): ArtifactManifest {
  return {
    artifactType: "scenario-specification",
    schemaVersion: 1,
    producingRole: "scenario-designer",
    workflowStage: "scenario-generation",
    revision: 1,
    provenance,
    references: [
      {
        artifactId: "requirements-001",
        artifactType: "normalized-requirements",
        revision: 1,
        semanticChecksum: "e".repeat(64),
      },
    ],
    artifactId: "scenario-001",
    taskId: "task-001",
    path: "scenario-001.r1.json",
    status: "DRAFT",
  };
}

function acceptedRequirement(): ArtifactManifest {
  return {
    artifactType: "normalized-requirements",
    schemaVersion: 1,
    producingRole: "requirement-analyst",
    workflowStage: "requirement-analysis",
    revision: 1,
    provenance,
    references: [],
    artifactId: "requirements-001",
    taskId: "task-001",
    path: "requirements-001.r1.json",
    status: "ACCEPTED",
    semanticChecksum: "e".repeat(64),
    acceptedAt: "2026-07-29T09:00:00.000Z",
  };
}
