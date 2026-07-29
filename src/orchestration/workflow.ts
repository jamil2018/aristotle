import {
  workflowManifestSchema,
  type Actor,
  type ArtifactReference,
  type WorkflowManifest,
  type WorkflowStage,
} from "../schemas/contracts.js";

const MAX_RETRIES = 3;

const legalTransitions: Readonly<
  Record<WorkflowStage, readonly WorkflowStage[]>
> = {
  "requirement-intake": ["requirement-analysis", "cancelled"],
  "requirement-analysis": [
    "requirement-clarification",
    "scenario-generation",
    "cancelled",
  ],
  "requirement-clarification": ["requirement-analysis", "cancelled"],
  "scenario-generation": ["scenario-evaluation", "cancelled"],
  "scenario-evaluation": [
    "scenario-generation",
    "requirement-clarification",
    "human-scenario-review",
    "cancelled",
  ],
  "human-scenario-review": [
    "scenario-evaluation",
    "requirement-clarification",
    "playwright-implementation",
    "cancelled",
  ],
  "playwright-implementation": ["test-execution", "cancelled"],
  "test-execution": [
    "failure-triage",
    "final-quality-assessment",
    "cancelled",
  ],
  "failure-triage": [
    "test-repair",
    "final-quality-assessment",
    "requirement-clarification",
    "cancelled",
  ],
  "test-repair": ["test-execution", "cancelled"],
  "final-quality-assessment": [
    "requirement-analysis",
    "scenario-generation",
    "scenario-evaluation",
    "playwright-implementation",
    "final-human-review",
    "cancelled",
  ],
  "final-human-review": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export type TransitionGate =
  | { readonly kind: "NO_BLOCKING_AMBIGUITY" }
  | { readonly kind: "CLARIFICATION_REQUIRED" }
  | {
      readonly kind: "EVALUATOR_PASS";
      readonly subject: ArtifactReference;
    }
  | { readonly kind: "EVALUATOR_REVISE" }
  | {
      readonly kind: "HUMAN_SCENARIO_APPROVAL";
      readonly subject: ArtifactReference;
      readonly decision: "APPROVED" | "APPROVED_WITH_EXCLUSIONS";
    }
  | { readonly kind: "HUMAN_CHANGES_REQUESTED" }
  | {
      readonly kind: "TRIAGE";
      readonly classification:
        | "SCRIPT_ERROR"
        | "PRODUCT_DEFECT"
        | "ENVIRONMENT_FAILURE"
        | "TEST_DATA_FAILURE"
        | "REQUIREMENT_AMBIGUITY"
        | "FLAKY_OR_INCONCLUSIVE";
    }
  | {
      readonly kind: "FINAL_ASSESSMENT";
      readonly decision:
        | "READY_FOR_HUMAN_REVIEW"
        | "REVISION_REQUIRED"
        | "BLOCKED";
    }
  | { readonly kind: "FINAL_HUMAN_DECISION" }
  | { readonly kind: "CANCELLATION" };

export interface CreateWorkflowInput {
  readonly workflowId: string;
  readonly taskId: string;
  readonly provenance: WorkflowManifest["provenance"];
}

export interface TransitionInput {
  readonly to: WorkflowStage;
  readonly actor: Actor;
  readonly occurredAt: string;
  readonly gate?: TransitionGate;
  readonly inputReferences?: readonly ArtifactReference[];
  readonly outputReferences?: readonly ArtifactReference[];
}

export function createWorkflow(input: CreateWorkflowInput): WorkflowManifest {
  return workflowManifestSchema.parse({
    artifactType: "workflow-manifest",
    schemaVersion: 1,
    producingRole: "workflow-coordinator",
    workflowStage: "requirement-intake",
    revision: 1,
    provenance: input.provenance,
    references: [],
    workflowId: input.workflowId,
    taskId: input.taskId,
    currentStage: "requirement-intake",
    status: "ACTIVE",
    retries: {},
    transitionHistory: [],
  });
}

export function transitionWorkflow(
  workflowInput: WorkflowManifest,
  input: TransitionInput,
): WorkflowManifest {
  const workflow = workflowManifestSchema.parse(workflowInput);
  if (!legalTransitions[workflow.currentStage].includes(input.to)) {
    throw new Error(
      `Illegal workflow transition: ${workflow.currentStage} -> ${input.to}`,
    );
  }

  validateGate(workflow, input);
  const retries = { ...workflow.retries };
  if (
    workflow.currentStage === "scenario-evaluation" &&
    input.to === "scenario-generation"
  ) {
    incrementRetry(retries, "scenario-revision");
  }
  if (
    workflow.currentStage === "failure-triage" &&
    input.to === "test-repair"
  ) {
    incrementRetry(retries, "script-repair");
  }

  const gateSubject =
    input.gate?.kind === "EVALUATOR_PASS" ||
    input.gate?.kind === "HUMAN_SCENARIO_APPROVAL"
      ? [input.gate.subject]
      : [];
  const inputReferences = [
    ...(input.inputReferences ?? []),
    ...gateSubject,
  ];

  return workflowManifestSchema.parse({
    ...workflow,
    workflowStage: input.to,
    revision: workflow.revision + 1,
    currentStage: input.to,
    status: statusFor(input.to),
    retries,
    references: uniqueReferences([...workflow.references, ...inputReferences]),
    transitionHistory: [
      ...workflow.transitionHistory,
      {
        from: workflow.currentStage,
        to: input.to,
        actor: input.actor,
        occurredAt: input.occurredAt,
        inputReferences,
        outputReferences: input.outputReferences ?? [],
      },
    ],
  });
}

function validateGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (input.to === "cancelled") {
    requireGate(input, "CANCELLATION");
    return;
  }
  if (
    workflow.currentStage === "requirement-analysis" &&
    input.to === "scenario-generation"
  ) {
    requireGate(input, "NO_BLOCKING_AMBIGUITY");
  }
  if (input.to === "requirement-clarification") {
    requireGate(input, "CLARIFICATION_REQUIRED");
  }
  if (
    workflow.currentStage === "scenario-evaluation" &&
    input.to === "human-scenario-review"
  ) {
    requireRole(input.actor, "scenario-quality-evaluator");
    requireGate(input, "EVALUATOR_PASS");
  }
  if (
    workflow.currentStage === "scenario-evaluation" &&
    input.to === "scenario-generation"
  ) {
    requireRole(input.actor, "scenario-quality-evaluator");
    requireGate(input, "EVALUATOR_REVISE");
  }
  if (
    workflow.currentStage === "human-scenario-review" &&
    input.to === "scenario-evaluation"
  ) {
    requireHuman(input.actor);
    requireGate(input, "HUMAN_CHANGES_REQUESTED");
  }
  if (input.to === "playwright-implementation") {
    requireHuman(input.actor);
    requireGate(input, "HUMAN_SCENARIO_APPROVAL");
    const evaluated = workflow.transitionHistory.at(-1)?.inputReferences[0];
    if (
      evaluated === undefined ||
      input.gate?.kind !== "HUMAN_SCENARIO_APPROVAL" ||
      !sameReference(evaluated, input.gate.subject)
    ) {
      throw new Error(
        "Human approval must reference the exact evaluated scenario revision and checksum",
      );
    }
  }
  if (input.to === "test-repair") {
    requireGate(input, "TRIAGE");
    if (
      input.gate?.kind !== "TRIAGE" ||
      input.gate.classification !== "SCRIPT_ERROR"
    ) {
      throw new Error("Only SCRIPT_ERROR authorizes automatic test repair");
    }
  }
  if (input.to === "final-human-review") {
    requireGate(input, "FINAL_ASSESSMENT");
    if (
      input.gate?.kind !== "FINAL_ASSESSMENT" ||
      input.gate.decision !== "READY_FOR_HUMAN_REVIEW"
    ) {
      throw new Error(
        "Final human review requires READY_FOR_HUMAN_REVIEW assessment",
      );
    }
  }
  if (input.to === "completed") {
    requireHuman(input.actor);
    requireGate(input, "FINAL_HUMAN_DECISION");
  }
}

function requireGate(input: TransitionInput, kind: TransitionGate["kind"]) {
  if (input.gate?.kind !== kind) {
    throw new Error(`Transition requires ${kind} gate evidence`);
  }
}

function requireHuman(actor: Actor): void {
  if (actor.actorType !== "HUMAN") {
    throw new Error("This transition requires an authenticated human actor");
  }
}

function requireRole(
  actor: Actor,
  role: Extract<Actor, { actorType: "AGENT" }>["actorId"],
): void {
  if (actor.actorType !== "AGENT" || actor.actorId !== role) {
    throw new Error(`This transition requires the ${role} role`);
  }
}

function incrementRetry(
  retries: Record<string, number>,
  retryType: string,
): void {
  const next = (retries[retryType] ?? 0) + 1;
  if (next > MAX_RETRIES) {
    throw new Error(`${retryType} retry limit of ${String(MAX_RETRIES)} exceeded`);
  }
  retries[retryType] = next;
}

function statusFor(stage: WorkflowStage): WorkflowManifest["status"] {
  if (
    stage === "requirement-clarification" ||
    stage === "human-scenario-review" ||
    stage === "final-human-review"
  ) {
    return "AWAITING_HUMAN";
  }
  if (stage === "completed") return "COMPLETED";
  if (stage === "cancelled") return "CANCELLED";
  return "ACTIVE";
}

function sameReference(
  left: ArtifactReference,
  right: ArtifactReference,
): boolean {
  return (
    left.artifactId === right.artifactId &&
    left.artifactType === right.artifactType &&
    left.revision === right.revision &&
    left.semanticChecksum === right.semanticChecksum
  );
}

function uniqueReferences(
  references: readonly ArtifactReference[],
): ArtifactReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = [
      reference.artifactId,
      reference.revision,
      reference.semanticChecksum,
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
