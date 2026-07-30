import { z } from "zod";

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const requirementIdSchema = z.string().regex(/^req-[a-z0-9-]+$/);
const scenarioIdSchema = z.string().regex(/^TS-[A-Z0-9]+-[A-F0-9]{10}$/);
const safeEvidencePathSchema = z
  .string()
  .min(1)
  .refine(
    (path) =>
      !path.startsWith("/") &&
      !path.split("/").includes("..") &&
      !path.startsWith("playwright/.auth/"),
    "Evidence paths must be safe, relative, and exclude authentication state",
  );

const failureClassificationSchema = z.enum([
  "SCRIPT_ERROR",
  "PRODUCT_DEFECT",
  "ENVIRONMENT_FAILURE",
  "TEST_DATA_FAILURE",
  "REQUIREMENT_AMBIGUITY",
  "FLAKY_OR_INCONCLUSIVE",
]);

const failureEvidenceSchema = z.object({
  kind: z.enum([
    "TRACE",
    "SCREENSHOT",
    "VIDEO",
    "REPORT",
    "CONSOLE",
    "NETWORK",
    "ENVIRONMENT",
    "TEST_DATA",
  ]),
  path: safeEvidencePathSchema,
  summary: z.string().min(1).max(2_000),
});

export const failureTriageSchema = z.object({
  schemaVersion: z.literal(1),
  triageId: identifierSchema,
  runId: identifierSchema,
  testId: identifierSchema,
  executionSummaryChecksum: checksumSchema,
  classification: failureClassificationSchema,
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  evidence: z.array(failureEvidenceSchema).min(1),
  contraryEvidence: z.array(z.string().min(1).max(2_000)),
  reproduction: z.object({
    attempted: z.boolean(),
    reproduced: z.boolean(),
    attempts: z.number().int().min(0).max(3),
  }),
  expectedBehavior: z.string().min(1).max(4_000),
  actualBehavior: z.string().min(1).max(4_000),
  intendedConditionReached: z.boolean(),
  ruledOutCauses: z.array(
    z.enum(["SCRIPT", "ENVIRONMENT", "TEST_DATA", "AUTHENTICATION"]),
  ),
});

export const scriptRepairRecordSchema = z.object({
  schemaVersion: z.literal(1),
  repairId: identifierSchema,
  triageId: identifierSchema,
  triageChecksum: checksumSchema,
  classification: z.literal("SCRIPT_ERROR"),
  playwrightTestId: identifierSchema,
  fromRevision: z.number().int().positive(),
  toRevision: z.number().int().positive(),
  attempt: z.number().int().min(1).max(3),
  changeSummary: z.string().min(1).max(2_000),
  applicationChangeAuthorized: z.literal(false),
});

export const defectCandidateSchema = z.object({
  schemaVersion: z.literal(1),
  defectId: identifierSchema,
  triageId: identifierSchema,
  triageChecksum: checksumSchema,
  requirementIds: z.array(requirementIdSchema).min(1),
  scenarioIds: z.array(scenarioIdSchema).min(1),
  title: z.string().min(1).max(240),
  expectedBehavior: z.string().min(1),
  actualBehavior: z.string().min(1),
  evidence: z.array(failureEvidenceSchema).min(1),
  applicationChangeAuthorized: z.literal(false),
});

const traceabilityResultSchema = z.enum([
  "PASSED",
  "FAILED",
  "SKIPPED",
  "TIMED_OUT",
]);

export const finalQualityAssessmentSchema = z.object({
  schemaVersion: z.literal(1),
  assessmentId: identifierSchema,
  runId: identifierSchema,
  executionSummaryChecksums: z.array(checksumSchema).min(1),
  traceability: z.array(
    z.object({
      requirementId: requirementIdSchema,
      scenarioId: scenarioIdSchema,
      testId: identifierSchema,
      result: traceabilityResultSchema,
    }),
  ),
  missingArtifacts: z.array(z.string().min(1)),
  staleTestIds: z.array(identifierSchema),
  unresolvedFailureIds: z.array(identifierSchema),
  skippedCoverage: z.array(z.string().min(1)),
  residualRisks: z.array(z.string().min(1)),
  decision: z.enum(["READY_FOR_HUMAN_REVIEW", "REVISION_REQUIRED", "BLOCKED"]),
  finalApprovalGranted: z.literal(false),
});

export type FailureTriage = z.infer<typeof failureTriageSchema>;
export type FinalQualityAssessment = z.infer<
  typeof finalQualityAssessmentSchema
>;
