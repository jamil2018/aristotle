import path from "node:path";

import { z } from "zod";

import {
  canonicalSerialize,
  semanticChecksum,
} from "../orchestration/artifact-lifecycle.js";
const safeRuntimePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !path.isAbsolute(value) &&
      !/^[a-zA-Z]:|^\\\\|\\/.test(value) &&
      !value
        .split("/")
        .some(
          (segment) => segment === "" || segment === ".." || segment === ".",
        ),
    "Runtime paths must be normalized repository-relative paths",
  );

export interface CanonicalArtifact<T> {
  readonly value: T;
  readonly serialization: string;
  readonly checksum: string;
}

export function canonicalArtifact<T>(
  schema: z.ZodType<T>,
  input: unknown,
): CanonicalArtifact<T> {
  const value = schema.parse(input);
  const serialization = canonicalSerialize(value);
  return {
    value,
    serialization,
    checksum: semanticChecksum(value),
  };
}

export function requireExactApproval<T extends { readonly revision: number }>(
  current: CanonicalArtifact<T>,
  approval: {
    readonly revision: number;
    readonly semanticChecksum: string;
  },
): void {
  z.string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(approval.semanticChecksum);
  if (
    approval.revision !== current.value.revision ||
    approval.semanticChecksum !== current.checksum
  ) {
    throw new Error(
      "Approval must reference the exact current revision and checksum",
    );
  }
}

export function assertGeneratedTestPath(
  candidate: string,
  authorization?: PublicationAuthorization,
): string {
  const normalized = safeRuntimePathSchema.parse(candidate);
  const isRunArtifact =
    /^artifacts\/runs\/[a-z0-9-]+\/generated\/.+\.spec\.ts$/.test(normalized);
  if (isRunArtifact) return normalized;

  const isTrackedRuntimeOutput =
    /^(?:src|tests\/e2e)\/(?:generated|pilot)\//.test(normalized);
  const isPublishedTest = /^tests\/e2e\/published\/.+\.spec\.ts$/.test(
    normalized,
  );
  if (isPublishedTest && authorization !== undefined) {
    publicationAuthorizationSchema.parse(authorization);
    return normalized;
  }
  if (isPublishedTest) {
    throw new Error(
      "Tracked test publication requires distinct publication authorization",
    );
  }
  if (isTrackedRuntimeOutput) {
    throw new Error(
      "Generated runtime output cannot be written beneath tracked source",
    );
  }
  throw new Error("Generated tests must use ignored run-artifact storage");
}

const executionResultSchema = z
  .object({
    runId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    testId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    testRevision: z.number().int().positive(),
    browser: z.enum(["chromium", "firefox", "webkit"]),
    outcome: z.enum(["PASSED", "FAILED", "SKIPPED", "TIMED_OUT"]),
    reportPath: safeRuntimePathSchema,
  })
  .superRefine((result, context) => {
    const expected = `artifacts/runs/${result.runId}/results/${String(result.testRevision)}/${result.browser}/${result.testId}.json`;
    if (result.reportPath !== expected) {
      context.addIssue({
        code: "custom",
        path: ["reportPath"],
        message: `Execution report path must be ${expected}`,
      });
    }
  });

export type ExecutionResult = z.infer<typeof executionResultSchema>;

export function aggregateExecutionResults(inputs: readonly ExecutionResult[]) {
  const results = inputs.map((input) => executionResultSchema.parse(input));
  const keys = new Set<string>();
  for (const result of results) {
    const key = [
      result.runId,
      result.testId,
      result.testRevision,
      result.browser,
    ].join(":");
    if (keys.has(key))
      throw new Error(`Refusing duplicate execution result: ${key}`);
    keys.add(key);
  }
  return {
    results,
    browsers: [...new Set(results.map((result) => result.browser))].sort(),
  };
}

const manualResultContentSchema = z.object({
  schemaVersion: z.literal(1),
  manualResultId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  runId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  scenarioId: z.string().regex(/^TS-[A-Z0-9]+-[A-F0-9]{10}$/),
  scenarioRevision: z.number().int().positive(),
  scenarioChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  reviewer: z.object({
    actorType: z.literal("HUMAN"),
    actorId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
  procedure: z.array(z.string().min(1)).min(1),
  evidence: z.array(safeRuntimePathSchema).min(1),
  outcome: z.enum(["PASSED", "FAILED", "BLOCKED"]),
  completedAt: z.iso.datetime(),
});

export const manualResultSchema = manualResultContentSchema.extend({
  semanticChecksum: z.string().regex(/^[a-f0-9]{64}$/),
});

export type ManualResult = z.infer<typeof manualResultSchema>;

export function createManualResult(
  input: Omit<z.input<typeof manualResultContentSchema>, "schemaVersion">,
): ManualResult {
  const canonical = canonicalArtifact(manualResultContentSchema, {
    schemaVersion: 1,
    ...input,
  });
  return manualResultSchema.parse({
    ...canonical.value,
    semanticChecksum: canonical.checksum,
  });
}

const publicationAuthorizationSchema = z.object({
  schemaVersion: z.literal(1),
  workflow: z.literal("PUBLISH_GENERATED_TEST"),
  taskId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  actor: z.object({
    actorType: z.literal("HUMAN"),
    actorId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
  subject: z.object({
    artifactId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    revision: z.number().int().positive(),
    semanticChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  }),
});

export type PublicationAuthorization = z.infer<
  typeof publicationAuthorizationSchema
>;
