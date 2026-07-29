import { z } from "zod";

export const workflowStageSchema = z.enum([
  "requirement-intake",
  "requirement-analysis",
  "requirement-clarification",
  "scenario-generation",
  "scenario-evaluation",
  "human-scenario-review",
  "playwright-implementation",
  "test-execution",
  "failure-triage",
  "test-repair",
  "final-quality-assessment",
  "final-human-review",
  "completed",
  "cancelled",
]);

export const producingRoleSchema = z.enum([
  "workflow-coordinator",
  "requirement-analyst",
  "scenario-designer",
  "scenario-quality-evaluator",
  "human-scenario-reviewer",
  "playwright-test-engineer",
  "failure-triage-analyst",
  "final-quality-assessor",
  "final-human-reviewer",
  "knowledge-curator",
  "workflow-improvement-analyst",
]);

export const artifactTypeSchema = z.enum([
  "task-manifest",
  "decision-manifest",
  "workflow-manifest",
  "artifact-manifest",
  "requirement-source",
  "normalized-requirements",
  "requirement-analysis",
  "requirement-exploration",
  "scenario-specification",
  "scenario-evaluation",
  "human-scenario-review",
  "playwright-test",
  "execution-summary",
  "failure-triage",
  "final-quality-assessment",
  "final-human-review",
]);

const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const gitCommitSchema = z.string().regex(/^[a-f0-9]{40}$/);
const relativeArtifactPathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.split("/").some((segment) => segment === ".." || segment === ""),
    "Artifact paths must be normalized relative paths",
  );

export const provenanceSchema = z.object({
  createdAt: z.iso.datetime(),
  gitCommit: gitCommitSchema,
  gitDirty: z.boolean(),
  nodeVersion: z.string().min(1),
  platform: z.string().min(1),
  provider: z.string().min(1),
  configurationChecksum: checksumSchema,
});

export const artifactReferenceSchema = z.object({
  artifactId: identifierSchema,
  artifactType: artifactTypeSchema,
  revision: z.number().int().positive(),
  semanticChecksum: checksumSchema,
});

const manifestBase = {
  schemaVersion: z.literal(1),
  producingRole: producingRoleSchema,
  workflowStage: workflowStageSchema,
  revision: z.number().int().positive(),
  provenance: provenanceSchema,
  references: z.array(artifactReferenceSchema),
};

export const humanActorSchema = z.object({
  actorType: z.literal("HUMAN"),
  actorId: identifierSchema,
});

export const agentActorSchema = z.object({
  actorType: z.literal("AGENT"),
  actorId: producingRoleSchema,
});

export const actorSchema = z.discriminatedUnion("actorType", [
  humanActorSchema,
  agentActorSchema,
  z.object({
    actorType: z.literal("SYSTEM"),
    actorId: identifierSchema,
  }),
]);

export const taskManifestSchema = z.object({
  artifactType: z.literal("task-manifest"),
  ...manifestBase,
  taskId: identifierSchema,
  runId: identifierSchema,
  feature: identifierSchema,
  subfeature: identifierSchema,
  status: z.enum([
    "ACTIVE",
    "AWAITING_HUMAN",
    "BLOCKED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const exactSubjectSchema = z.object({
  artifactId: identifierSchema,
  revision: z.number().int().positive(),
  semanticChecksum: checksumSchema,
});

export const decisionManifestSchema = z.object({
  artifactType: z.literal("decision-manifest"),
  ...manifestBase,
  decisionId: identifierSchema,
  taskId: identifierSchema,
  decision: z.enum([
    "ANSWERED",
    "PASS",
    "REVISE",
    "BLOCKED",
    "APPROVED",
    "APPROVED_WITH_EXCLUSIONS",
    "CHANGES_REQUESTED",
    "BLOCKED_PENDING_CLARIFICATION",
    "SCRIPT_ERROR",
    "PRODUCT_DEFECT",
    "ENVIRONMENT_FAILURE",
    "TEST_DATA_FAILURE",
    "REQUIREMENT_AMBIGUITY",
    "FLAKY_OR_INCONCLUSIVE",
    "READY_FOR_HUMAN_REVIEW",
    "REVISION_REQUIRED",
  ]),
  actor: actorSchema,
  subject: exactSubjectSchema,
  exclusions: z.array(identifierSchema).optional(),
});

export const workflowManifestSchema = z.object({
  artifactType: z.literal("workflow-manifest"),
  ...manifestBase,
  workflowId: identifierSchema,
  taskId: identifierSchema,
  currentStage: workflowStageSchema,
  status: z.enum([
    "ACTIVE",
    "AWAITING_HUMAN",
    "BLOCKED",
    "COMPLETED",
    "CANCELLED",
  ]),
  retries: z.record(z.string(), z.number().int().nonnegative()),
  transitionHistory: z.array(
    z.object({
      from: workflowStageSchema,
      to: workflowStageSchema,
      actor: actorSchema,
      occurredAt: z.iso.datetime(),
      inputReferences: z.array(artifactReferenceSchema),
      outputReferences: z.array(artifactReferenceSchema),
    }),
  ),
});

export const artifactManifestSchema = z.object({
  artifactType: artifactTypeSchema.exclude([
    "task-manifest",
    "decision-manifest",
    "workflow-manifest",
  ]),
  ...manifestBase,
  artifactId: identifierSchema,
  taskId: identifierSchema,
  path: relativeArtifactPathSchema,
  status: z.enum(["DRAFT", "EVALUATED", "ACCEPTED", "STALE", "REJECTED"]),
  semanticChecksum: checksumSchema.optional(),
  acceptedAt: z.iso.datetime().optional(),
});

export type WorkflowStage = z.infer<typeof workflowStageSchema>;
export type ProducingRole = z.infer<typeof producingRoleSchema>;
export type ArtifactType = z.infer<typeof artifactTypeSchema>;
export type ArtifactReference = z.infer<typeof artifactReferenceSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type ArtifactManifest = z.infer<typeof artifactManifestSchema>;
export type WorkflowManifest = z.infer<typeof workflowManifestSchema>;
