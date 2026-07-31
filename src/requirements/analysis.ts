import { createHash } from "node:crypto";

import type { Actor } from "../schemas/contracts.js";
import {
  normalizedRequirementsSchema,
  requirementAnalysisSchema,
} from "./contracts.js";
import type { IngestedRequirementSource } from "./ingestion.js";

export type RequirementClassification =
  "STATED_REQUIREMENT" | "ASSUMPTION" | "OBSERVATION";

export interface RequirementSourceReference {
  readonly sourceId: string;
  readonly sourceChecksum: string;
  readonly startLine: number;
  readonly endLine: number;
}

export interface AtomicRequirement {
  readonly requirementId: string;
  readonly text: string;
  readonly classification: RequirementClassification;
  readonly source: RequirementSourceReference;
}

export interface NormalizedRequirements {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly sourceId: string;
  readonly sourceChecksum: string;
  readonly requirements: readonly AtomicRequirement[];
}

export type RequirementIssueKind =
  "CONTRADICTION" | "OMISSION" | "ASSUMPTION" | "AMBIGUITY";

export interface RequirementIssue {
  readonly kind: RequirementIssueKind;
  readonly requirementIds: readonly string[];
  readonly message: string;
  readonly blocking: boolean;
}

export interface RequirementAnalysis {
  readonly issues: readonly RequirementIssue[];
  readonly clarificationQuestions: readonly ClarificationQuestion[];
  readonly hasBlockingAmbiguity: boolean;
}

export interface ClarificationQuestion {
  readonly requirementId?: string | undefined;
  readonly requirementText: string;
  readonly ambiguity: string;
  readonly evidence: readonly string[];
  readonly impact: string;
  readonly decisionOptions: readonly string[];
}

export function normalizeRequirements(
  source: IngestedRequirementSource,
  revision: number,
): NormalizedRequirements {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new Error("Requirement revision must be a positive integer");
  }
  const requirements = source.text.split(/\r?\n/).flatMap((line, lineIndex) =>
    splitAtomicStatements(line).map((text) => ({
      requirementId: stableRequirementId(text),
      text,
      classification: classify(text),
      source: {
        sourceId: source.sourceId,
        sourceChecksum: source.originalChecksum,
        startLine: lineIndex + 1,
        endLine: lineIndex + 1,
      },
    })),
  );
  return normalizedRequirementsSchema.parse({
    schemaVersion: 1,
    revision,
    sourceId: source.sourceId,
    sourceChecksum: source.originalChecksum,
    requirements,
  });
}

export function analyzeRequirements(
  normalized: NormalizedRequirements,
): RequirementAnalysis {
  const issues: RequirementIssue[] = [];
  for (const requirement of normalized.requirements) {
    if (requirement.classification === "ASSUMPTION") {
      issues.push({
        kind: "ASSUMPTION",
        requirementIds: [requirement.requirementId],
        message: "Assumed behavior requires confirmation.",
        blocking: true,
      });
    }
    if (
      /\b(quickly|soon|appropriate|user-friendly|etc\.?|should)\b/i.test(
        requirement.text,
      )
    ) {
      issues.push({
        kind: "AMBIGUITY",
        requirementIds: [requirement.requirementId],
        message: `Materially vague or non-binding language: "${requirement.text}"`,
        blocking: true,
      });
    }
  }

  for (
    let leftIndex = 0;
    leftIndex < normalized.requirements.length;
    leftIndex += 1
  ) {
    const left = normalized.requirements[leftIndex];
    if (left === undefined) continue;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < normalized.requirements.length;
      rightIndex += 1
    ) {
      const right = normalized.requirements[rightIndex];
      if (right !== undefined && isContradiction(left.text, right.text)) {
        issues.push({
          kind: "CONTRADICTION",
          requirementIds: [left.requirementId, right.requirementId],
          message: `Requirements conflict: "${left.text}" / "${right.text}"`,
          blocking: true,
        });
      }
    }
  }

  if (normalized.requirements.length === 0) {
    issues.push({
      kind: "OMISSION",
      requirementIds: [],
      message: "No atomic requirements were found.",
      blocking: true,
    });
  }

  const blockingIssues = issues.filter((issue) => issue.blocking);
  const byId = new Map(
    normalized.requirements.map((requirement) => [
      requirement.requirementId,
      requirement,
    ]),
  );
  const clarificationQuestions = [
    ...new Map(
      blockingIssues.map((issue) => {
        const requirement = byId.get(issue.requirementIds[0] ?? "");
        const question: ClarificationQuestion = {
          ...(requirement === undefined
            ? {}
            : { requirementId: requirement.requirementId }),
          requirementText: requirement?.text ?? "Requirement set",
          ambiguity: issue.message,
          evidence: [
            requirement === undefined
              ? "No atomic requirement resolves the issue."
              : `Source ${requirement.source.sourceId}, line ${String(requirement.source.startLine)}.`,
          ],
          impact:
            "Scenario coverage and approval must pause until the intended behavior is explicit.",
          decisionOptions:
            issue.kind === "OMISSION"
              ? [
                  "Provide the missing requirement.",
                  "Confirm the scope is intentionally empty.",
                ]
              : [
                  "Replace the text with measurable intended behavior.",
                  "Remove the behavior from the approved scope.",
                ],
        };
        return [
          `${question.requirementId ?? "set"}:${question.ambiguity.toLowerCase()}`,
          question,
        ] as const;
      }),
    ).values(),
  ];
  return requirementAnalysisSchema.parse({
    issues,
    clarificationQuestions,
    hasBlockingAmbiguity: blockingIssues.length > 0,
  });
}

export interface ClarificationAnswer {
  readonly requirementId: string;
  readonly replacementText?: string;
  readonly remove?: boolean;
}

export interface ClarificationInput {
  readonly actor: Actor;
  readonly answers: readonly ClarificationAnswer[];
  readonly additions?: readonly {
    readonly text: string;
    readonly source: RequirementSourceReference;
  }[];
}

export interface RequirementImpact {
  readonly added: readonly string[];
  readonly modified: readonly string[];
  readonly removed: readonly string[];
}

export interface ReconciledRequirements {
  readonly canonical: NormalizedRequirements;
  readonly impact: RequirementImpact;
}

export function reconcileClarifications(
  current: NormalizedRequirements,
  input: ClarificationInput,
): ReconciledRequirements {
  if (input.actor.actorType !== "HUMAN") {
    throw new Error("Clarification reconciliation requires a human actor");
  }
  const requirementIds = new Set(
    current.requirements.map((requirement) => requirement.requirementId),
  );
  for (const answer of input.answers) {
    if (!requirementIds.has(answer.requirementId)) {
      throw new Error(
        `Clarification answer references unknown requirement: ${answer.requirementId}`,
      );
    }
  }
  const answers = new Map(
    input.answers.map((answer) => [answer.requirementId, answer]),
  );
  const modified: string[] = [];
  const removed: string[] = [];
  const requirements = current.requirements.flatMap((requirement) => {
    const answer = answers.get(requirement.requirementId);
    if (answer?.remove === true) {
      removed.push(requirement.requirementId);
      return [];
    }
    if (answer?.replacementText !== undefined) {
      const replacementText = answer.replacementText.trim();
      if (replacementText.length === 0) {
        throw new Error("Replacement requirement text cannot be empty");
      }
      modified.push(requirement.requirementId);
      return [{ ...requirement, text: replacementText }];
    }
    return [requirement];
  });
  const additions = (input.additions ?? []).map((addition) => {
    const text = addition.text.trim();
    if (text.length === 0) {
      throw new Error("Added requirement text cannot be empty");
    }
    return {
      requirementId: stableRequirementId(text),
      text,
      classification: classify(text),
      source: addition.source,
    };
  });
  const canonical = normalizedRequirementsSchema.parse({
    ...current,
    revision: current.revision + 1,
    requirements: [...requirements, ...additions],
  });
  return {
    canonical,
    impact: {
      added: additions.map((requirement) => requirement.requirementId),
      modified,
      removed,
    },
  };
}

function splitAtomicStatements(line: string): readonly string[] {
  if (/^\s*#{1,6}\s+\S/.test(line)) return [];
  const cleaned = line
    .replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/, "")
    .trim();
  if (cleaned.length === 0 || /^#{1,6}$/.test(cleaned)) return [];
  return cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function stableRequirementId(text: string): string {
  const semanticText = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return `req-${createHash("sha256").update(semanticText).digest("hex").slice(0, 16)}`;
}

function classify(text: string): RequirementClassification {
  if (/^(observed|observation|currently)\s*:/i.test(text)) return "OBSERVATION";
  if (/^(assume|assumption)\s*:/i.test(text)) return "ASSUMPTION";
  return "STATED_REQUIREMENT";
}

function isContradiction(left: string, right: string): boolean {
  const leftNegative = /\b(?:must|shall)\s+not\b/i.test(left);
  const rightNegative = /\b(?:must|shall)\s+not\b/i.test(right);
  if (leftNegative === rightNegative) return false;
  return canonicalizePolarity(left) === canonicalizePolarity(right);
}

function canonicalizePolarity(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(must|shall)\s+not\b/g, "$1")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
