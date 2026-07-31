import { describe, expect, it } from "vitest";

import {
  evaluateSyntheticBenchmark,
  syntheticQualityCorpus,
} from "../../../src/benchmarks/synthetic-quality-corpus.js";

describe("provider-neutral synthetic quality benchmark", () => {
  it("contains deterministic neutral cases for every observed failure class", () => {
    expect(syntheticQualityCorpus).toHaveLength(20);
    expect(
      new Set(syntheticQualityCorpus.map((item) => item.failureClass)),
    ).toEqual(
      new Set([
        "SAFE_COMPLETE",
        "CIRCULAR_OUTCOME",
        "UNSUPPORTED_COVERAGE",
        "SEMANTIC_DUPLICATE",
        "MISSING_STATE_SETUP",
        "INSUFFICIENT_ASSERTION",
      ]),
    );
  });

  it("has zero unsafe false PASS and at least 95 percent agreement", () => {
    const metrics = evaluateSyntheticBenchmark();

    expect(metrics.unsafeFalsePasses).toBe(0);
    expect(metrics.dispositionAgreement).toBeGreaterThanOrEqual(0.95);
    expect(metrics.expectedAgreement).toBeGreaterThanOrEqual(0.95);
  });
});
