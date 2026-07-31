# Graph Report - aristotle  (2026-07-31)

## Corpus Check
- 105 files · ~33,569 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 878 nodes · 1147 edges · 80 communities (46 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b7290b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]

## God Nodes (most connected - your core abstractions)
1. `semanticChecksum()` - 25 edges
2. `Quality Agent Factory Development Plan` - 19 edges
3. `Quality Agent Factory Phased Implementation Plan` - 19 edges
4. `compilerOptions` - 17 edges
5. `scripts` - 16 edges
6. `devDependencies` - 13 edges
7. `3. Agent and Human Roles` - 12 edges
8. `validateGate()` - 10 edges
9. `requireGate()` - 9 edges
10. `Actor` - 8 edges

## Surprising Connections (you probably didn't know these)
- `sampleWorkflow()` --calls--> `createWorkflow()`  [EXTRACTED]
  tests/integration/orchestration/workflow-store.test.ts → src/orchestration/workflow.ts
- `Atomic Contribution Workflow` --conceptually_related_to--> `Commit Quality Pipeline`  [INFERRED]
  CONTRIBUTING.md → README.md
- `Canonical Harness Integrity` --rationale_for--> `Authoritative Artifact Contract`  [INFERRED]
  docs/decisions/002-harness-integrity-and-preflight.md → agents/shared/artifact-contracts.md
- `Versioned Artifact Templates` --conceptually_related_to--> `Authoritative Artifact Contract`  [INFERRED]
  templates/README.md → agents/shared/artifact-contracts.md
- `Human-Gated Quality Workflow` --conceptually_related_to--> `Exact Human Approval Record`  [INFERRED]
  docs/plans/quality-agent-factory-development-plan.md → agents/shared/artifact-contracts.md

## Hyperedges (group relationships)
- **Provider Adapter Parity** — claude_provider_adapter, cursor_provider_adapter, codex_provider_adapter, provider_portability_shared_contracts [EXTRACTED 1.00]
- **Human-Gated Quality Flow** — security_exact_revision_human_approval, playwright_approved_scenario_generation, failure_triage_classification, workflow_resumable_state_machine [EXTRACTED 1.00]
- **Repository Quality Controls** — readme_commit_quality_pipeline, contributing_atomic_contribution_workflow, agents_graphify_workflow [INFERRED 0.88]
- **Scenario Authorization Flow** — test_scenario_designer, scenario_quality_evaluator, exact_revision_human_approval, playwright_test_engineer [EXTRACTED 1.00]
- **Failure Assessment Flow** — playwright_test_engineer, failure_triage_analyst, final_quality_assessor [EXTRACTED 1.00]
- **Governed Improvement Flow** — knowledge_curator, workflow_improvement_analyst, policy_bounded_autonomy [INFERRED 0.85]
- **Human-Gated Scenario Pipeline** — analyze_requirements_requirement_analysis, design_test_scenarios_scenario_design, evaluate_test_scenarios_independent_evaluation, artifact_contracts_exact_human_approval, automate_approved_scenarios_playwright_automation [EXTRACTED 1.00]
- **Failure Classification and Repair Control Flow** — automate_approved_scenarios_playwright_automation, triage_test_failures_failure_triage, triage_test_failures_script_error_gate [EXTRACTED 1.00]
- **Harness Integrity Controls** — adr_002_canonical_harness_integrity, adr_002_fail_closed_preflight, phased_implementation_plan_harness_remediation, sample_application_controlled_harness [INFERRED 0.85]

## Communities (80 total, 34 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (63): createdUsers, username, actionSchema, AutomationLocator, AutomationPlan, automationPlanSchema, CapabilityExtensionProposal, capabilityExtensionProposalSchema (+55 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (51): analyzeRequirements(), AtomicRequirement, canonicalizePolarity(), ClarificationAnswer, ClarificationInput, ClarificationQuestion, isContradiction(), normalizeRequirements() (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (49): acceptArtifact(), AcceptArtifactInput, assertNotCyclic(), createArtifactRevision(), invalidateDownstreamArtifacts(), JsonValue, normalizeArray(), normalizeJson() (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (53): semanticChecksum(), validateCapabilityExtensionRecord(), approvedScenario(), NormalizedRequirements, checksumSchema, HumanScenarioReview, humanScenarioReviewSchema, requirementIdSchema (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (42): sameArtifactReference(), createWorkflow(), CreateWorkflowInput, incrementRetry(), legalTransitions, requireGate(), requireHuman(), requireRole() (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (37): boundedTextSchema, checksumSchema, feedbackCategorySchema, FeedbackEvent, feedbackEventSchema, identifierSchema, improvementEvaluationSchema, ImprovementProposal (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (41): dependencies, gray-matter, mammoth, pdfjs-dist, zod, description, devDependencies, eslint (+33 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (33): checksumSchema, defectCandidateSchema, failureClassificationSchema, failureEvidenceSchema, FailureTriage, failureTriageSchema, FinalQualityAssessment, finalQualityAssessmentSchema (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (20): canonicalSerialize(), aggregateExecutionResults(), assertGeneratedTestPath(), CanonicalArtifact, createManualResult(), ExecutionResult, executionResultSchema, ManualResult (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (21): Policy-Driven Agent Autonomy, Canonical Harness Integrity, Fail-Closed Browser Preflight, Authoritative Artifact Contract, Exact Human Approval Record, Immutable Accepted Revision, Versioned Capability Classifier, Approved Scenario Automation (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (21): Agent Roles, Exact Revision Human Approval, Factory Workflows, Failure Recovery Workflow, Failure Triage Analyst, Final Quality Assessor, Immutable Sanitized History, Knowledge Curator (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (17): BenchmarkCase, BenchmarkCaseSchema, benchmarkCategories, benchmarkCorpus, commonAdapter, ProviderAdapter, providerAdapters, ProviderAdapterSchema (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, module, moduleResolution, noFallthroughCasesInSwitch, noImplicitOverride (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (10): acquireRunLock(), assertIdentifier(), isErrorCode(), ReleaseLock, partial, store, temporaryDirectories, workflow (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (8): environmentSchema, FactoryConfig, loadFactoryConfig(), rawConfigSchema, screenshotPolicySchema, config, tracePolicySchema, videoPolicySchema

### Community 15 - "Community 15"
Cohesion: 0.2
Nodes (11): Accepted Artifact Immutability, Failure Classification, Product Defect Candidate, SCRIPT_ERROR Repair Gate, Advisory Knowledge Influence, Post-Review Knowledge Memory, Approved-Scenario Playwright Generation, Deterministic Playwright Conventions (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (6): BenchmarkDisposition, evaluateSyntheticBenchmark(), SyntheticBenchmarkCase, syntheticQualityCorpus, metrics, unsafeClasses

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, declarationMap, outDir, rootDir, sourceMap, types, exclude (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.31
Nodes (7): checkRepositoryHealth(), execFileAsync, findRepositoryHygieneViolations(), RepositoryHealth, requiredRepositoryEntries, entryPath, root

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (7): Shared Authorization Boundaries, Claude Code Provider Adapter, Claude Code Instruction Entry Point, Codex Provider Adapter, Cursor Provider Adapter, Provider-Portable Shared Contracts, Untrusted Input Boundary

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (4): Requirement Analysis Procedure, Inert Untrusted Requirement Input, Knowledge Graph Navigation, Semantic Graph Refresh

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (3): Repository-Resident Runtime, Human-Gated Quality Pipeline, Quality Agent Factory

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (3): Synthetic Authentication Storage State, Test Failure Triage, SCRIPT_ERROR Repair Gate

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (3): Repository Graphify Workflow, Atomic Contribution Workflow, Commit Quality Pipeline

### Community 29 - "Community 29"
Cohesion: 0.04
Nodes (46): Acceptance criteria, Checkpoint, Checkpoint, Checkpoint, Checkpoint, Checkpoint, Checkpoint, code:bash (npm run format:check) (+38 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (45): 10. Requirement and Scenario Revision Management, 11. Memory and Learning, 12. Feedback and Workflow Improvement, 13. Rules and Guardrails, 14. Environment, Security, and Privacy, 15. Resource and Reliability Controls, 16. Evaluation and Testing, 17. Delivery Phases (+37 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): ADR-001: Use policy-driven autonomy for routine factory decisions, Allow arbitrary Playwright source generation, Alternatives considered, Consequences, Context, Date, Decision, Existing human-decision audit (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (8): code:bash (npm ci), Commands, Commit quality pipeline, Current status, Prerequisites, Quality Agent Factory, Safety defaults, Setup

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): ADR-002: Canonical harness integrity and fail-closed preflight, Alternatives considered, Consequences, Context, Date, Decision, Status

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): Development rules, graphify, Mission, Non-negotiable boundaries, Quality Agent Factory Agent Instructions, Required reading order

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): Boundaries, Failure Triage Analyst, Inputs, Mission, Responsibilities

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (5): Boundaries, Decisions, Final Quality Assessor, Mission, Required review

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (5): Boundaries, Knowledge Curator, Mission, Outputs, Required review

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (5): Boundaries, Mission, Outputs, Playwright Test Engineer, Required inputs

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (5): Boundaries, Mission, Required proposal content, Trigger, Workflow Improvement Analyst

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (5): Dependencies and integrations, Security Boundaries, Sensitive material, Target environment, Untrusted inputs

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (5): code:text (feat: enforce scenario approval before test generation), Commit examples, Contributing, Pull request expectations, Workflow

### Community 42 - "Community 42"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Requirement Analyst

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Test Scenario Designer

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Scenario Quality Evaluator

### Community 45 - "Community 45"
Cohesion: 0.4
Nodes (4): Preconditions, Procedure, Stop conditions, Triage Test Failures

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (4): Boundaries, Query, Refresh, Use the Knowledge Graph

## Knowledge Gaps
- **447 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+442 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `semanticChecksum()` connect `Community 3` to `Community 0`, `Community 2`, `Community 5`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Actor` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ArtifactReference` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._