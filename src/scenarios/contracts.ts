import { z } from "zod";

const requirementIdSchema = z
  .string()
  .min(1)
  .regex(/^req-[a-z0-9-]+$/);
const scenarioIdSchema = z
  .string()
  .min(1)
  .regex(/^TS-[A-Z0-9]+-[A-F0-9]{10}$/);
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);

const scenarioStepSchema = z.object({
  step: z.number().int().positive(),
  action: z.string().min(1),
  expectedResult: z.string().min(1),
});

const scenarioSchema = z.object({
  scenarioId: scenarioIdSchema,
  title: z.string().min(1),
  requirementIds: z.array(requirementIdSchema).min(1),
  objective: z.string().min(1),
  coverage: z.enum([
    "POSITIVE",
    "NEGATIVE",
    "BOUNDARY",
    "VALIDATION",
    "PERMISSION",
    "STATE_TRANSITION",
    "PERSISTENCE",
    "RECOVERY",
    "INTEGRATION",
    "ACCESSIBILITY",
    "CROSS_BROWSER",
  ]),
  semanticDomain: z.enum([
    "VALIDATION",
    "AUTHENTICATION_STATE",
    "NUMERIC_BOUNDARY",
    "SECURITY_ACCESS_CONTROL",
    "OPERATIONAL_POLICY",
    "GENERAL_FUNCTIONAL",
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  testType: z.enum(["FUNCTIONAL", "QUALITY"]),
  automation: z.enum(["CANDIDATE", "MANUAL", "UNSUITABLE"]),
  feasibility: z.enum([
    "AUTOMATABLE",
    "CAPABILITY_EXTENSION_REQUIRED",
    "MANUAL",
    "BLOCKED",
  ]),
  actor: z.string().min(1),
  preconditions: z.array(z.string().min(1)),
  testData: z.array(
    z.object({
      field: z.string().min(1),
      strategy: z.string().min(1),
      sensitivity: z.enum(["NONE", "REFERENCE", "SECRET_REFERENCE"]),
    }),
  ),
  steps: z.array(scenarioStepSchema).min(1),
  postconditions: z.array(z.string().min(1)),
  cleanup: z.array(z.string().min(1)),
  assumptions: z.array(z.string().min(1)),
  exclusions: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  notes: z.array(z.string().min(1)),
});

export const scenarioSpecificationSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  revisionCycle: z.number().int().min(0).max(3),
  requirementRevision: z.number().int().positive(),
  requirementChecksum: checksumSchema,
  scenarios: z.array(scenarioSchema).min(1),
  removedScenarios: z.array(
    z.object({
      scenarioId: scenarioIdSchema,
      reason: z.string().min(1),
    }),
  ),
  evaluation: z.enum(["PENDING", "PASS", "REVISE", "BLOCKED"]),
  humanReview: z.enum([
    "PENDING",
    "APPROVED",
    "APPROVED_WITH_EXCLUSIONS",
    "CHANGES_REQUESTED",
    "BLOCKED_PENDING_CLARIFICATION",
  ]),
});

export const scenarioEvaluationSchema = z.object({
  schemaVersion: z.literal(1),
  scenarioRevision: z.number().int().positive(),
  scenarioChecksum: checksumSchema,
  disposition: z.enum(["PASS", "REVISE", "BLOCKED"]),
  findings: z.array(
    z.object({
      kind: z.enum([
        "MISSING_COVERAGE",
        "UNKNOWN_REQUIREMENT",
        "ORPHANED_REQUIREMENT",
        "DUPLICATE_SCENARIO",
        "UNOBSERVABLE_RESULT",
        "CIRCULAR_OUTCOME",
        "UNSUPPORTED_COVERAGE",
        "MISSING_STATE_SETUP",
        "INSUFFICIENT_ASSERTION",
        "SEMANTIC_DUPLICATE",
      ]),
      message: z.string().min(1),
      requirementIds: z.array(z.string().min(1)),
      scenarioIds: z.array(z.string().min(1)),
    }),
  ),
});

export const humanScenarioReviewSchema = z.object({
  schemaVersion: z.literal(1),
  scenarioRevision: z.number().int().positive(),
  scenarioChecksum: checksumSchema,
  evaluationChecksum: checksumSchema,
  actorId: z.string().min(1),
  decision: z.enum(["APPROVED", "APPROVED_WITH_EXCLUSIONS"]),
  exclusions: z.array(scenarioIdSchema),
});

export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioSpecification = z.infer<typeof scenarioSpecificationSchema>;
export type ScenarioEvaluation = z.infer<typeof scenarioEvaluationSchema>;
export type HumanScenarioReview = z.infer<typeof humanScenarioReviewSchema>;
