import {
  workflowManifestSchema,
  type Actor,
  type ArtifactReference,
  type WorkflowManifest,
  type WorkflowStage,
} from "../schemas/contracts.js";
import { sameArtifactReference } from "./artifact-reference.js";

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
  "playwright-implementation": ["test-quality-evaluation", "cancelled"],
  "test-quality-evaluation": [
    "playwright-implementation",
    "test-execution",
    "cancelled",
  ],
  "test-execution": ["failure-triage", "final-quality-assessment", "cancelled"],
  "failure-triage": [
    "test-repair",
    "final-quality-assessment",
    "requirement-clarification",
    "cancelled",
  ],
  "test-repair": ["test-quality-evaluation", "cancelled"],
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
  | { readonly kind: "CLARIFICATION_ANSWERED" }
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
      readonly kind: "PLAYWRIGHT_TEST_READY";
      readonly subject: ArtifactReference;
    }
  | {
      readonly kind: "TEST_QUALITY";
      readonly subject: ArtifactReference;
      readonly testSubject: ArtifactReference;
      readonly evaluatedTestChecksum: string;
      readonly decision: "PASS" | "REVISE" | "BLOCKED";
    }
  | {
      readonly kind: "EXECUTION_RESULT";
      readonly subject: ArtifactReference;
      readonly outcome: "PASSED" | "FAILED";
    }
  | {
      readonly kind: "TRIAGE";
      readonly subject: ArtifactReference;
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
      readonly subject: ArtifactReference;
      readonly decision:
        "READY_FOR_HUMAN_REVIEW" | "REVISION_REQUIRED" | "BLOCKED";
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
  const retries = updatedRetries(workflow, input);
  const gateSubject = gateSubjectReference(input.gate);
  const inputReferences = [...(input.inputReferences ?? []), ...gateSubject];

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

function updatedRetries(
  workflow: WorkflowManifest,
  input: TransitionInput,
): Record<string, number> {
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
  return retries;
}

function gateSubjectReference(
  gate: TransitionGate | undefined,
): ArtifactReference[] {
  if (gate !== undefined && "subject" in gate) {
    return gate.kind === "TEST_QUALITY"
      ? [gate.subject, gate.testSubject]
      : [gate.subject];
  }
  return [];
}

function validateGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (input.to === "cancelled") {
    requireGate(input, "CANCELLATION");
    return;
  }
  validateRequirementGate(workflow, input);
  validateScenarioGate(workflow, input);
  validatePlaywrightGate(workflow, input);
  validateExecutionGate(workflow, input);
  validateTriageDispositionGate(workflow, input);
  validateRepairGate(input);
  validateFinalReviewGate(input);
}

function validatePlaywrightGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (workflow.currentStage === "test-quality-evaluation") {
    validateTestQualityGate(input);
    return;
  }
  if (
    !["playwright-implementation", "test-repair"].includes(
      workflow.currentStage,
    ) ||
    input.to !== "test-quality-evaluation"
  ) {
    return;
  }
  requireRole(input.actor, "playwright-test-engineer");
  requireGate(input, "PLAYWRIGHT_TEST_READY");
  if (
    input.gate?.kind !== "PLAYWRIGHT_TEST_READY" ||
    input.gate.subject.artifactType !== "playwright-test"
  ) {
    throw new Error(
      "Test quality evaluation requires an exact registered playwright-test artifact",
    );
  }
}

function validateTestQualityGate(input: TransitionInput): void {
  requireRole(input.actor, "playwright-quality-evaluator");
  requireGate(input, "TEST_QUALITY");
  validateTestQualityReferences(input.gate);
  validateTestQualityDecision(input);
}

function validateTestQualityReferences(gate: TransitionGate | undefined): void {
  if (
    gate?.kind !== "TEST_QUALITY" ||
    gate.subject.artifactType !== "generated-test-quality" ||
    gate.testSubject.artifactType !== "playwright-test"
  ) {
    throw new Error(
      "Quality disposition requires generated-test-quality and exact playwright-test artifacts",
    );
  }
  if (gate.evaluatedTestChecksum !== gate.testSubject.semanticChecksum) {
    throw new Error(
      "Quality PASS must reference the exact Playwright checksum",
    );
  }
}

function validateTestQualityDecision(input: TransitionInput): void {
  if (input.gate?.kind !== "TEST_QUALITY") return;
  if (input.to === "test-execution" && input.gate.decision !== "PASS") {
    throw new Error("Browser execution requires an exact test-quality PASS");
  }
  if (
    input.to === "playwright-implementation" &&
    input.gate.decision !== "REVISE"
  ) {
    throw new Error("Playwright revision requires a REVISE quality decision");
  }
}

function validateExecutionGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (workflow.currentStage !== "test-execution") return;
  if (
    input.to !== "failure-triage" &&
    input.to !== "final-quality-assessment"
  ) {
    return;
  }
  requireRole(input.actor, "playwright-test-engineer");
  requireGate(input, "EXECUTION_RESULT");
  if (
    input.gate?.kind !== "EXECUTION_RESULT" ||
    input.gate.subject.artifactType !== "execution-summary"
  ) {
    throw new Error("Execution disposition requires an execution-summary");
  }
  const requiredOutcome = input.to === "failure-triage" ? "FAILED" : "PASSED";
  if (input.gate.outcome !== requiredOutcome) {
    throw new Error(
      `${input.to} requires a ${requiredOutcome} execution result`,
    );
  }
}

function validateTriageDispositionGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (
    workflow.currentStage !== "failure-triage" ||
    !["final-quality-assessment", "requirement-clarification"].includes(
      input.to,
    )
  ) {
    return;
  }
  requireRole(input.actor, "failure-triage-analyst");
  requireGate(input, "TRIAGE");
  if (
    input.gate?.kind !== "TRIAGE" ||
    input.gate.subject.artifactType !== "failure-triage"
  ) {
    throw new Error("Failure disposition requires a failure-triage artifact");
  }
  validateTriageRoute(input.to, input.gate.classification);
}

function validateTriageRoute(
  destination: WorkflowStage,
  classification: Extract<TransitionGate, { kind: "TRIAGE" }>["classification"],
): void {
  if (
    destination === "requirement-clarification" &&
    classification !== "REQUIREMENT_AMBIGUITY"
  ) {
    throw new Error(
      "Requirement clarification requires REQUIREMENT_AMBIGUITY triage",
    );
  }
  if (
    destination === "final-quality-assessment" &&
    classification === "SCRIPT_ERROR"
  ) {
    throw new Error("SCRIPT_ERROR must enter bounded test repair");
  }
}

function validateRequirementGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  if (
    workflow.currentStage === "requirement-analysis" &&
    input.to === "scenario-generation"
  ) {
    requireGate(input, "NO_BLOCKING_AMBIGUITY");
  }
  if (
    input.to === "requirement-clarification" &&
    workflow.currentStage !== "failure-triage"
  ) {
    requireGate(input, "CLARIFICATION_REQUIRED");
  }
  if (
    workflow.currentStage === "requirement-clarification" &&
    input.to === "requirement-analysis"
  ) {
    requireHuman(input.actor);
    requireGate(input, "CLARIFICATION_ANSWERED");
  }
}

function validateScenarioGate(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
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
    validateExactScenarioApproval(workflow, input);
  }
}

function validateExactScenarioApproval(
  workflow: WorkflowManifest,
  input: TransitionInput,
): void {
  const evaluated = workflow.transitionHistory.at(-1)?.inputReferences[0];
  if (
    evaluated === undefined ||
    input.gate?.kind !== "HUMAN_SCENARIO_APPROVAL" ||
    !sameArtifactReference(evaluated, input.gate.subject)
  ) {
    throw new Error(
      "Human approval must reference the exact evaluated scenario revision and checksum",
    );
  }
}

function validateRepairGate(input: TransitionInput): void {
  if (input.to === "test-repair") {
    requireRole(input.actor, "playwright-test-engineer");
    requireGate(input, "TRIAGE");
    if (
      input.gate?.kind !== "TRIAGE" ||
      input.gate.classification !== "SCRIPT_ERROR"
    ) {
      throw new Error("Only SCRIPT_ERROR authorizes automatic test repair");
    }
    if (input.gate.subject.artifactType !== "failure-triage") {
      throw new Error("Test repair requires an exact failure-triage artifact");
    }
  }
}

function validateFinalReviewGate(input: TransitionInput): void {
  if (input.to === "final-human-review") {
    requireRole(input.actor, "final-quality-assessor");
    requireGate(input, "FINAL_ASSESSMENT");
    if (
      input.gate?.kind !== "FINAL_ASSESSMENT" ||
      input.gate.decision !== "READY_FOR_HUMAN_REVIEW"
    ) {
      throw new Error(
        "Final human review requires READY_FOR_HUMAN_REVIEW assessment",
      );
    }
    if (input.gate.subject.artifactType !== "final-quality-assessment") {
      throw new Error(
        "Final human review requires an exact final-quality-assessment artifact",
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
    throw new Error(
      `${retryType} retry limit of ${String(MAX_RETRIES)} exceeded`,
    );
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
