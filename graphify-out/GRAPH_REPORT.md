# Graph Report - .  (2026-07-31)

## Corpus Check
- Corpus is ~38,312 words - fits in a single context window. You may not need a graph.

## Summary
- 827 nodes · 1216 edges · 45 communities (39 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `semanticChecksum()` - 27 edges
2. `scripts` - 17 edges
3. `compilerOptions` - 17 edges
4. `devDependencies` - 13 edges
5. `evaluateScenarios()` - 10 edges
6. `validateGate()` - 10 edges
7. `requireGate()` - 10 edges
8. `Actor` - 8 edges
9. `requireRole()` - 8 edges
10. `Quality Agent Factory Agent Instructions` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Security and Privacy` --semantically_similar_to--> `Quality Agent Factory Agent Instructions`  [INFERRED] [semantically similar]
  docs-factory/security-and-privacy.md → AGENTS.md
- `Factory Workflow Catalog` --conceptually_related_to--> `Authorization-Gated Workflow State Machine`  [INFERRED]
  agents/workflows/README.md → src/orchestration/workflow.ts
- `Factory Role Catalog` --conceptually_related_to--> `Authorization-Gated Workflow State Machine`  [INFERRED]
  agents/roles/README.md → src/orchestration/workflow.ts
- `Contribution Workflow` --conceptually_related_to--> `Quality Agent Factory Agent Instructions`  [INFERRED]
  CONTRIBUTING.md → AGENTS.md
- `sampleWorkflow()` --calls--> `createWorkflow()`  [EXTRACTED]
  tests/integration/orchestration/workflow-store.test.ts → src/orchestration/workflow.ts

## Hyperedges (group relationships)
- **Commit Quality Pipeline** — pre_commit_quality_gate, prettier_format_policy, eslint_quality_policy, strict_typescript_config, graph_refresh_commit_invariant [EXTRACTED 1.00]
- **Exact Revision Workflow Guards** — artifact_lifecycle_tests, workflow_transition_tests, scenario_pipeline_tests, playwright_pipeline_tests, exact_revision_integrity [INFERRED 0.90]
- **Human-Gated Learning and Execution** — memory_pipeline_tests, playwright_pipeline_tests, workflow_transition_tests, human_authorization_gate [INFERRED 0.88]
- **Controlled Sample Playwright Flow** — controlled_accounts_scenarios, controlled_quality_fixtures, controlled_account_page, controlled_preferences_page, open_controlled_html, scenario_metadata [EXTRACTED 1.00]
- **Failure Assessment Lifecycle** — failure_triage_contract, script_repair_contract, defect_candidate_contract, final_quality_assessment_contract, failure_pipeline, script_error_only_repair_gate [EXTRACTED 1.00]
- **Provider-Safe Execution Controls** — factory_config, optimization_pipeline, authentication_preflight, progressive_execution_plan, provider_contracts, shared_provider_boundaries, provider_pipeline [INFERRED 0.85]
- **Repository Quality Governance** — contribution_workflow, factory_agent_instructions, evaluation_methodology [INFERRED 0.85]
- **Provider Parity Contract** — claude_code_provider, cursor_provider, codex_provider, provider_neutral_contracts [EXTRACTED 1.00]
- **Authorized Test Pipeline** — requirement_clarification_workflow, exact_revision_authorization, playwright_conventions, failure_triage [EXTRACTED 1.00]
- **Test Execution and Recovery Flow** — playwright_test_engineer_role, playwright_quality_evaluator_role, progressive_browser_execution, failure_triage_analyst_role, bounded_script_error_repair, final_quality_assessor_role [EXTRACTED 1.00]
- **Governed Learning and Improvement Flow** — knowledge_curator_role, approved_advisory_memory, improvement_trigger_policy, workflow_improvement_analyst_role, rollback_safe_policy_improvement [EXTRACTED 1.00]
- **Scenario Authorization Flow** — requirement_analyst_role, scenario_designer_role, scenario_quality_evaluator_role, independent_scenario_evaluation_gate, exact_revision_scenario_approval_gate, playwright_test_engineer_role [EXTRACTED 1.00]
- **Requirement to Human Scenario Review Flow** — analyze_requirements_inert_intake, analyze_requirements_human_clarification, design_scenarios_traceable_specification, evaluate_scenarios_independent_gate, development_plan_human_authorization_gates [EXTRACTED 1.00]
- **Safe Playwright Execution Flow** — automate_scenarios_approved_only, evaluate_tests_independent_quality_gate, adr002_fail_closed_preflight, adr002_runtime_artifact_isolation, triage_failures_classification_gate [INFERRED 0.90]
- **Bounded Factory Autonomy** — adr001_policy_driven_autonomy, adr001_capability_extension_classifier, development_plan_human_authorization_gates [EXTRACTED 1.00]
- **Nine-Phase Delivery Sequence** — phase_1_repository_foundation, phase_2_contracts_orchestration, phase_3_requirement_pipeline, phase_4_scenario_pipeline, phase_5_playwright_pipeline, phase_6_failure_assessment, phase_7_memory_improvement, phase_8_provider_hardening, phase_9_pilot_optimization [EXTRACTED 1.00]
- **Three-Phase Harness Remediation** — artifact_integrity_remediation, scenario_quality_remediation, safe_playwright_remediation [EXTRACTED 1.00]

## Communities (45 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (54): acceptArtifact(), AcceptArtifactInput, assertNotCyclic(), canonicalSerialize(), createArtifactRevision(), invalidateDownstreamArtifacts(), JsonValue, normalizeArray() (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (51): analyzeRequirements(), AtomicRequirement, canonicalizePolarity(), ClarificationAnswer, ClarificationInput, ClarificationQuestion, isContradiction(), normalizeRequirements() (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (60): actionSchema, AutomationLocator, AutomationPlan, automationPlanSchema, CapabilityExtensionProposal, capabilityExtensionProposalSchema, CapabilityExtensionRecord, capabilityExtensionRecordSchema (+52 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (51): checksumSchema, defectCandidateSchema, failureClassificationSchema, failureEvidenceSchema, FailureTriage, failureTriageSchema, FinalQualityAssessment, finalQualityAssessmentSchema (+43 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (48): sameArtifactReference(), createWorkflow(), CreateWorkflowInput, gateSubjectReference(), incrementRetry(), legalTransitions, requireGate(), requireHuman() (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (42): artifactDispositionSchema, AuthenticationIntakeProfile, authenticationIntakeProfileSchema, checksum, GeneratedTestQuality, generatedTestQualitySchema, identifier, StageHandoff (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (42): dependencies, gray-matter, mammoth, pdfjs-dist, zod, description, devDependencies, eslint (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (37): boundedTextSchema, checksumSchema, feedbackCategorySchema, FeedbackEvent, feedbackEventSchema, identifierSchema, improvementEvaluationSchema, ImprovementProposal (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (28): Approved Exact-Scope Memory, Artifact Contract Tests, Artifact Lifecycle Tests, Artifact Registry Tests, Bounded SCRIPT_ERROR Repair, Build TypeScript Configuration, ESLint Quality Policy, Exact Revision Integrity (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (11): ControlledAccountPage, openControlledHtml(), createdUsers, metadata, username, QualityFixtures, test, scenarioMetadata() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (25): Browser Assertions, Claude Code Instructions, Claude Code Provider, Codex Provider, Contribution Workflow, Cursor Provider, Evaluation Methodology, Exact-Revision Authorization (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (24): Capability Extension Classifier, Policy-Driven Agent Autonomy, Canonical Harness Integrity, Fail-Closed Playwright Preflight, Runtime Artifact Isolation, Requirement Clarification Gate, Inert Requirement Intake, Versioned Artifact Templates (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (17): BenchmarkCase, BenchmarkCaseSchema, benchmarkCategories, benchmarkCorpus, commonAdapter, ProviderAdapter, providerAdapters, ProviderAdapterSchema (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.1
Nodes (21): Artifact Contract Principles, Bounded SCRIPT_ERROR Repair, Evidence-Backed Defect Candidate, Exact-Revision Scenario Approval Gate, Failure Recovery Workflow, Failure Triage Analyst, Final Quality Assessor, Immutable Exact-Revision Artifacts (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (18): projectTestDirs, runPaths, createExecutionSummary(), approved, base, cleanup, events, existing (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, module, moduleResolution, noFallthroughCasesInSwitch, noImplicitOverride (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (15): BenchmarkDisposition, benchmarkRequirements(), duplicateId(), evaluateSyntheticBenchmark(), executeCandidate(), FailureClass, independentlyClassify(), mutateCandidate() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.2
Nodes (10): acquireRunLock(), assertIdentifier(), isErrorCode(), ReleaseLock, partial, store, temporaryDirectories, workflow (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (15): applicableCoverage(), classifyScenarioFeasibility(), createScenario(), feasibilityFindings(), HumanReviewInput, markdownCell(), markdownText(), outcomeFindings() (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (17): normalizeMarkdown(), projectScenarioMarkdown(), reviseScenarioSpecification(), validateScenarioProjection(), validateTraceability(), divergent, evaluation, first (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (17): Artifact Integrity and Repository Hygiene, Draft Pull Request 10, Exact-Revision Human Gate, Harness Remediation Program, Phase 1 Repository Foundation, Phase 2 Contracts and Orchestration, Phase 3 Requirement Pipeline, Phase 4 Scenario Pipeline (+9 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (14): Synthetic Quality Benchmark Corpus, Authorized Playwright Generation Pipeline, Complete Browser Matrix Evidence, Fail-Closed Playwright Preflight, Run-Scoped Playwright Discovery, Typed Playwright Automation Contract, Harness Artifact Integrity, Human Clarification Reconciliation (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): Artifact Integrity Remediation Tests, Defect Candidate Contract, Failure and Assessment Pipeline, Failure Triage Contract, Final Quality Assessment Contract, Provider Benchmark Corpus, Provider-Neutral Contracts, Provider Validation and Benchmark Pipeline (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): environmentSchema, FactoryConfig, loadFactoryConfig(), rawConfigSchema, screenshotPolicySchema, config, tracePolicySchema, videoPolicySchema

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, declarationMap, outDir, rootDir, sourceMap, types, exclude (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.31
Nodes (7): checkRepositoryHealth(), execFileAsync, findRepositoryHygieneViolations(), RepositoryHealth, requiredRepositoryEntries, entryPath, root

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (9): Canonical Artifact Lifecycle, Artifact and Actor Contract Schema, Exact Artifact Reference, Registered Artifact Types, Factory Role Catalog, Factory Workflow Catalog, Atomic Workflow Store, Authorization-Gated Workflow State Machine (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.32
Nodes (8): Controlled Account Page, Controlled Account Scenarios, Controlled Preferences Page, Controlled Quality Fixtures, Generated Test Architecture Validation, Open Controlled HTML, Scenario Metadata, Synthetic Account Data

### Community 28 - "Community 28"
Cohesion: 0.32
Nodes (8): semanticChecksum(), approvedScenario(), createHumanScenarioReview(), evaluateScenarios(), findCoverageFindings(), findDuplicateScenarios(), findScenarioFindings(), generateScenarioSpecification()

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (6): Approved Advisory Memory, Improvement Trigger Policy, Knowledge Curator, Memory and Improvement Workflow, Rollback-Safe Policy Improvement, Workflow Improvement Analyst

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (4): Allowlisted Requirement Exploration, Atomic Requirement Classification, Requirement Artifact Contracts, Taxonomy Placement Proposal

### Community 31 - "Community 31"
Cohesion: 0.5
Nodes (4): Fail-Closed Authentication Preflight, Isolated Authentication Setup, Progressive Browser Execution Plan, Require Credential Reference

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (4): Fresh Test Evaluation Context, Playwright Quality Evaluator, Progressive Browser Execution, Test Quality Evaluation Workflow

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (3): Repository Memory Contracts, Approved Knowledge Pipeline, Sanitized Scoped Memory

## Knowledge Gaps
- **356 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+351 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `semanticChecksum()` connect `Community 28` to `Community 0`, `Community 2`, `Community 3`, `Community 7`, `Community 14`, `Community 16`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Actor` connect `Community 0` to `Community 1`, `Community 18`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `ArtifactReference` connect `Community 4` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _372 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._