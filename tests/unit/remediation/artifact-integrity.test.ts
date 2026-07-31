import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  aggregateExecutionResults,
  assertGeneratedTestPath,
  canonicalArtifact,
  createManualResult,
  requireExactApproval,
} from "../../../src/remediation/artifact-integrity.js";

const artifactSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  values: z.array(z.string()),
});

describe("artifact integrity remediation", () => {
  it("parses, canonically serializes, and checksums schema-equivalent values", () => {
    const first = canonicalArtifact(artifactSchema, {
      values: ["one", "two"],
      revision: 1,
      schemaVersion: 1,
      ignored: "stripped by schema",
    });
    const roundTrip = canonicalArtifact(
      artifactSchema,
      JSON.parse(first.serialization),
    );

    expect(roundTrip.serialization).toBe(first.serialization);
    expect(roundTrip.checksum).toBe(first.checksum);
    expect(roundTrip.value).toEqual({
      schemaVersion: 1,
      revision: 1,
      values: ["one", "two"],
    });
  });

  it("fails closed when an approval references a stale revision or checksum", () => {
    const current = canonicalArtifact(artifactSchema, {
      schemaVersion: 1,
      revision: 2,
      values: ["current"],
    });

    expect(() => {
      requireExactApproval(current, {
        revision: 1,
        semanticChecksum: current.checksum,
      });
    }).toThrow(/exact current revision/);
    expect(() => {
      requireExactApproval(current, {
        revision: 2,
        semanticChecksum: "a".repeat(64),
      });
    }).toThrow(/exact current revision/);
  });

  it("routes ad-hoc tests to ignored run storage and gates tracked publication", () => {
    expect(
      assertGeneratedTestPath(
        "artifacts/runs/run-001/generated/example.spec.ts",
      ),
    ).toBe("artifacts/runs/run-001/generated/example.spec.ts");
    expect(() =>
      assertGeneratedTestPath("tests/e2e/generated/example.spec.ts"),
    ).toThrow(/tracked source/);
    expect(() =>
      assertGeneratedTestPath("src/generated/example.spec.ts"),
    ).toThrow(/runtime output/);
    expect(
      assertGeneratedTestPath("tests/e2e/published/example.spec.ts", {
        schemaVersion: 1,
        workflow: "PUBLISH_GENERATED_TEST",
        taskId: "task-001",
        actor: { actorType: "HUMAN", actorId: "reviewer-001" },
        subject: {
          artifactId: "playwright-test-001",
          revision: 1,
          semanticChecksum: "a".repeat(64),
        },
      }),
    ).toBe("tests/e2e/published/example.spec.ts");
  });

  it("aggregates results by run, test revision, and browser without overwriting", () => {
    const results = aggregateExecutionResults([
      execution("chromium", "PASSED"),
      execution("firefox", "FAILED"),
      execution("webkit", "PASSED"),
    ]);

    expect(results.browsers).toEqual(["chromium", "firefox", "webkit"]);
    expect(results.results).toHaveLength(3);
    expect(() =>
      aggregateExecutionResults([
        execution("chromium", "PASSED"),
        execution("chromium", "FAILED"),
      ]),
    ).toThrow(/duplicate execution result/);
  });

  it("registers complete manual results with an exact semantic checksum", () => {
    const result = createManualResult({
      manualResultId: "manual-001",
      runId: "run-001",
      scenarioId: "TS-FLOW-ABCDEF1234",
      scenarioRevision: 2,
      scenarioChecksum: "a".repeat(64),
      reviewer: { actorType: "HUMAN", actorId: "reviewer-001" },
      procedure: ["Open the synthetic form.", "Submit valid neutral data."],
      evidence: ["artifacts/runs/run-001/manual/result.json"],
      outcome: "PASSED",
      completedAt: "2026-07-31T10:00:00.000Z",
    });

    expect(result.semanticChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.reviewer.actorType).toBe("HUMAN");
  });
});

function execution(
  browser: "chromium" | "firefox" | "webkit",
  outcome: "PASSED" | "FAILED",
) {
  return {
    runId: "run-001",
    testId: "pw-flow-001",
    testRevision: 2,
    browser,
    outcome,
    reportPath: `artifacts/runs/run-001/results/2/${browser}/pw-flow-001.json`,
  } as const;
}
