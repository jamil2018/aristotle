import path from "node:path";

import type {
  ArtifactType,
  ProducingRole,
  WorkflowStage,
} from "../schemas/contracts.js";

interface ArtifactDefinition {
  readonly producingRole: ProducingRole;
  readonly workflowStage: WorkflowStage;
  readonly schemaVersion: 1;
  readonly retentionPolicy: "PERMANENT" | "RUN";
  readonly requiredReferences: readonly ArtifactType[];
}

export const artifactRegistry = {
  "task-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [],
  },
  "decision-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [],
  },
  "workflow-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [],
  },
  "artifact-manifest": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [],
  },
  "requirement-source": {
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [],
  },
  "normalized-requirements": {
    producingRole: "requirement-analyst",
    workflowStage: "requirement-analysis",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["requirement-source"],
  },
  "requirement-analysis": {
    producingRole: "requirement-analyst",
    workflowStage: "requirement-analysis",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["normalized-requirements"],
  },
  "requirement-exploration": {
    producingRole: "requirement-analyst",
    workflowStage: "requirement-analysis",
    schemaVersion: 1,
    retentionPolicy: "RUN",
    requiredReferences: ["requirement-source"],
  },
  "scenario-specification": {
    producingRole: "scenario-designer",
    workflowStage: "scenario-generation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["normalized-requirements"],
  },
  "scenario-evaluation": {
    producingRole: "scenario-quality-evaluator",
    workflowStage: "scenario-evaluation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["scenario-specification"],
  },
  "human-scenario-review": {
    producingRole: "human-scenario-reviewer",
    workflowStage: "human-scenario-review",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["scenario-specification", "scenario-evaluation"],
  },
  "playwright-test": {
    producingRole: "playwright-test-engineer",
    workflowStage: "playwright-implementation",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: [
      "normalized-requirements",
      "scenario-specification",
      "human-scenario-review",
    ],
  },
  "execution-summary": {
    producingRole: "playwright-test-engineer",
    workflowStage: "test-execution",
    schemaVersion: 1,
    retentionPolicy: "RUN",
    requiredReferences: ["playwright-test"],
  },
  "failure-triage": {
    producingRole: "failure-triage-analyst",
    workflowStage: "failure-triage",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["execution-summary"],
  },
  "final-quality-assessment": {
    producingRole: "final-quality-assessor",
    workflowStage: "final-quality-assessment",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["execution-summary"],
  },
  "final-human-review": {
    producingRole: "final-human-reviewer",
    workflowStage: "final-human-review",
    schemaVersion: 1,
    retentionPolicy: "PERMANENT",
    requiredReferences: ["final-quality-assessment"],
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
