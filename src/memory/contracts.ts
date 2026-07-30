import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const boundedTextSchema = z.string().min(1).max(4_000);

export const memoryScopeSchema = z.object({
  feature: identifierSchema,
  role: identifierSchema,
  applicationArea: identifierSchema,
  environment: identifierSchema,
  browser: identifierSchema,
  artifactType: identifierSchema,
  failureSignature: identifierSchema,
});

const feedbackCategorySchema = z.enum([
  "HUMAN_CORRECTION",
  "EVALUATOR_FINDING",
  "FINAL_REVIEW_CORRECTION",
  "TRIAGE_OVERTURNED",
  "SCRIPT_REPAIR",
  "MISSING_COVERAGE",
  "FLAKY_OUTCOME",
  "STALE_ARTIFACT",
  "PLACEMENT_QUESTION",
]);

export const runSummarySchema = z
  .object({
    schemaVersion: z.literal(1),
    summaryId: identifierSchema,
    taskId: identifierSchema,
    runId: identifierSchema,
    completedAt: z.iso.datetime(),
    scope: memoryScopeSchema,
    inputReferences: z.array(boundedTextSchema),
    outputReferences: z.array(boundedTextSchema),
    transitions: z.array(boundedTextSchema),
    decisions: z.array(boundedTextSchema),
    feedback: z.array(
      z.object({
        category: feedbackCategorySchema,
        summary: boundedTextSchema,
      }),
    ),
    metrics: z.object({
      repairCount: z.number().int().nonnegative(),
      flakyOutcomeCount: z.number().int().nonnegative(),
      coverageGapCount: z.number().int().nonnegative(),
    }),
    redactions: z.array(boundedTextSchema),
    rawTranscriptStored: z.literal(false),
  })
  .strict();

export const knowledgeProposalSchema = z.object({
  schemaVersion: z.literal(1),
  proposalId: identifierSchema,
  scope: memoryScopeSchema,
  lesson: boundedTextSchema,
  evidence: z
    .array(
      z.object({
        summaryId: identifierSchema,
        summaryChecksum: checksumSchema,
      }),
    )
    .min(1),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  invalidationConditions: z.array(boundedTextSchema).min(1),
  containsSensitiveData: z.literal(false),
  approvalState: z.enum(["PROPOSED", "APPROVED", "REJECTED", "STALE"]),
  approval: z
    .object({
      actorId: identifierSchema,
      decision: z.enum(["APPROVED", "REJECTED"]),
      proposalChecksum: checksumSchema,
      decidedAt: z.iso.datetime(),
    })
    .optional(),
  policyChangeAuthorized: z.literal(false),
});

const feedbackEventSchema = z.object({
  feedbackId: identifierSchema,
  taskId: identifierSchema,
  category: feedbackCategorySchema,
  findingSignature: identifierSchema,
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "SEVERE"]),
  summary: boundedTextSchema,
  containsSensitiveData: z.literal(false),
});

export const improvementProposalSchema = z.object({
  schemaVersion: z.literal(1),
  proposalId: identifierSchema,
  category: z.enum(["SKILL", "RULE", "SCHEMA", "TEMPLATE", "TOOL", "DOCUMENT"]),
  findingSignature: identifierSchema,
  evidence: z.array(feedbackEventSchema).min(1),
  trigger: z.enum(["RECURRING_FINDING", "SEVERE_FAILURE", "HUMAN_REQUEST"]),
  rootCauseHypothesis: boundedTextSchema,
  proposedChange: boundedTextSchema,
  risks: z.array(boundedTextSchema).min(1),
  validationCases: z.array(boundedTextSchema).min(1),
  expectedBenefits: z.array(boundedTextSchema).min(1),
  rollbackPlan: boundedTextSchema,
  policyChangeAuthorized: z.literal(false),
});

export const improvementEvaluationSchema = z.object({
  schemaVersion: z.literal(1),
  proposalId: identifierSchema,
  proposalChecksum: checksumSchema,
  regressionPassed: z.boolean(),
  shadowEvaluationPassed: z.boolean(),
  decision: z.enum(["ADOPT", "REJECT", "ROLLBACK"]),
  rollbackPlan: boundedTextSchema,
});

export type MemoryScope = z.infer<typeof memoryScopeSchema>;
export type RunSummary = z.infer<typeof runSummarySchema>;
export type KnowledgeProposal = z.infer<typeof knowledgeProposalSchema>;
export type FeedbackEvent = z.infer<typeof feedbackEventSchema>;
export type ImprovementProposal = z.infer<typeof improvementProposalSchema>;
