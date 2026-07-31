import { z } from "zod";

import { relativeArtifactPathSchema } from "../schemas/contracts.js";

const identifier = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const checksum = z.string().regex(/^[a-f0-9]{64}$/);
const artifactDispositionSchema = z.enum([
  "VERSIONED",
  "EPHEMERAL_SOURCE_VALIDATION",
  "LOCAL_AUDIT_ONLY",
]);

export const stageHandoffSchema = z.object({
  schemaVersion: z.literal(1),
  handoffId: identifier,
  workflowId: identifier,
  stage: z.string().min(1),
  destinationRole: z.string().min(1),
  executionContextId: identifier,
  invocationIdentity: z.string().min(1).optional(),
  inputReferences: z
    .array(
      z.object({
        artifactId: identifier,
        artifactType: z.string().min(1),
        revision: z.number().int().positive(),
        semanticChecksum: checksum,
      }),
    )
    .max(100),
  authorizedTarget: z.object({
    origin: z
      .url()
      .refine((value) => ["http:", "https:"].includes(new URL(value).protocol)),
    environment: z.string().min(1),
  }),
  secretReferenceNames: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  evidencePolicy: z.enum(["OFF", "MINIMAL_REDACTED_SHORT_RETENTION"]),
  artifactDisposition: artifactDispositionSchema,
  context: z.object({
    maxInputReferences: z.number().int().positive().max(100),
    priorAgentReasoning: z.literal(false),
    summaryOnly: z.literal(true),
  }),
  outputExpectations: z.array(z.string().min(1)),
  status: z.enum(["READY", "BLOCKED", "COMPLETE"]),
  summary: z.string().min(1).max(2_000),
});

export const generatedTestQualitySchema = z.object({
  schemaVersion: z.literal(1),
  evaluationId: identifier,
  testArtifactId: identifier,
  testRevision: z.number().int().positive(),
  testChecksum: checksum,
  evaluatedChecksum: checksum,
  evaluatorContextId: identifier,
  authorContextId: identifier,
  decision: z.enum(["PASS", "REVISE", "BLOCKED"]),
  dimensions: z.record(
    z.enum([
      "locatorOwnership",
      "fixtureIsolation",
      "credentialBoundaries",
      "duplication",
      "abstractions",
      "readability",
      "traceability",
      "importBoundaries",
      "cohesion",
    ]),
    z.enum(["PASS", "FAIL"]),
  ),
  findings: z.array(z.string()),
  checks: z.array(
    z.object({
      command: z.string().min(1),
      tool: z.string().min(1),
      toolVersion: z.string().min(1),
      files: z.array(relativeArtifactPathSchema),
      result: z.enum(["PASS", "FAIL"]),
      sanitizedSummary: z.string().max(2_000),
    }),
  ),
});

export const authenticationIntakeProfileSchema = z.object({
  schemaVersion: z.literal(1),
  profileId: identifier,
  successSignals: z.array(
    z.object({
      text: z.string().min(1),
      casing: z.enum(["EXACT", "CASE_INSENSITIVE"]),
    }),
  ),
  accountAuthority: z.string().min(1),
  credentialReferences: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  sessionMechanism: z.enum(["COOKIE", "TOKEN", "FEDERATED", "OTHER"]),
  alreadyAuthenticatedRoute: z.string().startsWith("/"),
  persistence: z.enum(["NONE", "RUN_ONLY"]),
  validationOwner: z.string().min(1),
  accessibility: z.array(z.string().min(1)),
  browsers: z.array(z.enum(["chromium", "firefox", "webkit"])).min(1),
  evidenceMode: z.enum(["OFF", "MINIMAL_REDACTED_SHORT_RETENTION"]),
  cleanup: z.string().min(1),
  artifactDisposition: artifactDispositionSchema,
  classifications: z.array(
    z.object({
      item: z.string().min(1),
      classification: z.enum(["REQUIREMENT", "ASSUMPTION", "OBSERVATION"]),
    }),
  ),
  clarificationRound: z.number().int().positive(),
});

export type StageHandoff = z.infer<typeof stageHandoffSchema>;
export type GeneratedTestQuality = z.infer<typeof generatedTestQualitySchema>;
export type AuthenticationIntakeProfile = z.infer<
  typeof authenticationIntakeProfileSchema
>;
