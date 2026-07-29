import path from "node:path";

import type {
  ArtifactType,
  ProducingRole,
  WorkflowStage,
} from "../schemas/contracts.js";

export interface ArtifactDefinition {
  readonly producingRole: ProducingRole;
  readonly workflowStage: WorkflowStage;
  readonly schemaVersion: 1;
  readonly retentionPolicy: "PERMANENT" | "RUN";
}

export const artifactRegistry = {
  "task-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "decision-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "workflow-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "artifact-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "normalized-requirements": {
    producingRole: "requirement-analyst",
    workflowStage: "requirement-analysis",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "scenario-specification": {
    producingRole: "scenario-designer",
    workflowStage: "scenario-generation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "scenario-evaluation": {
    producingRole: "scenario-quality-evaluator",
    workflowStage: "scenario-evaluation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "human-scenario-review": {
    producingRole: "human-scenario-reviewer",
    workflowStage: "human-scenario-review",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "playwright-test": {
    producingRole: "playwright-test-engineer",
    workflowStage: "playwright-implementation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "execution-summary": {
    producingRole: "playwright-test-engineer",
    workflowStage: "test-execution",
    schemaVersion: 1,
    retentionPolicy: "RUN",
  },
  "failure-triage": {
    producingRole: "failure-triage-analyst",
    workflowStage: "failure-triage",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "final-quality-assessment": {
    producingRole: "final-quality-assessor",
    workflowStage: "final-quality-assessment",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
  "final-human-review": {
    producingRole: "final-human-reviewer",
    workflowStage: "final-human-review",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
  },
} as const satisfies Record<ArtifactType, ArtifactDefinition>;

const safeSegment = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ArtifactPathInput {
  readonly feature: string;
  readonly subfeature: string;
  readonly taskId: string;
  readonly runId: string;
  readonly artifactType: ArtifactType;
  readonly revision: number;
}

export function resolveArtifactPath(
  artifactRoot: string,
  input: ArtifactPathInput,
): string {
  for (const segment of [
    input.feature,
    input.subfeature,
    input.taskId,
    input.runId,
  ]) {
    if (!safeSegment.test(segment)) {
      throw new Error(`Unsafe artifact path segment: ${segment}`);
    }
  }
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) {
    throw new Error("Artifact revision must be a positive integer");
  }

  const root = path.resolve(artifactRoot);
  const resolved = path.resolve(
    root,
    input.feature,
    input.subfeature,
    input.taskId,
    input.runId,
    `${input.artifactType}.r${String(input.revision)}.json`,
  );
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Resolved artifact path escapes the artifact root");
  }
  return resolved;
}
