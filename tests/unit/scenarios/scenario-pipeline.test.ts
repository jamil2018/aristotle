import { describe, expect, it } from "vitest";

import { semanticChecksum } from "../../../src/orchestration/artifact-lifecycle.js";
import type { NormalizedRequirements } from "../../../src/requirements/analysis.js";
import {
  createHumanScenarioReview,
  evaluateScenarios,
  generateScenarioSpecification,
  projectScenarioMarkdown,
  reviseScenarioSpecification,
  validateScenarioProjection,
  validateTraceability,
} from "../../../src/scenarios/pipeline.js";

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
    {
      requirementId: "req-lockout",
      text: "The account must lock after five failed sign-in attempts.",
      classification: "STATED_REQUIREMENT",
      source: {
        sourceId: "login-source",
        sourceChecksum: "a".repeat(64),
        startLine: 2,
        endLine: 2,
      },
    },
  ],
};

describe("scenario contracts and generation", () => {
  it("generates stable scenarios across applicable coverage dimensions", () => {
    const specification = generateScenarioSpecification(requirements);

    expect(specification.requirementRevision).toBe(2);
    expect(
      specification.scenarios.map((scenario) => scenario.coverage),
    ).toEqual(expect.arrayContaining(["POSITIVE", "NEGATIVE", "BOUNDARY"]));
    expect(
      specification.scenarios.every(
        (scenario) =>
          scenario.steps.length > 0 &&
          scenario.steps.every((step) => step.expectedResult.length > 0),
      ),
    ).toBe(true);
  });

  it("keeps stable IDs when intent is unchanged", () => {
    const first = generateScenarioSpecification(requirements);
    const second = generateScenarioSpecification(requirements);

    expect(second.scenarios.map((scenario) => scenario.scenarioId)).toEqual(
      first.scenarios.map((scenario) => scenario.scenarioId),
    );
  });

  it("renders authoritative Markdown and rejects a divergent projection", () => {
    const specification = generateScenarioSpecification(requirements);
    const markdown = projectScenarioMarkdown(specification);

    expect(markdown).toContain("## TS-");
    expect(validateScenarioProjection(markdown, specification)).toMatchObject({
      semanticChecksum: semanticChecksum(specification),
    });

    const divergent = {
      ...specification,
      scenarios: specification.scenarios.slice(1),
    };
    expect(() => validateScenarioProjection(markdown, divergent)).toThrow(
      "projection disagrees",
    );
  });

  it("renders untrusted requirement text without breaking Markdown tables", () => {
    const loginRequirement = requirements.requirements[0];
    if (loginRequirement === undefined) {
      throw new Error("Expected login requirement fixture");
    }
    const specification = generateScenarioSpecification({
      ...requirements,
      requirements: [
        {
          ...loginRequirement,
          text: "Users must sign in with email | username.",
        },
      ],
    });

    expect(projectScenarioMarkdown(specification)).toContain("\\|");
  });
});

describe("scenario evaluation and review", () => {
  it("passes a complete, traceable specification", () => {
    const specification = generateScenarioSpecification(requirements);
    const evaluation = evaluateScenarios(requirements, specification);

    expect(evaluation.disposition).toBe("PASS");
    expect(evaluation.scenarioChecksum).toBe(semanticChecksum(specification));
    expect(evaluation.findings).toEqual([]);
  });

  it("returns REVISE for missing coverage and BLOCKED for unknown requirements", () => {
    const specification = generateScenarioSpecification(requirements);
    const missingCoverage = {
      ...specification,
      scenarios: specification.scenarios.filter(
        (scenario) => scenario.coverage === "POSITIVE",
      ),
    };
    const unknownRequirement = {
      ...specification,
      scenarios: specification.scenarios.map((scenario, index) =>
        index === 0
          ? { ...scenario, requirementIds: ["req-unknown"] }
          : scenario,
      ),
    };

    expect(evaluateScenarios(requirements, missingCoverage).disposition).toBe(
      "REVISE",
    );
    expect(
      evaluateScenarios(requirements, unknownRequirement).disposition,
    ).toBe("BLOCKED");
  });

  it("bounds material revisions and requires reevaluation", () => {
    let specification = generateScenarioSpecification(requirements);
    for (let index = 0; index < 3; index += 1) {
      specification = reviseScenarioSpecification(specification, {
        findings: [`Revision ${String(index + 1)}`],
        revise: (scenarios) => scenarios,
      });
      expect(specification.evaluation).toBe("PENDING");
      expect(specification.humanReview).toBe("PENDING");
    }

    expect(() =>
      reviseScenarioSpecification(specification, {
        findings: ["Fourth revision"],
        revise: (scenarios) => scenarios,
      }),
    ).toThrow("revision limit");
  });

  it("accepts only exact evaluator-passed revisions from a human actor", () => {
    const specification = generateScenarioSpecification(requirements);
    const evaluation = evaluateScenarios(requirements, specification);
    const excludedScenario = specification.scenarios[0]?.scenarioId ?? "";
    const review = createHumanScenarioReview({
      actor: { actorType: "HUMAN", actorId: "product-owner" },
      specification,
      evaluation,
      decision: "APPROVED_WITH_EXCLUSIONS",
      exclusions: [excludedScenario],
    });

    expect(review.exclusions).toEqual([excludedScenario]);
    expect(() =>
      createHumanScenarioReview({
        actor: {
          actorType: "AGENT",
          actorId: "scenario-quality-evaluator",
        },
        specification,
        evaluation,
        decision: "APPROVED",
      }),
    ).toThrow("human actor");
    expect(() =>
      createHumanScenarioReview({
        actor: { actorType: "HUMAN", actorId: "product-owner" },
        specification: { ...specification, revision: 2 },
        evaluation,
        decision: "APPROVED",
      }),
    ).toThrow("exact scenario revision");
    expect(() =>
      createHumanScenarioReview({
        actor: { actorType: "HUMAN", actorId: "product-owner" },
        specification,
        evaluation,
        decision: "APPROVED",
        exclusions: [excludedScenario],
      }),
    ).toThrow("cannot contain");
  });
});

describe("scenario traceability", () => {
  it("validates bidirectional requirement-to-scenario links", () => {
    const specification = generateScenarioSpecification(requirements);
    const traceability = validateTraceability(requirements, specification);

    expect(traceability.requirements).toHaveLength(2);
    expect(traceability.scenarios).toHaveLength(specification.scenarios.length);
  });

  it("rejects orphaned requirements and scenarios", () => {
    const specification = generateScenarioSpecification(requirements);
    const orphaned = {
      ...specification,
      scenarios: specification.scenarios.filter(
        (scenario) => !scenario.requirementIds.includes("req-lockout"),
      ),
    };

    expect(() => validateTraceability(requirements, orphaned)).toThrow(
      "bidirectional traceability",
    );
  });
});
