import { describe, expect, it } from "vitest";

import {
  benchmarkCorpus,
  providerAdapters,
  roleContracts,
  skillContracts,
} from "../../../src/providers/contracts.js";
import {
  evaluateProvider,
  validateProviderAdapter,
} from "../../../src/providers/pipeline.js";

describe("provider hardening", () => {
  it("keeps every provider bound to the shared contracts and human gates", () => {
    for (const adapter of providerAdapters) {
      expect(validateProviderAdapter(adapter)).toEqual({
        valid: true,
        missingContracts: [],
        weakenedBoundaries: [],
      });
      expect(adapter.roleContracts).toEqual(roleContracts);
      expect(adapter.skillContracts).toEqual(skillContracts);
      expect(adapter.stopAtFinalHumanReview).toBe(true);
    }
  });

  it("rejects an adapter that weakens a shared boundary", () => {
    const adapter = providerAdapters[0];
    if (!adapter) {
      throw new Error("Expected a provider adapter fixture.");
    }

    expect(
      validateProviderAdapter({
        ...adapter,
        boundaries: adapter.boundaries.filter(
          (boundary) => boundary !== "HUMAN_APPROVAL_REQUIRED",
        ),
      }),
    ).toEqual({
      valid: false,
      missingContracts: [],
      weakenedBoundaries: ["HUMAN_APPROVAL_REQUIRED"],
    });
  });

  it("runs the permanent benchmark with complete traceability and no leakage", () => {
    for (const adapter of providerAdapters) {
      const report = evaluateProvider(adapter, benchmarkCorpus);

      expect(report.provider).toBe(adapter.provider);
      expect(report.totalCases).toBeGreaterThanOrEqual(16);
      expect(report.acceptanceRate).toBe(1);
      expect(report.classificationAccuracy).toBe(1);
      expect(report.policyComplianceRate).toBe(1);
      expect(report.leakageCount).toBe(0);
      expect(report.traceabilityRate).toBe(1);
      expect(report.humanCorrectionRate).toBe(0);
      expect(report.passed).toBe(true);
    }
  });
});
