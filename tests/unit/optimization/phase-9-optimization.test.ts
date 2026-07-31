import { describe, expect, it } from "vitest";

import {
  authenticationIntakeProfileSchema,
  generatedTestQualitySchema,
  stageHandoffSchema,
} from "../../../src/optimization/contracts.js";
import {
  compactCoordinatorContext,
  createPackageManifest,
  createBoundedArtifactDigest,
  createSafeTelemetry,
  createStageHandoff,
  evaluateGeneratedTestQuality,
  partitionCorpus,
  progressiveExecutionPlan,
  runAuthenticationPreflight,
  scanForSecrets,
  validateFreshRoleContext,
  validateStageDispatch,
} from "../../../src/optimization/pipeline.js";
import { taskManifestSchema } from "../../../src/schemas/contracts.js";

const checksum = "a".repeat(64);

describe("Phase 9 optimization contracts", () => {
  it("normalizes schema-v1 tasks to downstream-versioned disposition", () => {
    const task = taskManifestSchema.parse({
      artifactType: "task-manifest",
      schemaVersion: 1,
      producingRole: "workflow-coordinator",
      workflowStage: "requirement-intake",
      revision: 1,
      provenance: {
        createdAt: "2026-07-31T00:00:00.000Z",
        gitCommit: "b".repeat(40),
        gitDirty: false,
        nodeVersion: "22.18.0",
        platform: "darwin",
        provider: "codex",
        configurationChecksum: checksum,
      },
      references: [],
      taskId: "task-001",
      runId: "run-001",
      feature: "authentication",
      subfeature: "login",
      status: "ACTIVE",
    });

    expect(task.schemaVersion).toBe(2);
    expect(task.artifactDisposition).toBe("VERSIONED");
  });

  it("requires fresh, role-bound handoffs without prior-agent reasoning", () => {
    const handoff = createStageHandoff({
      handoffId: "handoff-001",
      workflowId: "workflow-001",
      stage: "test-quality-evaluation",
      destinationRole: "playwright-quality-evaluator",
      executionContextId: "context-evaluator-001",
      origin: "https://example.test",
      environment: "test",
      inputReferences: [
        {
          artifactId: "playwright-001",
          artifactType: "playwright-test",
          revision: 1,
          semanticChecksum: checksum,
        },
      ],
      secretReferenceNames: ["E2E_USERNAME"],
      summary: "Evaluate the exact generated test revision.",
      status: "READY",
    });

    expect(stageHandoffSchema.parse(handoff).context.priorAgentReasoning).toBe(
      false,
    );
    expect(() => {
      validateFreshRoleContext(handoff, {
        contextId: "context-author-001",
        role: "playwright-quality-evaluator",
      });
    }).toThrow(/fresh/);
    expect(() => {
      validateStageDispatch("test-quality-evaluation", "workflow-coordinator");
    }).toThrow(/authoritative role/);
  });

  it("binds quality PASS and sanitized command evidence to the exact test checksum", () => {
    const quality = evaluateGeneratedTestQuality({
      evaluationId: "quality-001",
      testArtifactId: "playwright-001",
      testRevision: 1,
      testChecksum: checksum,
      evaluatorContextId: "context-evaluator-001",
      authorContextId: "context-author-001",
      findings: [],
      checks: [
        {
          command: "npm run lint",
          tool: "eslint",
          toolVersion: "10.8.0",
          files: ["tests/e2e/specs/authentication/login.spec.ts"],
          result: "PASS",
          sanitizedSummary: "No findings.",
        },
      ],
    });

    expect(generatedTestQualitySchema.parse(quality).decision).toBe("PASS");
    expect(() =>
      evaluateGeneratedTestQuality({
        ...quality,
        testChecksum: "c".repeat(64),
        evaluatedChecksum: checksum,
      }),
    ).toThrow(/exact test checksum/);
  });

  it("groups authentication intake and blocks unsafe preflight before smoke", () => {
    const intake = authenticationIntakeProfileSchema.parse({
      schemaVersion: 1,
      profileId: "auth-login",
      successSignals: [{ text: "Welcome", casing: "EXACT" }],
      accountAuthority: "human-task-owner",
      credentialReferences: ["E2E_USERNAME", "E2E_PASSWORD"],
      sessionMechanism: "COOKIE",
      alreadyAuthenticatedRoute: "/dashboard",
      persistence: "RUN_ONLY",
      validationOwner: "playwright-test-engineer",
      accessibility: ["keyboard", "screen-reader-name"],
      browsers: ["chromium", "firefox", "webkit"],
      evidenceMode: "OFF",
      cleanup: "Delete ignored storage state after the run.",
      artifactDisposition: "LOCAL_AUDIT_ONLY",
      classifications: [{ item: "Welcome", classification: "REQUIREMENT" }],
      clarificationRound: 1,
    });
    const result = runAuthenticationPreflight({
      intake,
      approvedScenarioChecksum: checksum,
      testChecksum: checksum,
      qualityEvaluation: evaluateGeneratedTestQuality({
        evaluationId: "quality-001",
        testArtifactId: "playwright-001",
        testRevision: 1,
        testChecksum: checksum,
        evaluatorContextId: "quality-context",
        authorContextId: "author-context",
        findings: [],
        checks: [],
      }),
      allowedOrigin: "https://example.test",
      requestedOrigin: "https://example.test",
      availableEnvironmentVariables: ["E2E_USERNAME"],
      availableBrowsers: ["chromium"],
      outputDirectorySafe: true,
      evidencePolicySafe: true,
    });

    expect(result.readyForCredentialSmoke).toBe(false);
    expect(result.steps).toEqual(["STATIC_PREFLIGHT"]);
    expect(result.blockers).toContain(
      "Missing credential reference E2E_PASSWORD",
    );
  });

  it("redacts secret matches and packages only SCM-eligible durable outputs", () => {
    const scan = scanForSecrets([
      {
        path: "test-results/auth.txt",
        content: "password=synthetic-secret-value",
      },
    ]);
    expect(scan.matches).toHaveLength(1);
    expect(JSON.stringify(scan)).not.toContain("synthetic-secret-value");

    const manifest = createPackageManifest({
      packageId: "package-001",
      artifactDisposition: "EPHEMERAL_SOURCE_VALIDATION",
      artifacts: [
        { path: "tests/e2e/specs/authentication/login.spec.ts", kind: "FINAL" },
        { path: "test-results/trace.zip", kind: "RAW_AUTH_EVIDENCE" },
        { path: "artifacts/run.json", kind: "AUDIT" },
      ],
    });
    expect(manifest.scmEligibleOutputs).toEqual([]);
    expect(manifest.excludedOutputs).toHaveLength(3);
  });

  it("bounds coordinator context and partitions large taxonomies consistently", () => {
    expect(
      compactCoordinatorContext({
        workflowId: "workflow-001",
        acceptedReferences: [],
        pendingGate: "HUMAN_SCENARIO_APPROVAL",
        handoffSummaries: Array.from(
          { length: 12 },
          (_, index) => `h-${String(index)}`,
        ),
        unresolvedHumanQuestions: ["What is the exact success casing?"],
        safetyEvents: [],
      }).handoffSummaries,
    ).toHaveLength(8);

    const partitions = partitionCorpus(
      Array.from({ length: 5 }, (_, index) => ({
        id: `requirement-${String(index)}`,
        taxonomy: index < 3 ? "authentication/login" : "profile/settings",
      })),
      2,
    );
    expect(partitions.partitions).toHaveLength(3);
    expect(partitions.requiresCrossPartitionEvaluation).toBe(true);
    expect(
      progressiveExecutionPlan({
        preflightPassed: true,
        credentialSmokePassed: true,
        chromiumPassed: true,
        remainingBrowsers: ["firefox", "webkit"],
      }),
    ).toEqual([
      "STATIC_PREFLIGHT",
      "CREDENTIAL_SMOKE_CHROMIUM",
      "CHROMIUM_SCENARIOS",
      "BROWSER_SCENARIOS_FIREFOX",
      "BROWSER_SCENARIOS_WEBKIT",
      "POLICY_AUTHORIZED_AFFECTED_RERUNS",
    ]);
    expect(
      createSafeTelemetry({
        workflowId: "workflow-001",
        stage: "scenario-evaluation",
        durationMs: 12,
        inputArtifacts: 2,
        outputArtifacts: 1,
        partitionCount: 3,
        safetyEventCount: 0,
      }),
    ).not.toHaveProperty("prompt");
    expect(
      createBoundedArtifactDigest({ summary: "x".repeat(600) }).truncated,
    ).toBe(true);
  });
});
