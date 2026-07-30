import { semanticChecksum } from "../orchestration/artifact-lifecycle.js";
import type { Actor } from "../schemas/contracts.js";
import {
  improvementEvaluationSchema,
  improvementProposalSchema,
  knowledgeProposalSchema,
  memoryScopeSchema,
  runSummarySchema,
  type FeedbackEvent,
  type ImprovementProposal,
  type KnowledgeProposal,
  type MemoryScope,
  type RunSummary,
} from "./contracts.js";

type RunSummaryInput = Omit<
  RunSummary,
  "schemaVersion" | "rawTranscriptStored"
> & {
  readonly rawTranscript?: string;
};

export function createRunSummary(input: RunSummaryInput): RunSummary {
  if ("rawTranscript" in input) {
    throw new Error("Run summaries cannot store raw transcripts");
  }
  assertSanitized(input);
  return deepFreeze(
    runSummarySchema.parse({
      schemaVersion: 1,
      ...input,
      rawTranscriptStored: false,
    }),
  );
}

type KnowledgeProposalInput = Omit<
  KnowledgeProposal,
  "schemaVersion" | "approvalState" | "approval" | "policyChangeAuthorized"
>;

export function createKnowledgeProposal(
  input: KnowledgeProposalInput,
): KnowledgeProposal {
  assertSanitized(input);
  return knowledgeProposalSchema.parse({
    schemaVersion: 1,
    ...input,
    approvalState: "PROPOSED",
    policyChangeAuthorized: false,
  });
}

interface KnowledgeApprovalInput {
  readonly proposal: KnowledgeProposal;
  readonly proposalChecksum: string;
  readonly actor: Actor;
  readonly decision: "APPROVED" | "REJECTED";
  readonly decidedAt: string;
}

export function approveKnowledgeProposal(
  input: KnowledgeApprovalInput,
): KnowledgeProposal {
  const proposal = knowledgeProposalSchema.parse(input.proposal);
  requireExactChecksum(proposal, input.proposalChecksum, "Knowledge proposal");
  if (proposal.approvalState !== "PROPOSED") {
    throw new Error("Only a proposed knowledge entry can be reviewed");
  }
  if (input.actor.actorType !== "HUMAN") {
    throw new Error("Knowledge approval requires a human actor");
  }
  return knowledgeProposalSchema.parse({
    ...proposal,
    approvalState: input.decision,
    approval: {
      actorId: input.actor.actorId,
      decision: input.decision,
      proposalChecksum: input.proposalChecksum,
      decidedAt: input.decidedAt,
    },
  });
}

interface RetrievalInput {
  readonly queryScope: MemoryScope;
  readonly currentRequirements: readonly string[];
  readonly entries: readonly KnowledgeProposal[];
}

export function retrieveApprovedKnowledge(input: RetrievalInput) {
  const queryScope = memoryScopeSchema.parse(input.queryScope);
  if (input.currentRequirements.length === 0) {
    throw new Error("Current approved requirements are required for retrieval");
  }
  const influences = input.entries
    .map((entry) => knowledgeProposalSchema.parse(entry))
    .filter(
      (entry) =>
        entry.approvalState === "APPROVED" &&
        entry.approval?.decision === "APPROVED" &&
        scopesMatch(entry.scope, queryScope),
    )
    .map((entry) => ({
      proposalId: entry.proposalId,
      lesson: entry.lesson,
      advisoryOnly: true as const,
    }));
  return {
    influences,
    requirementsRemainAuthoritative: true as const,
  };
}

interface ImprovementProposalInput {
  readonly proposalId: string;
  readonly category: ImprovementProposal["category"];
  readonly findingSignature: string;
  readonly feedback: readonly FeedbackEvent[];
  readonly humanRequested?: boolean;
  readonly rootCauseHypothesis: string;
  readonly proposedChange: string;
  readonly risks: readonly string[];
  readonly validationCases: readonly string[];
  readonly expectedBenefits: readonly string[];
  readonly rollbackPlan: string;
}

export function createImprovementProposal(
  input: ImprovementProposalInput,
): ImprovementProposal {
  const evidence = input.feedback.map((event) => {
    assertSanitized(event);
    return event;
  });
  const matching = evidence.filter(
    (event) => event.findingSignature === input.findingSignature,
  );
  const distinctTasks = new Set(matching.map((event) => event.taskId)).size;
  const severe = matching.some((event) => event.severity === "SEVERE");
  const trigger = input.humanRequested
    ? "HUMAN_REQUEST"
    : severe
      ? "SEVERE_FAILURE"
      : distinctTasks >= 3
        ? "RECURRING_FINDING"
        : undefined;
  if (trigger === undefined) {
    throw new Error(
      "Improvement proposals require three separate tasks, one severe failure, or a human request",
    );
  }
  return improvementProposalSchema.parse({
    schemaVersion: 1,
    proposalId: input.proposalId,
    category: input.category,
    findingSignature: input.findingSignature,
    evidence: matching,
    trigger,
    rootCauseHypothesis: input.rootCauseHypothesis,
    proposedChange: input.proposedChange,
    risks: input.risks,
    validationCases: input.validationCases,
    expectedBenefits: input.expectedBenefits,
    rollbackPlan: input.rollbackPlan,
    policyChangeAuthorized: false,
  });
}

interface ImprovementEvaluationInput {
  readonly proposal: ImprovementProposal;
  readonly proposalChecksum: string;
  readonly policyApproval: {
    readonly actor: Actor;
    readonly decision: "APPROVED" | "REJECTED";
  };
  readonly regressionPassed: boolean;
  readonly shadowEvaluationPassed: boolean;
}

export function evaluateImprovement(input: ImprovementEvaluationInput) {
  const proposal = improvementProposalSchema.parse(input.proposal);
  requireExactChecksum(
    proposal,
    input.proposalChecksum,
    "Improvement proposal",
  );
  if (input.policyApproval.actor.actorType !== "HUMAN") {
    throw new Error("Improvement adoption requires human policy approval");
  }
  const decision =
    input.policyApproval.decision === "APPROVED" &&
    input.regressionPassed &&
    input.shadowEvaluationPassed
      ? "ADOPT"
      : input.policyApproval.decision === "APPROVED"
        ? "ROLLBACK"
        : "REJECT";
  return improvementEvaluationSchema.parse({
    schemaVersion: 1,
    proposalId: proposal.proposalId,
    proposalChecksum: input.proposalChecksum,
    regressionPassed: input.regressionPassed,
    shadowEvaluationPassed: input.shadowEvaluationPassed,
    decision,
    rollbackPlan: proposal.rollbackPlan,
  });
}

function scopesMatch(left: MemoryScope, right: MemoryScope): boolean {
  return Object.keys(left).every(
    (key) => left[key as keyof MemoryScope] === right[key as keyof MemoryScope],
  );
}

function requireExactChecksum(
  value: unknown,
  expected: string,
  label: string,
): void {
  if (semanticChecksum(value) !== expected) {
    throw new Error(`${label} checksum does not match the exact revision`);
  }
}

function assertSanitized(value: unknown): void {
  const serialized = JSON.stringify(value);
  const sensitivePattern =
    /(?:password|passwd|secret|api[_-]?key|authorization|bearer)\s*[:=]\s*\S+/i;
  if (sensitivePattern.test(serialized)) {
    throw new Error("Memory content contains sensitive data");
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
