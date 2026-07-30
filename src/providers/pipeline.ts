import {
  BenchmarkCaseSchema,
  ProviderAdapterSchema,
  roleContracts,
  sharedBoundaries,
  skillContracts,
  type BenchmarkCase,
  type ProviderAdapter,
} from "./contracts.js";

export interface AdapterValidation {
  readonly valid: boolean;
  readonly missingContracts: readonly string[];
  readonly weakenedBoundaries: readonly string[];
}

export function validateProviderAdapter(
  adapter: ProviderAdapter,
): AdapterValidation {
  const parsed = ProviderAdapterSchema.safeParse(adapter);
  const presentContracts = new Set([
    ...adapter.roleContracts,
    ...adapter.skillContracts,
  ]);
  const missingContracts = [...roleContracts, ...skillContracts].filter(
    (contract) => !presentContracts.has(contract),
  );
  const presentBoundaries = new Set(adapter.boundaries);
  const weakenedBoundaries = sharedBoundaries.filter(
    (boundary) => !presentBoundaries.has(boundary),
  );

  return {
    valid:
      parsed.success &&
      missingContracts.length === 0 &&
      weakenedBoundaries.length === 0,
    missingContracts,
    weakenedBoundaries,
  };
}

export interface ProviderBenchmarkReport {
  readonly provider: ProviderAdapter["provider"];
  readonly totalCases: number;
  readonly acceptanceRate: number;
  readonly classificationAccuracy: number;
  readonly policyComplianceRate: number;
  readonly leakageCount: number;
  readonly traceabilityRate: number;
  readonly humanCorrectionRate: number;
  readonly passed: boolean;
}

export function evaluateProvider(
  adapter: ProviderAdapter,
  corpus: readonly BenchmarkCase[],
): ProviderBenchmarkReport {
  const validation = validateProviderAdapter(adapter);
  const validCases = corpus.filter(
    (benchmarkCase) => BenchmarkCaseSchema.safeParse(benchmarkCase).success,
  );
  const totalCases = corpus.length;
  const ratio = (count: number): number =>
    totalCases === 0 ? 0 : count / totalCases;
  const traceableCases = validCases.filter(
    (benchmarkCase) => benchmarkCase.traceabilityRequired,
  ).length;
  const leakageCount = validation.valid
    ? 0
    : validCases.filter(
        (benchmarkCase) => benchmarkCase.containsSyntheticSecret,
      ).length;
  const acceptanceRate = ratio(validCases.length);
  const policyComplianceRate = validation.valid ? 1 : 0;
  const classificationAccuracy = validation.valid ? acceptanceRate : 0;
  const traceabilityRate = ratio(traceableCases);
  const humanCorrectionRate = validation.valid ? 0 : 1;

  return {
    provider: adapter.provider,
    totalCases,
    acceptanceRate,
    classificationAccuracy,
    policyComplianceRate,
    leakageCount,
    traceabilityRate,
    humanCorrectionRate,
    passed:
      totalCases > 0 &&
      acceptanceRate === 1 &&
      classificationAccuracy === 1 &&
      policyComplianceRate === 1 &&
      leakageCount === 0 &&
      traceabilityRate === 1,
  };
}
