import { describe, expect, it } from "vitest";

import { semanticChecksum } from "../../../src/orchestration/artifact-lifecycle.js";
import type { NormalizedRequirements } from "../../../src/requirements/analysis.js";
import {
  createHumanScenarioReview,
  evaluateScenarios,
  generateScenarioSpecification,
} from "../../../src/scenarios/pipeline.js";
import {
  classifyCapabilityExtension,
  createCleanupRegistry,
  createDeterministicTestId,
  createExecutionSummary,
  createCapabilityExtensionRecord,
  generatePlaywrightTest,
  runPlaywrightPreflight,
  registerBrowserMatrix,
} from "../../../src/playwright/pipeline.js";
import {
  resolvePlaywrightRunPaths,
  resolveProjectTestDirs,
} from "../../../src/playwright/run-config.js";
import type { AutomationPlan } from "../../../src/playwright/contracts.js";

const requirements: NormalizedRequirements = {
  schemaVersion: 1,
  revision: 2,
  sourceId: "login-source",
  sourceChecksum: "a".repeat(64),
  requirements: [
    {
      requirementId: "req-login",
      text: "Registered users must sign in with valid credentials.",
      classification: "STATED_REQUIREMENT",
      source: {
        sourceId: "login-source",
        sourceChecksum: "a".repeat(64),
        startLine: 1,
        endLine: 1,
      },
    },
  ],
};

function approvedScenario() {
  const specification = generateScenarioSpecification(requirements);
  const evaluation = evaluateScenarios(requirements, specification);
  const review = createHumanScenarioReview({
    actor: { actorType: "HUMAN", actorId: "qa-owner" },
    specification,
    evaluation,
    decision: "APPROVED",
  });
  return {
    runId: "run-001",
    specification,
    evaluation,
    review,
    preflight: {
      baseOrigin: "https://synthetic.invalid",
      allowedOrigin: "https://synthetic.invalid",
      configuredEnvironmentVariables: ["E2E_USER_EMAIL"],
      rendererActionKinds: [
        "FILL",
        "CLICK",
        "CLEAR",
        "NAVIGATE",
        "CHECK",
        "UNCHECK",
        "SELECT_OPTION",
        "PRESS_KEY",
        "EXPECT_VISIBLE",
        "EXPECT_HIDDEN",
        "EXPECT_ABSENT",
        "EXPECT_ENABLED",
        "EXPECT_CHECKED",
        "EXPECT_TEXT",
        "EXPECT_VALUE",
        "EXPECT_COUNT",
        "EXPECT_URL",
        "EXPECT_NATIVE_VALIDITY",
        "EXPECT_NATIVE_VALIDATION_MESSAGE",
      ],
      testIdAttribute: "data-testid",
    },
  };
}

describe("Playwright generation authorization", () => {
  it("generates linked tests only for an exact human-approved scenario revision", () => {
    const approved = approvedScenario();
    const scenario = approved.specification.scenarios[0];
    if (scenario === undefined) throw new Error("Expected scenario fixture");

    const generated = generatePlaywrightTest({
      ...approved,
      requirements,
      scenarioId: scenario.scenarioId,
      plan: {
        route: "/login",
        actions: [
          {
            kind: "FILL",
            locator: { kind: "LABEL", value: "Email" },
            valueEnvironmentVariable: "E2E_USER_EMAIL",
          },
          {
            kind: "CLICK",
            locator: { kind: "ROLE", role: "button", name: "Sign in" },
          },
          {
            kind: "EXPECT_VISIBLE",
            locator: { kind: "ROLE", role: "heading", name: "Dashboard" },
          },
        ],
      },
    });

    expect(generated.metadata).toMatchObject({
      scenarioId: scenario.scenarioId,
      scenarioRevision: approved.specification.revision,
      scenarioChecksum: semanticChecksum(approved.specification),
      requirementRevision: requirements.revision,
      requirementIds: scenario.requirementIds,
    });
    expect(generated.source).toContain('getByLabel("Email")');
    expect(generated.source).toContain('getByRole("button"');
    expect(generated.source).toContain("toBeVisible()");
    expect(generated.source).not.toContain("waitForTimeout");
  });

  it("renders the pre-authorized scalable interaction and assertion primitives", () => {
    const approved = approvedScenario();
    const scenario = approved.specification.scenarios[0];
    if (scenario === undefined) throw new Error("Expected scenario fixture");

    const generated = generatePlaywrightTest({
      ...approved,
      requirements,
      scenarioId: scenario.scenarioId,
      plan: {
        route: "/preferences",
        actions: [
          {
            kind: "CHECK",
            locator: { kind: "LABEL", value: "Email updates" },
          },
          {
            kind: "UNCHECK",
            locator: { kind: "LABEL", value: "SMS updates" },
          },
          {
            kind: "SELECT_OPTION",
            locator: { kind: "LABEL", value: "Timezone" },
            value: "UTC",
          },
          {
            kind: "PRESS_KEY",
            locator: { kind: "LABEL", value: "Search" },
            key: "Enter",
          },
          {
            kind: "EXPECT_ENABLED",
            locator: { kind: "ROLE", role: "button", name: "Save" },
          },
          {
            kind: "EXPECT_CHECKED",
            locator: { kind: "LABEL", value: "Email updates" },
          },
          {
            kind: "EXPECT_VALUE",
            locator: { kind: "LABEL", value: "Timezone" },
            value: "UTC",
          },
          {
            kind: "EXPECT_COUNT",
            locator: { kind: "ROLE", role: "listitem", name: "Result" },
            count: 3,
          },
        ],
      },
    });

    expect(generated.source).toContain(".check()");
    expect(generated.source).toContain(".uncheck()");
    expect(generated.source).toContain('.selectOption("UTC")');
    expect(generated.source).toContain('.press("Enter")');
    expect(generated.source).toContain("toBeEnabled()");
    expect(generated.source).toContain("toBeChecked()");
    expect(generated.source).toContain('toHaveValue("UTC")');
    expect(generated.source).toContain("toHaveCount(3)");
  });

  it("rejects absent, stale, non-passing, and excluded approvals", () => {
    const approved = approvedScenario();
    const scenario = approved.specification.scenarios[0];
    if (scenario === undefined) throw new Error("Expected scenario fixture");
    const base = {
      ...approved,
      requirements,
      scenarioId: scenario.scenarioId,
      plan: { route: "/", actions: [] },
    };

    expect(() =>
      generatePlaywrightTest({
        ...base,
        evaluation: { ...approved.evaluation, disposition: "REVISE" },
      }),
    ).toThrow("evaluator PASS");
    expect(() =>
      generatePlaywrightTest({
        ...base,
        review: {
          ...approved.review,
          scenarioChecksum: "b".repeat(64),
        },
      }),
    ).toThrow("exact scenario revision");
    expect(() =>
      generatePlaywrightTest({
        ...base,
        review: {
          ...approved.review,
          decision: "APPROVED_WITH_EXCLUSIONS",
          exclusions: [scenario.scenarioId],
        },
      }),
    ).toThrow("excluded");
  });

  it("rejects unsafe routes, secret literals, and unsupported locator shortcuts", () => {
    const approved = approvedScenario();
    const scenario = approved.specification.scenarios[0];
    if (scenario === undefined) throw new Error("Expected scenario fixture");

    expect(() =>
      generatePlaywrightTest({
        ...approved,
        requirements,
        scenarioId: scenario.scenarioId,
        plan: {
          route: "https://untrusted.example/login",
          actions: [],
        },
      }),
    ).toThrow("relative route");
    expect(() =>
      generatePlaywrightTest({
        ...approved,
        requirements,
        scenarioId: scenario.scenarioId,
        plan: {
          route: "/login",
          actions: [
            {
              kind: "FILL",
              locator: { kind: "LABEL", value: "Credential" },
              value: "embedded-test-value",
            },
          ],
        } as unknown as AutomationPlan,
      }),
    ).toThrow("environment variable");
  });
});

describe("Playwright capability extension policy", () => {
  const lowRiskProposal = {
    capabilityId: "expect-editable",
    actionKind: "EXPECT_EDITABLE",
    category: "ASSERTION" as const,
    playwrightApi: "expect.toBeEditable",
    usesExistingLocator: true,
    deterministicRenderer: true,
    requiresArbitraryCode: false,
    accessesExternalOrigin: false,
    changesBrowserPermissions: false,
    accessesFileSystem: false,
    changesAuthenticationState: false,
    performsDestructiveWrite: false,
    addsDependency: false,
  };

  it("automatically authorizes a bounded deterministic locator capability", () => {
    expect(classifyCapabilityExtension(lowRiskProposal)).toEqual({
      disposition: "AUTO_APPROVED",
      reasons: [
        "Capability is a deterministic locator-based interaction or assertion within policy.",
      ],
      policyVersion: 1,
    });
  });

  it.each([
    ["arbitrary code", { requiresArbitraryCode: true }],
    ["external origin", { accessesExternalOrigin: true }],
    ["browser permission", { changesBrowserPermissions: true }],
    ["filesystem", { accessesFileSystem: true }],
    ["authentication", { changesAuthenticationState: true }],
    ["destructive write", { performsDestructiveWrite: true }],
    ["dependency", { addsDependency: true }],
    ["network category", { category: "NETWORK" as const }],
    ["arbitrary Playwright API", { playwrightApi: "locator.evaluate" }],
  ])("requires human review for %s expansion", (_, unsafeChange) => {
    expect(
      classifyCapabilityExtension({ ...lowRiskProposal, ...unsafeChange })
        .disposition,
    ).toBe("HUMAN_REVIEW_REQUIRED");
  });

  it("creates an immutable audit record from policy output, not agent claims", () => {
    const record = createCapabilityExtensionRecord({
      runId: "run-001",
      actorId: "playwright-test-engineer",
      proposal: lowRiskProposal,
      requestedDisposition: "HUMAN_REVIEW_REQUIRED",
      existingRecords: [],
    });

    expect(record).toMatchObject({
      schemaVersion: 1,
      runId: "run-001",
      actorId: "playwright-test-engineer",
      disposition: "AUTO_APPROVED",
      policyVersion: 1,
    });
    expect(record.proposalChecksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("limits automatic extension to one capability per run", () => {
    const existing = createCapabilityExtensionRecord({
      runId: "run-001",
      actorId: "playwright-test-engineer",
      proposal: lowRiskProposal,
      existingRecords: [],
    });
    expect(() =>
      createCapabilityExtensionRecord({
        runId: "run-001",
        actorId: "playwright-test-engineer",
        proposal: lowRiskProposal,
        existingRecords: [existing],
      }),
    ).toThrow("one automatic capability extension");
  });

  it("rejects tampered prior extension records", () => {
    const existing = createCapabilityExtensionRecord({
      runId: "run-001",
      actorId: "playwright-test-engineer",
      proposal: lowRiskProposal,
      existingRecords: [],
    });

    expect(() =>
      createCapabilityExtensionRecord({
        runId: "run-002",
        actorId: "playwright-test-engineer",
        proposal: lowRiskProposal,
        existingRecords: [{ ...existing, proposalChecksum: "f".repeat(64) }],
      }),
    ).toThrow("checksum");
  });
});

describe("Playwright fixtures and result artifacts", () => {
  it("creates stable run-scoped test data identifiers", () => {
    expect(createDeterministicTestId("run-001", "user")).toBe(
      createDeterministicTestId("run-001", "user"),
    );
    expect(createDeterministicTestId("run-002", "user")).not.toBe(
      createDeterministicTestId("run-001", "user"),
    );
  });

  it("runs registered cleanup in reverse order even after a cleanup failure", async () => {
    const events: string[] = [];
    const cleanup = createCleanupRegistry();
    cleanup.add("first", () => {
      events.push("first");
    });
    cleanup.add("second", () => {
      events.push("second");
      throw new Error("cleanup failed");
    });

    await expect(cleanup.run()).rejects.toThrow("second");
    expect(events).toEqual(["second", "first"]);
  });

  it("registers machine-readable results and evidence with exact traceability", () => {
    const summary = createExecutionSummary({
      runId: "run-001",
      project: "chromium",
      startedAt: "2026-07-30T10:00:00.000Z",
      completedAt: "2026-07-30T10:00:02.000Z",
      tests: [
        {
          testId: "pw-login-001",
          status: "PASSED",
          durationMs: 2000,
          metadata: {
            schemaVersion: 1,
            testId: "pw-login-001",
            scenarioId: "TS-REQ-ABCDEF1234",
            scenarioRevision: 3,
            scenarioChecksum: "a".repeat(64),
            requirementRevision: 2,
            requirementChecksum: "b".repeat(64),
            requirementIds: ["req-login"],
          },
          evidence: [
            {
              kind: "TRACE",
              path: "test-results/pw-login-001/trace.zip",
            },
          ],
        },
      ],
    });

    expect(summary.tests[0]?.metadata.requirementIds).toEqual(["req-login"]);
    expect(summary.tests[0]?.evidence[0]?.path).toContain("test-results/");
  });

  it("requires passing smoke and all three registered browser summaries", () => {
    const tests = [
      {
        testId: "pw-flow-001",
        status: "PASSED" as const,
        durationMs: 10,
        metadata: {
          schemaVersion: 1 as const,
          testId: "pw-flow-001",
          scenarioId: "TS-FLOW-ABCDEF1234",
          scenarioRevision: 1,
          scenarioChecksum: "a".repeat(64),
          requirementRevision: 1,
          requirementChecksum: "b".repeat(64),
          requirementIds: ["req-flow"],
        },
        evidence: [
          {
            kind: "REPORT" as const,
            path: "artifacts/runs/run-001/report.json",
          },
        ],
      },
    ];
    const summaries = ["chromium-smoke", "chromium", "firefox", "webkit"].map(
      (project) =>
        createExecutionSummary({
          runId: "run-001",
          project,
          startedAt: "2026-07-31T10:00:00.000Z",
          completedAt: "2026-07-31T10:00:01.000Z",
          tests,
        }),
    );

    expect(registerBrowserMatrix(summaries, ["pw-flow-001"])).toHaveLength(4);
    expect(() =>
      registerBrowserMatrix(summaries.slice(0, 3), ["pw-flow-001"]),
    ).toThrow(/webkit/);
  });
});

describe("Playwright remediation capabilities and preflight", () => {
  it("discovers only the validated generated run and contains its report path", () => {
    expect(resolvePlaywrightRunPaths("run-001", "run-001")).toEqual({
      runId: "run-001",
      testDir: "./artifacts/runs/run-001/generated",
      reportPath: "artifacts/runs/run-001/playwright-results.json",
    });
    expect(() => resolvePlaywrightRunPaths("../escape", "../escape")).toThrow(
      /safe identifier/,
    );
    expect(
      resolveProjectTestDirs("./artifacts/runs/run-001/generated"),
    ).toEqual({
      authenticationSetup: "./tests/e2e",
      chromiumSmoke: "./artifacts/runs/run-001/generated",
      chromium: "./artifacts/runs/run-001/generated",
      firefox: "./artifacts/runs/run-001/generated",
      webkit: "./artifacts/runs/run-001/generated",
    });
  });

  it("renders bounded stateful navigation and browser-native assertions", () => {
    const approved = approvedScenario();
    const scenario = approved.specification.scenarios[0];
    if (scenario === undefined) throw new Error("Expected scenario fixture");
    const generated = generatePlaywrightTest({
      ...approved,
      requirements,
      scenarioId: scenario.scenarioId,
      plan: {
        route: "/start",
        actions: [
          {
            kind: "CLEAR",
            locator: { kind: "LABEL", value: "Neutral input" },
          },
          { kind: "NAVIGATE", path: "/next" },
          {
            kind: "EXPECT_HIDDEN",
            locator: { kind: "TEST_ID", value: "loading" },
          },
          {
            kind: "EXPECT_ABSENT",
            locator: { kind: "TEST_ID", value: "error" },
          },
          {
            kind: "EXPECT_NATIVE_VALIDITY",
            locator: { kind: "LABEL", value: "Neutral input" },
            valid: true,
          },
          {
            kind: "EXPECT_NATIVE_VALIDATION_MESSAGE",
            locator: { kind: "LABEL", value: "Neutral input" },
            message: "Complete this field.",
          },
        ],
      },
    });

    expect(generated.source).toContain(".clear()");
    expect(generated.source).toContain('page.goto("/next")');
    expect(generated.source).toContain("toBeHidden()");
    expect(generated.source).toContain("toHaveCount(0)");
    expect(generated.source).toContain('"validity"');
    expect(generated.source).toContain('"validationMessage"');
  });

  it("preflights origins, environment, renderer, test IDs, and smoke ordering", () => {
    const result = runPlaywrightPreflight({
      baseOrigin: "https://synthetic.invalid",
      allowedOrigin: "https://synthetic.invalid",
      configuredEnvironmentVariables: ["E2E_VALUE"],
      rendererActionKinds: ["FILL", "CLEAR", "NAVIGATE", "EXPECT_VISIBLE"],
      testIdAttribute: "data-qa-id",
      plan: {
        route: "/start",
        actions: [
          {
            kind: "FILL",
            locator: {
              kind: "TEST_ID",
              attribute: "data-qa-id",
              value: "neutral-input",
            },
            valueEnvironmentVariable: "E2E_VALUE",
          },
          {
            kind: "CLEAR",
            locator: { kind: "LABEL", value: "Neutral input" },
          },
          { kind: "NAVIGATE", path: "/next" },
          {
            kind: "EXPECT_VISIBLE",
            locator: { kind: "ROLE", role: "heading", name: "Complete" },
          },
        ],
      },
    });

    expect(result).toEqual({
      ready: true,
      smokeProject: "chromium-smoke",
      fullProjects: ["chromium", "firefox", "webkit"],
    });
  });

  it("fails preflight for locator configuration and navigation/origin errors", () => {
    expect(() =>
      runPlaywrightPreflight({
        baseOrigin: "https://synthetic.invalid",
        allowedOrigin: "https://synthetic.invalid",
        configuredEnvironmentVariables: [],
        rendererActionKinds: ["EXPECT_VISIBLE"],
        testIdAttribute: "data-testid",
        plan: {
          route: "/",
          actions: [
            {
              kind: "EXPECT_VISIBLE",
              locator: {
                kind: "TEST_ID",
                attribute: "data-qa-id",
                value: "status",
              },
            },
          ],
        },
      }),
    ).toThrow(/test-ID attribute/);
    expect(() =>
      runPlaywrightPreflight({
        baseOrigin: "https://synthetic.invalid",
        allowedOrigin: "https://other.invalid",
        configuredEnvironmentVariables: [],
        rendererActionKinds: ["NAVIGATE"],
        testIdAttribute: "data-testid",
        plan: { route: "/", actions: [{ kind: "NAVIGATE", path: "/next" }] },
      }),
    ).toThrow(/allowlist/);
  });
});
