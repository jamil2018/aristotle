import { describe, expect, it } from "vitest";

import { semanticChecksum } from "../../../src/orchestration/artifact-lifecycle.js";
import type { NormalizedRequirements } from "../../../src/requirements/analysis.js";
import {
  createHumanScenarioReview,
  evaluateScenarios,
  generateScenarioSpecification,
} from "../../../src/scenarios/pipeline.js";
import {
  createCleanupRegistry,
  createDeterministicTestId,
  createExecutionSummary,
  generatePlaywrightTest,
} from "../../../src/playwright/pipeline.js";
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
  return { specification, evaluation, review };
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
});
