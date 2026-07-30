# Graph Report - aristotle  (2026-07-30)

## Corpus Check
- 61 files · ~18,677 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 551 nodes · 691 edges · 48 communities (30 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92ee7df5`
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `Quality Agent Factory Development Plan` - 19 edges
2. `Quality Agent Factory Phased Implementation Plan` - 18 edges
3. `compilerOptions` - 17 edges
4. `scripts` - 16 edges
5. `devDependencies` - 13 edges
6. `semanticChecksum()` - 12 edges
7. `3. Agent and Human Roles` - 12 edges
8. `compilerOptions` - 7 edges
9. `Actor` - 7 edges
10. `WorkflowStore` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Navigation Rules` --semantically_similar_to--> `Cursor Graphify Rule`  [INFERRED] [semantically similar]
  AGENTS.md → .cursor/rules/graphify.mdc
- `Focused Pre-commit Test` --semantically_similar_to--> `Focused Tests Immediately Before Commit`  [INFERRED] [semantically similar]
  README.md → CONTRIBUTING.md
- `Graph Evidence Authorization Boundary` --semantically_similar_to--> `Consequential Claim Source Confirmation`  [INFERRED] [semantically similar]
  AGENTS.md → agents/skills/use-knowledge-graph.md
- `createWorkflowAt()` --calls--> `createWorkflow()`  [EXTRACTED]
  tests/unit/orchestration/workflow.test.ts → src/orchestration/workflow.ts
- `sampleWorkflow()` --calls--> `createWorkflow()`  [EXTRACTED]
  tests/integration/orchestration/workflow-store.test.ts → src/orchestration/workflow.ts

## Hyperedges (group relationships)
- **Repository Setup Graphify Commit Pipeline** — readme_repository_prerequisites, readme_graphify_cli_prerequisite, readme_repository_setup, readme_commit_quality_pipeline_graph_refresh [INFERRED 0.90]

## Communities (48 total, 18 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (50): analyzeRequirements(), AtomicRequirement, canonicalizePolarity(), ClarificationAnswer, ClarificationInput, isContradiction(), normalizeRequirements(), reconcileClarifications() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (45): semanticChecksum(), NormalizedRequirements, checksumSchema, HumanScenarioReview, humanScenarioReviewSchema, requirementIdSchema, Scenario, ScenarioEvaluation (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (45): 10. Requirement and Scenario Revision Management, 11. Memory and Learning, 12. Feedback and Workflow Improvement, 13. Rules and Guardrails, 14. Environment, Security, and Privacy, 15. Resource and Reliability Controls, 16. Evaluation and Testing, 17. Delivery Phases (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (40): Acceptance criteria, Checkpoint, Checkpoint, Checkpoint, Checkpoint, Checkpoint, Checkpoint, code:bash (npm run format:check) (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (28): ArtifactDefinition, ArtifactPathInput, resolveArtifactPath(), createProvenance(), ProvenanceInput, provenance, actorSchema, agentActorSchema (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (27): sameArtifactReference(), CreateWorkflowInput, incrementRetry(), legalTransitions, requireGate(), requireHuman(), requireRole(), statusFor() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (28): Analyze Requirements, Artifact Contract Principles, Bidirectional Traceability, Bounded Scenario Revision Loop, Design Test Scenarios, Evaluate Test Scenarios, Exact-Revision Human Approval, Human Authorization Gates (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): dependencies, gray-matter, mammoth, pdfjs-dist, zod, description, devDependencies, eslint (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (24): Code-only Graph Refresh, Graph Evidence Authorization Boundary, Graphify Navigation Rules, Scoped Graph Query Path Explain Commands, Full Semantic Graphify Refresh, Contribution Change Workflow, Focused Tests Immediately Before Commit, Cursor Graphify Rule (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (20): acceptArtifact(), AcceptArtifactInput, assertNotCyclic(), canonicalJson(), createArtifactRevision(), invalidateDownstreamArtifacts(), JsonValue, normalizeArray() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (13): createWorkflow(), acquireRunLock(), assertIdentifier(), isErrorCode(), ReleaseLock, partial, sampleWorkflow(), store (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, module, moduleResolution, noFallthroughCasesInSwitch, noImplicitOverride (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (16): scripts, build, check, commit:check, format, format:check, graph:refresh, health (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (8): environmentSchema, FactoryConfig, loadFactoryConfig(), rawConfigSchema, screenshotPolicySchema, config, tracePolicySchema, videoPolicySchema

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, declarationMap, outDir, rootDir, sourceMap, types, exclude (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (8): code:bash (npm ci), Commands, Commit quality pipeline, Current status, Prerequisites, Quality Agent Factory, Safety defaults, Setup

### Community 16 - "Community 16"
Cohesion: 0.36
Nodes (5): checkRepositoryHealth(), RepositoryHealth, requiredRepositoryEntries, entryPath, root

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (6): Development rules, graphify, Mission, Non-negotiable boundaries, Quality Agent Factory Agent Instructions, Required reading order

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): code:text (feat: enforce scenario approval before test generation), Commit examples, Contributing, Pull request expectations, Workflow

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): Quality Agent Factory Development Plan, Phased Implementation Plan, Claude Code Provider, Codex Provider, Cursor Provider, Quality Agent Factory

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (5): Dependencies and integrations, Security Boundaries, Sensitive material, Target environment, Untrusted inputs

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Requirement Analyst

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Test Scenario Designer

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (4): Authority, Outputs, Required inputs, Scenario Quality Evaluator

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (4): Boundaries, Query, Refresh, Use the Knowledge Graph

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (4): Failure Triage Analyst, Final Human Reviewer, Final Quality Assessor, SCRIPT_ERROR Repair Gate

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (4): Commit Quality Pipeline Graphify Refresh, Graphify CLI Prerequisite, Repository Prerequisites, Repository Setup

## Knowledge Gaps
- **292 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+287 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Actor` connect `Community 5` to `Community 0`, `Community 9`, `Community 4`, `Community 1`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _305 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._