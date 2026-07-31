import { createHash } from "node:crypto";

import type { ArtifactReference } from "../schemas/contracts.js";
import {
  generatedTestQualitySchema,
  stageHandoffSchema,
  type AuthenticationIntakeProfile,
  type GeneratedTestQuality,
  type StageHandoff,
} from "./contracts.js";

const authoritativeStageRole = {
  "requirement-analysis": "requirement-analyst",
  "scenario-generation": "scenario-designer",
  "scenario-evaluation": "scenario-quality-evaluator",
  "playwright-implementation": "playwright-test-engineer",
  "test-quality-evaluation": "playwright-quality-evaluator",
  "test-execution": "playwright-test-engineer",
  "failure-triage": "failure-triage-analyst",
  "test-repair": "playwright-test-engineer",
  "final-quality-assessment": "final-quality-assessor",
} as const;

export function validateStageDispatch(
  stage: keyof typeof authoritativeStageRole,
  role: string,
): void {
  if (authoritativeStageRole[stage] !== role) {
    throw new Error(
      `${stage} requires its authoritative role ${authoritativeStageRole[stage]}`,
    );
  }
}

export function createStageHandoff(
  input: Omit<
    StageHandoff,
    | "schemaVersion"
    | "authorizedTarget"
    | "evidencePolicy"
    | "artifactDisposition"
    | "context"
    | "outputExpectations"
  > & {
    readonly origin: string;
    readonly environment: string;
  },
): StageHandoff {
  validateStageDispatch(
    input.stage as keyof typeof authoritativeStageRole,
    input.destinationRole,
  );
  return stageHandoffSchema.parse({
    ...input,
    schemaVersion: 1,
    authorizedTarget: {
      origin: input.origin,
      environment: input.environment,
    },
    evidencePolicy: "OFF",
    artifactDisposition: "VERSIONED",
    context: {
      maxInputReferences: 100,
      priorAgentReasoning: false,
      summaryOnly: true,
    },
    outputExpectations: [],
  });
}

export function validateFreshRoleContext(
  handoff: StageHandoff,
  invocation: { readonly contextId: string; readonly role: string },
): void {
  const parsed = stageHandoffSchema.parse(handoff);
  validateStageDispatch(
    parsed.stage as keyof typeof authoritativeStageRole,
    invocation.role,
  );
  if (parsed.executionContextId !== invocation.contextId) {
    throw new Error("Specialist execution requires a verifiably fresh context");
  }
}

const qualityDimensions = [
  "locatorOwnership",
  "fixtureIsolation",
  "credentialBoundaries",
  "duplication",
  "abstractions",
  "readability",
  "traceability",
  "importBoundaries",
  "cohesion",
] as const;

interface QualityInput extends Omit<
  GeneratedTestQuality,
  "schemaVersion" | "decision" | "dimensions" | "evaluatedChecksum"
> {
  readonly evaluatedChecksum?: string;
}

export function evaluateGeneratedTestQuality(
  input: QualityInput,
): GeneratedTestQuality {
  const evaluatedChecksum = input.evaluatedChecksum ?? input.testChecksum;
  if (input.testChecksum !== evaluatedChecksum) {
    throw new Error("Quality evaluation must bind to the exact test checksum");
  }
  if (input.evaluatorContextId === input.authorContextId) {
    throw new Error(
      "Playwright author and quality evaluator contexts must differ",
    );
  }
  const passed =
    input.findings.length === 0 &&
    input.checks.every((check) => check.result === "PASS");
  return generatedTestQualitySchema.parse({
    ...input,
    schemaVersion: 1,
    evaluatedChecksum,
    decision: passed ? "PASS" : "REVISE",
    dimensions: Object.fromEntries(
      qualityDimensions.map((dimension) => [
        dimension,
        passed ? "PASS" : "FAIL",
      ]),
    ),
  });
}

interface PreflightInput {
  readonly intake: AuthenticationIntakeProfile;
  readonly approvedScenarioChecksum: string;
  readonly testChecksum: string;
  readonly qualityEvaluation: GeneratedTestQuality;
  readonly allowedOrigin: string;
  readonly requestedOrigin: string;
  readonly availableEnvironmentVariables: readonly string[];
  readonly availableBrowsers: readonly string[];
  readonly outputDirectorySafe: boolean;
  readonly evidencePolicySafe: boolean;
}

export function runAuthenticationPreflight(input: PreflightInput) {
  const blockers: string[] = [];
  if (input.approvedScenarioChecksum.length !== 64) {
    blockers.push("Scenario approval checksum is missing");
  }
  if (
    input.qualityEvaluation.decision !== "PASS" ||
    input.qualityEvaluation.testChecksum !== input.testChecksum
  ) {
    blockers.push("Exact generated-test quality PASS is required");
  }
  if (input.requestedOrigin !== input.allowedOrigin) {
    blockers.push("Requested origin is not authorized");
  }
  for (const reference of input.intake.credentialReferences) {
    if (!input.availableEnvironmentVariables.includes(reference)) {
      blockers.push(`Missing credential reference ${reference}`);
    }
  }
  if (!input.availableBrowsers.includes("chromium")) {
    blockers.push("Chromium is unavailable");
  }
  if (!input.outputDirectorySafe) blockers.push("Output directory is unsafe");
  if (!input.evidencePolicySafe) blockers.push("Evidence policy is unsafe");
  return {
    readyForCredentialSmoke: blockers.length === 0,
    blockers,
    steps: ["STATIC_PREFLIGHT"] as const,
    nextStep:
      blockers.length === 0 ? ("CREDENTIAL_SMOKE_CHROMIUM" as const) : null,
  };
}

export function scanForSecrets(
  files: readonly { readonly path: string; readonly content: string }[],
) {
  const pattern =
    /(?:(?:password|secret|token)\s*:\s*["'][A-Za-z0-9+/_=-]{12,}["']|(?:password|secret|token)\s*=\s*[A-Za-z0-9+/_=-]{12,}(?=\s|$)|authorization\s*[:=]\s*["']?(?:Bearer|Basic)\s+[A-Za-z0-9+/_=-]{12,}["']?|cookie\s*[:=]\s*["'][^"']{12,}["'])/giu;
  const matches = files.flatMap((file) =>
    [...file.content.matchAll(pattern)].map((match) => ({
      path: file.path,
      fingerprint: createHash("sha256")
        .update(match[0])
        .digest("hex")
        .slice(0, 16),
      redacted: true as const,
    })),
  );
  return { scannedFiles: files.length, matches };
}

export function createBoundedArtifactDigest(input: unknown): {
  readonly checksum: string;
  readonly byteLength: number;
  readonly preview: string;
  readonly truncated: boolean;
} {
  const serialized = JSON.stringify(input);
  const maxPreviewBytes = 512;
  return {
    checksum: createHash("sha256").update(serialized).digest("hex"),
    byteLength: Buffer.byteLength(serialized),
    preview: serialized.slice(0, maxPreviewBytes),
    truncated: serialized.length > maxPreviewBytes,
  };
}

export function createSafeTelemetry(input: {
  readonly workflowId: string;
  readonly stage: string;
  readonly durationMs: number;
  readonly inputArtifacts: number;
  readonly outputArtifacts: number;
  readonly partitionCount: number;
  readonly safetyEventCount: number;
}) {
  return {
    schemaVersion: 1 as const,
    ...input,
  };
}

export function progressiveExecutionPlan(input: {
  readonly preflightPassed: boolean;
  readonly credentialSmokePassed?: boolean;
  readonly chromiumPassed?: boolean;
  readonly remainingBrowsers: readonly ("firefox" | "webkit")[];
}) {
  if (!input.preflightPassed) return ["STATIC_PREFLIGHT"] as const;
  if (input.credentialSmokePassed !== true) {
    return ["STATIC_PREFLIGHT", "CREDENTIAL_SMOKE_CHROMIUM"] as const;
  }
  if (input.chromiumPassed !== true) {
    return [
      "STATIC_PREFLIGHT",
      "CREDENTIAL_SMOKE_CHROMIUM",
      "CHROMIUM_SCENARIOS",
    ] as const;
  }
  return [
    "STATIC_PREFLIGHT",
    "CREDENTIAL_SMOKE_CHROMIUM",
    "CHROMIUM_SCENARIOS",
    ...input.remainingBrowsers.map(
      (browser) => `BROWSER_SCENARIOS_${browser.toUpperCase()}` as const,
    ),
    "POLICY_AUTHORIZED_AFFECTED_RERUNS",
  ];
}

interface PackageArtifact {
  readonly path: string;
  readonly kind: "FINAL" | "AUDIT" | "EPHEMERAL" | "RAW_AUTH_EVIDENCE";
}

export function createPackageManifest(input: {
  readonly packageId: string;
  readonly artifactDisposition:
    "VERSIONED" | "EPHEMERAL_SOURCE_VALIDATION" | "LOCAL_AUDIT_ONLY";
  readonly artifacts: readonly PackageArtifact[];
}) {
  const eligible = input.artifacts.filter(
    (artifact) =>
      input.artifactDisposition === "VERSIONED" && artifact.kind === "FINAL",
  );
  return {
    schemaVersion: 1 as const,
    packageId: input.packageId,
    artifactDisposition: input.artifactDisposition,
    scmEligibleOutputs: eligible.map((artifact) => artifact.path),
    excludedOutputs: input.artifacts
      .filter((artifact) => !eligible.includes(artifact))
      .map((artifact) => ({
        path: artifact.path,
        reason:
          artifact.kind === "RAW_AUTH_EVIDENCE"
            ? "SECRETS_AND_RAW_AUTH_EVIDENCE_ARE_NEVER_VERSIONABLE"
            : input.artifactDisposition,
      })),
  };
}

export function compactCoordinatorContext(input: {
  readonly workflowId: string;
  readonly acceptedReferences: readonly ArtifactReference[];
  readonly pendingGate: string | null;
  readonly handoffSummaries: readonly string[];
  readonly unresolvedHumanQuestions: readonly string[];
  readonly safetyEvents: readonly string[];
}) {
  return {
    ...input,
    acceptedReferences: input.acceptedReferences.slice(-32),
    handoffSummaries: input.handoffSummaries.slice(-8),
    unresolvedHumanQuestions: input.unresolvedHumanQuestions.slice(-8),
    safetyEvents: input.safetyEvents.slice(-16),
  };
}

export function partitionCorpus(
  requirements: readonly { readonly id: string; readonly taxonomy: string }[],
  limit: number,
) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Partition limit must be a positive integer");
  }
  const grouped = new Map<
    string,
    { readonly id: string; readonly taxonomy: string }[]
  >();
  for (const item of requirements) {
    const group = grouped.get(item.taxonomy) ?? [];
    group.push(item);
    grouped.set(item.taxonomy, group);
  }
  const partitions = [...grouped.entries()].flatMap(([taxonomy, items]) =>
    Array.from({ length: Math.ceil(items.length / limit) }, (_, index) => ({
      taxonomy,
      items: items.slice(index * limit, (index + 1) * limit),
    })),
  );
  return {
    partitions,
    metrics: partitions.map((partition) => ({
      taxonomy: partition.taxonomy,
      count: partition.items.length,
    })),
    requiresCrossPartitionEvaluation: partitions.length > 1,
  };
}
