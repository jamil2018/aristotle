# Quality Agent Factory Phased Implementation Plan

## Purpose

This document converts the product vision in
[`quality-agent-factory-development-plan.md`](./quality-agent-factory-development-plan.md)
into incremental, verifiable delivery phases. It is the development progress
tracker and should be updated in the same change that completes a task.

## Status legend

- `NOT_STARTED`: no implementation has begun.
- `IN_PROGRESS`: implementation is active on a feature branch.
- `BLOCKED`: progress requires a recorded decision or external dependency.
- `COMPLETE`: acceptance checks have passed and the work is committed.

## Delivery principles

1. Build foundations before workflow behavior.
2. Deliver one testable vertical slice at a time.
3. Keep human authorization gates programmatically enforceable.
4. Treat documents, applications, logs, and agent output as untrusted data.
5. Preserve accepted artifacts; create revisions instead of overwriting them.
6. Require automated verification and recorded evidence at every phase
   checkpoint.

## Progress summary

| Phase | Name                            | Status      | Depends on | Exit checkpoint                                                                |
| ----: | ------------------------------- | ----------- | ---------- | ------------------------------------------------------------------------------ |
|     1 | Repository foundation           | IN_PROGRESS | None       | Fresh clone installs, validates, builds, and exposes a safe Playwright harness |
|     2 | Contracts and orchestration     | COMPLETE    | Phase 1    | State transitions and authorization gates pass contract tests                  |
|     3 | Requirement pipeline            | COMPLETE    | Phase 2    | All supported inputs produce validated, source-linked requirements             |
|     4 | Scenario pipeline               | COMPLETE    | Phase 3    | Evaluated and human-approved scenarios are traceable and revision-safe         |
|     5 | Playwright pipeline             | COMPLETE    | Phase 4    | Only approved scenarios produce executable, linked tests                       |
|     6 | Failure and assessment pipeline | COMPLETE    | Phase 5    | Failures are classified before repair and final packages are assessable        |
|     7 | Memory and improvement          | COMPLETE    | Phase 6    | Approved knowledge is retrievable and policy changes remain gated              |
|     8 | Provider hardening              | NOT_STARTED | Phases 1-7 | Codex, Cursor, and Claude Code pass the benchmark corpus                       |

## Current delivery snapshot

- Last reconciled: 2026-07-30.
- Completed implementation phases: Phase 2, Phase 3, Phase 4, Phase 5, Phase 6,
  and Phase 7.
- Foundation status: all Phase 1 implementation tasks are complete, but Phase 1
  remains `IN_PROGRESS` until a fresh clone passes `npm ci` and the complete
  quality gate on the pinned Node 22 runtime.
- Active delivery branch: `codex/phase-7-memory-improvement`.
- Active review: draft pull request
  [#7](https://github.com/jamil2018/aristotle/pull/7), targeting `main`.
- Phase 4 merged through pull request
  [#3](https://github.com/jamil2018/aristotle/pull/3).
- Current automated baseline: 12 unit-test files with 89 passing tests, 1
  integration-test file with 4 passing tests, and 7 controlled Playwright tests
  passing across authentication setup, Chromium, Firefox, and WebKit.
- Static-analysis baseline: Fallow 3.10.0 reports no dead code, duplication, or
  complexity findings across 44 analyzed files and 400 functions; average
  maintainability is 93.6.
- Next implementation phase: Phase 8, provider hardening.

## Phase 1: Repository foundation

**Goal:** Produce a clone-ready, repository-resident TypeScript and Playwright
foundation with deterministic commands and conservative security defaults.

### Tasks

- [x] `P1-01` Initialize Git with `main` and create
      `feat/phase-1-repository-foundation`.
- [x] `P1-02` Preserve the source development plan and add this progress
      tracker.
- [x] `P1-03` Add the planned repository directory structure and provider entry
      points.
- [x] `P1-04` Configure Node, strict TypeScript, formatting, linting, and
      Vitest.
- [x] `P1-05` Configure Playwright projects, evidence retention, base URL, and
      ignored auth state.
- [x] `P1-06` Add typed factory configuration with safe environment defaults.
- [x] `P1-07` Add a repository health check and unit tests.
- [x] `P1-08` Add contributor setup, security boundaries, and operating
      principles.
- [x] `P1-09` Install dependencies and commit the lockfile.
- [x] `P1-10` Pass format, lint, typecheck, unit-test, build, and health checks.
- [x] `P1-11` Commit and push the branch.

### Acceptance criteria

- [ ] `npm ci` succeeds on the pinned Node LTS line.
- [x] `npm run check` passes from a clean working tree.
- [x] `npm run health` reports all required files and directories.
- [x] Playwright configuration refuses unsafe production writes by default.
- [x] `.env`, authentication state, test evidence, and build output are ignored.
- [x] Codex, Cursor, and Claude Code have repository-resident entry-point
      guidance.

### Phase 1 verification record

- Date: 2026-07-29
- Branch: `feat/phase-1-repository-foundation`
- Published branch: `main` at `a9a46daf8dcf94369a7765853c29d0fcf4003961`
- Result: `npm run check` passed with 2 test files and 5 unit tests.
- Dependency audit: 0 known vulnerabilities reported during installation.
- Environment note: verification ran on Node 26.5.0 because Node 22 was not
  installed on the workstation. Node 22 LTS remains pinned and fresh-clone
  verification on that runtime is still required.

### Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm run static:analysis
npm run test:unit
npm run test:integration
npm run build
npm run health
```

## Phase 2: Contracts and orchestration

**Goal:** Establish versioned artifact contracts and a resumable workflow state
machine whose authorization gates are enforced in code.

### Tasks

- [x] `P2-01` Define Zod schemas for task, decision, workflow, and artifact
      manifests.
- [x] `P2-02` Create the versioned artifact registry and output-path resolver.
- [x] `P2-03` Implement workflow stages, legal transitions, retry limits, and
      locking.
- [x] `P2-04` Enforce clarification, evaluator, human approval, triage, and
      final-review gates.
- [x] `P2-05` Add semantic checksums, immutable acceptance records, and revision
      rules.
- [x] `P2-06` Add atomic persistence, resumption, cancellation, and
      partial-output recovery.
- [x] `P2-07` Record provenance for Git, runtime, provider, configuration, and
      revisions.
- [x] `P2-08` Add schema, contract, integration, and interrupted-resumption
      tests.

### Checkpoint

- [x] Invalid artifacts cannot advance state.
- [x] Agents cannot create or overwrite human approvals.
- [x] Material changes invalidate exact downstream artifacts.

### Phase 2 verification record

- Date: 2026-07-29
- Branch: `agent/phase-2-contracts-orchestration`
- Result: `npm run check` passed with 7 unit-test files and 29 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests.
- Contract coverage: schemas, exact accepted references, registered producers,
  legal transitions, authorization gates, retry limits, semantic checksums,
  immutable revisions, downstream invalidation, atomic persistence, optimistic
  revision checks, interrupted recovery, run locking, cancellation, and
  provenance.
- Environment note: verification ran on Node 26.5.0. The repository remains
  pinned to Node 22, whose fresh-clone check is still tracked in Phase 1.

## Phase 3: Requirement pipeline

**Goal:** Convert supported sources into stable, reviewed requirement revisions
and stop when material ambiguity remains.

### Tasks

- [x] `P3-01` Preserve and ingest direct text and Markdown sources.
- [x] `P3-02` Extract PDF text with `pdfjs-dist` without executing embedded
      content.
- [x] `P3-03` Extract DOCX text with `mammoth` without executing macros.
- [x] `P3-04` Normalize atomic requirements with stable IDs and source
      references.
- [x] `P3-05` Detect contradictions, omissions, assumptions, and blocking
      ambiguity.
- [x] `P3-06` Inspect taxonomy and implement placement proposals and
      clarification.
- [x] `P3-07` Add bounded, allowlisted browser exploration as optional evidence.
- [x] `P3-08` Reconcile human answers into a new revision and run impact
      analysis.

### Checkpoint

- [x] Every supported format passes the sanitized corpus.
- [x] Blocking ambiguity always pauses progression.
- [x] Observed behavior is never silently promoted to intended behavior.

### Phase 3 verification record

- Date: 2026-07-29
- Branch: `agent/phase-3-requirement-pipeline`
- Draft pull request: [#2](https://github.com/jamil2018/aristotle/pull/2),
  targeting `main`.
- Latest implementation commit: `fca80cfa4db8a0f4e9fa0ca387e48ca71ea336e1`.
- Result: `npm run check` passed with 8 unit-test files and 45 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests.
- Static analysis: Fallow 3.10.0 is part of `npm run check` as a full-codebase
  gate. The verified baseline has 0 dead-code findings, 0 duplication groups,
  and 0 functions above the complexity thresholds across 28 files and 201
  functions; average maintainability is 93.8.
- Corpus coverage: direct text, Markdown with frontmatter, generated PDF, and
  macro-free DOCX extraction; empty and oversized inputs; ambiguous,
  contradictory, observational, and taxonomy-placement cases.
- Security coverage: inert document parsing, source checksums, schema
  validation, exact source links, human-only clarification reconciliation,
  bounded page counts, HTTP(S)-only URLs, and exact origin allowlists.

## Phase 4: Scenario pipeline

**Goal:** Generate human-readable, machine-validatable scenarios with
independent evaluation, revision safety, human approval, and bidirectional
traceability.

### Tasks

- [x] `P4-01` Define Markdown scenario and JSON projection contracts.
- [x] `P4-02` Generate coverage across applicable functional and quality
      dimensions.
- [x] `P4-03` Validate projection parity and semantic checksums.
- [x] `P4-04` Implement independent evaluator `PASS`, `REVISE`, and `BLOCKED`
      results.
- [x] `P4-05` Implement bounded agent revision loops.
- [x] `P4-06` Implement exact-revision human review and explicit exclusions.
- [x] `P4-07` Return human-requested changes through independent evaluation.
- [x] `P4-08` Generate and validate bidirectional traceability.

### Checkpoint

- [x] Human review is unreachable until evaluator `PASS`.
- [x] Material scenario changes invalidate evaluation and approval.
- [x] Markdown remains authoritative over the JSON projection.

### Phase 4 verification record

- Date: 2026-07-30
- Branch: `codex/phase-4-scenario-pipeline`
- Result: `npm run check` passed with 9 unit-test files and 55 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests.
- Static analysis: Fallow 3.10.0 reports 0 dead-code findings, 0 duplication
  groups, and 0 functions above the configured complexity thresholds across 31
  files and 279 functions; average maintainability is 93.4.
- Contract coverage: stable scenario IDs, applicable positive/negative/boundary
  generation, authoritative Markdown rendering, JSON projection parity, semantic
  checksums, independent `PASS`/`REVISE`/`BLOCKED` evaluation, three-cycle
  material revision bounds, human-only exact-revision approval, explicit
  exclusions, reevaluation after changes, and bidirectional traceability.
- Security coverage: requirement and scenario content remains untrusted data,
  Markdown table delimiters are escaped, sensitive test data is represented by
  strategy and sensitivity classifications, and agents cannot manufacture human
  scenario approval.

## Phase 5: Playwright pipeline

**Goal:** Generate and execute maintainable Playwright tests only from
authorized scenario revisions.

### Tasks

- [x] `P5-01` Define requirement/scenario metadata conventions for tests.
- [x] `P5-02` Add authentication setup with ignored storage state.
- [x] `P5-03` Add fixtures, deterministic test-data utilities, and cleanup
      patterns.
- [x] `P5-04` Implement approval verification before test generation.
- [x] `P5-05` Implement safe test generation using repository conventions.
- [x] `P5-06` Execute browser projects with HTML and machine-readable reporting.
- [x] `P5-07` Register traces, screenshots, videos, and result artifacts.
- [x] `P5-08` Add controlled sample-application end-to-end tests.

### Checkpoint

- [x] Unapproved scenarios cannot generate test code.
- [x] Tests use accessible locators, web-first assertions, and no arbitrary
      sleeps.
- [x] Every result traces to exact scenario and requirement revisions.

### Phase 5 verification record

- Date: 2026-07-30
- Branch: `codex/phase-5-playwright-pipeline`
- Draft pull request: [#5](https://github.com/jamil2018/aristotle/pull/5),
  targeting `main`.
- Implementation commit: `040d7953e6c03f4c7c25bc2cb8fe76fc50effb44`.
- Result: `npm run check` passed with 10 unit-test files and 78 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests; `npm run test:e2e` passed authentication setup and the
  controlled sample on Chromium, Firefox, and WebKit with 7 tests total.
- Static analysis: Fallow 3.10.0 reports 0 dead-code findings, 0 duplication
  groups, and 0 functions above configured complexity thresholds across 38 files
  and 347 functions; average maintainability is 93.6.
- Authorization coverage: generation requires evaluator `PASS` and human
  approval for the exact scenario revision, evaluation checksum, and semantic
  checksum; exclusions, stale requirements, and non-candidate scenarios are
  rejected. Test execution requires the Playwright test engineer and an exact
  registered `playwright-test` artifact.
- Harness coverage: accessible locators, web-first assertions, relative routes,
  environment-only secret references, ignored authentication state,
  deterministic run-scoped data, reverse-order cleanup, HTML and JSON reports,
  safe evidence paths, and exact requirement/scenario metadata.
- Scaled capability coverage: common check, uncheck, select, keyboard, enabled,
  checked, value, and count primitives are supported. A versioned classifier
  permits one deterministic low-risk locator capability extension per run and
  records every proposal; sensitive or policy-changing extensions require human
  review.
- Controlled sample decision: use an intercepted repository-local HTML
  application and synthetic non-secret authentication state for deterministic
  cross-browser harness verification. Real target authentication remains
  task-scoped and environment-configured.
- Next-session handoff: start Phase 6 with triage records and the six failure
  classifications. Preserve execution evidence before any repair, require
  `SCRIPT_ERROR` for the existing test-repair transition, and keep target
  application source read-only.

## Phase 6: Failure and assessment pipeline

**Goal:** Classify evidence before repair, preserve product-defect candidates,
and assemble a traceable package for final human review.

### Tasks

- [x] `P6-01` Define triage records and six failure classifications.
- [x] `P6-02` Collect reproduction, trace, console, network, environment, and
      data evidence.
- [x] `P6-03` Gate test-code repair on `SCRIPT_ERROR`.
- [x] `P6-04` Add bounded repair/rerun loops and preserve revision history.
- [x] `P6-05` Generate evidence-backed defect candidates without editing
      application code.
- [x] `P6-06` Handle environment, data, ambiguity, and inconclusive blockers.
- [x] `P6-07` Implement final quality assessment and residual-risk reporting.
- [x] `P6-08` Stop at final human review and record the disposition.

### Checkpoint

- [x] No failure is repaired before classification.
- [x] Product defects never authorize application changes.
- [x] Final packages provide requirement-to-result traceability.

### Phase 6 verification record

- Date: 2026-07-30
- Branch: `codex/phase-6-failure-assessment`
- Draft pull request: [#6](https://github.com/jamil2018/aristotle/pull/6),
  targeting `main`.
- Implementation commit: `bcc5502aa2abdd02946dc5d0a6edb39d723fee0f`.
- Result: `npm run check` passed with 11 unit-test files and 84 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests.
- Static analysis: Fallow 3.10.0 reports 0 dead-code findings, 0 duplication
  groups, and 0 functions above configured complexity thresholds across 41 files
  and 372 functions; average maintainability is 93.7.
- Triage coverage: exact execution-summary evidence, six classifications,
  confidence, contrary evidence, bounded reproduction, safe evidence paths, and
  classification-specific workflow routes.
- Repair and defect coverage: only an exact `SCRIPT_ERROR` triage revision
  authorizes the next Playwright test revision, repairs are capped at three, and
  product-defect candidates require reproduction, the intended condition,
  approved expectations, and ruled-out script, environment, data, and
  authentication causes. Application changes are always unauthorized.
- Assessment coverage: exact requirement-to-scenario-to-test-to-result links,
  missing artifacts, stale tests, unresolved failures, skipped coverage, and
  residual risks determine `READY_FOR_HUMAN_REVIEW`, `REVISION_REQUIRED`, or
  `BLOCKED`; the assessor cannot grant final approval.
- Next-session handoff: start Phase 7 with immutable, sanitized run summaries
  and scoped knowledge-proposal contracts. Keep historical patterns
  non-authoritative until separate human promotion, disclose retrieved knowledge
  influence, and preserve regression, shadow-evaluation, and rollback gates for
  workflow improvements.

## Phase 7: Memory and improvement

**Goal:** Learn safely from approved repository-local experience without
silently changing active policy.

### Tasks

- [x] `P7-01` Store immutable structured run summaries without raw transcripts.
- [x] `P7-02` Define scoped knowledge proposals with evidence and invalidation
      conditions.
- [x] `P7-03` Add human approval and promotion gates for authoritative
      knowledge.
- [x] `P7-04` Retrieve narrowly relevant approved knowledge and disclose its
      influence.
- [x] `P7-05` Capture correction, triage, repair, coverage, and flakiness
      feedback.
- [x] `P7-06` Detect improvement thresholds and generate evidence-backed
      proposals.
- [x] `P7-07` Add regression, shadow-evaluation, and rollback workflows.
- [x] `P7-08` Test stale, rejected, sensitive, and cross-scope memory behavior.

### Checkpoint

- [x] Historical patterns never override current approved requirements.
- [x] Knowledge and policy changes require distinct human approvals.
- [x] Improvements pass regression and shadow evaluation before adoption.

### Phase 7 verification record

- Date: 2026-07-30
- Branch: `codex/phase-7-memory-improvement`
- Draft pull request: [#7](https://github.com/jamil2018/aristotle/pull/7),
  targeting `main`.
- Implementation commit: `a9d7a6f39e88f9ed4a3bf6f7bbcb8f8f47b175eb`.
- Result: `npm run check` passed with 12 unit-test files and 89 unit tests;
  `npm run test:integration` passed with 1 integration-test file and 4
  integration tests.
- Static analysis: Fallow 3.10.0 reports 0 dead-code findings, 0 duplication
  groups, and 0 functions above configured complexity thresholds across 44 files
  and 400 functions; average maintainability is 93.6.
- Memory coverage: immutable sanitized summaries exclude raw transcripts;
  proposals carry exact scope, evidence, confidence, and invalidation
  conditions; retrieval accepts only approved, non-stale, exact-scope entries
  and discloses advisory influence while current requirements remain
  authoritative.
- Improvement coverage: feedback captures human corrections, evaluator and
  final-review findings, triage changes, repairs, missing coverage, flakiness,
  stale artifacts, and placement questions. Proposals require three matching
  findings across separate tasks, one severe failure, or an explicit human
  request.
- Authorization coverage: knowledge approval and policy approval are distinct
  permanent human-produced artifacts. Improvement adoption requires the exact
  proposal checksum, human policy approval, regression success, shadow
  evaluation success, and a recorded rollback plan.
- Graph note: the deterministic Graphify code graph was refreshed to 981 nodes
  and 1,218 edges. Full semantic document extraction was unavailable because no
  supported LLM API key was configured; source plans and contracts remain
  authoritative.
- Next-session handoff: start Phase 8 with provider-neutral adapter contracts
  and role/skill contract tests across Codex, Cursor, and Claude Code. Build the
  permanent sanitized benchmark corpus before measuring provider quality, keep
  provider presentation from weakening shared gates, and close Phase 1 only
  after a fresh Node 22 clone passes `npm ci` and the complete quality gate.

## Phase 8: Provider hardening

**Goal:** Validate portable behavior across Codex, Cursor, and Claude Code and
complete production-quality documentation and examples.

### Tasks

- [ ] `P8-01` Complete provider-specific adapters and instruction entry points.
- [ ] `P8-02` Add contract tests for every role and skill on each provider.
- [ ] `P8-03` Execute the permanent benchmark corpus across providers.
- [ ] `P8-04` Add the authentication example and controlled sample application.
- [ ] `P8-05` Complete architecture, workflow, security, triage, memory, and
      troubleshooting docs.
- [ ] `P8-06` Measure acceptance, correction, classification, leakage, and
      traceability quality.
- [ ] `P8-07` Verify fresh-clone setup and provider compatibility in CI.
- [ ] `P8-08` Complete the final acceptance-criteria audit.

### Final checkpoint

- [ ] All product acceptance criteria in the source plan are evidenced.
- [ ] Provider differences do not weaken workflow gates.
- [ ] The factory is clone-ready and stops at final human review.

## Decision log

| Date       | Decision                                                                     | Rationale                                                                                                                |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-29 | Use the source plan's eight delivery phases                                  | Preserves author intent and dependency order                                                                             |
| 2026-07-29 | Make Phase 1 tooling and health checks executable                            | A clone-ready foundation must be verifiable before workflow features are added                                           |
| 2026-07-29 | Keep runtime source under `src/` and repository instructions under `agents/` | Separates enforceable behavior from provider-facing guidance                                                             |
| 2026-07-29 | Pin the supported runtime to Node 22                                         | Establishes one reproducible LTS target while later runtimes remain unverified                                           |
| 2026-07-29 | Use repository-local manifests and atomic filesystem persistence             | Delivers durable resumable state without requiring a database in v1                                                      |
| 2026-07-29 | Enforce Fallow as a full-codebase quality gate                               | Prevents dead code, duplication, and complexity regressions after cleanup                                                |
| 2026-07-30 | Version the Graphify map and commit quality pipeline                         | Keeps architectural context current and enforces local lint, format, Fallow, TypeScript, and graph checks before commits |
| 2026-07-30 | Use an intercepted local sample and synthetic ignored auth state for Phase 5 | Verifies the complete browser harness without external infrastructure, production data, or versioned credentials         |
| 2026-07-30 | Reserve human gates for intent and authority; automate bounded mechanics     | Keeps the factory scalable while preventing agents from expanding or weakening their own executable-code policy          |

## Repository tooling record

- Date: 2026-07-30
- Branch: `codex/graphify-commit-quality-gates`
- Scope: repository-wide tooling; no phase workflow or authorization state was
  changed.
- Commit pipeline: lint, formatting validation, Fallow static analysis,
  TypeScript compilation, then Graphify refresh.
- Agent rule: run the smallest relevant test selection immediately before each
  commit; focused tests supplement rather than replace `npm run check`.
- Versioned graph outputs: `graphify-out/graph.json`,
  `graphify-out/GRAPH_REPORT.md`, and `graphify-out/graph.html`.
- Generated graph outputs are excluded from Prettier; local Graphify caches,
  manifests, interpreter pointers, cost history, and optional exports are
  excluded from source control.

## Risks and mitigations

| Risk                                            | Impact   | Mitigation                                                                 |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Provider instruction formats diverge            | High     | Keep shared contracts provider-neutral and test adapters separately        |
| Agent-generated approvals bypass humans         | Critical | Store human decisions separately and reject agent actors in schemas        |
| Untrusted content causes instruction injection  | Critical | Parse as data, label provenance, and enforce role/security boundaries      |
| Scenario and JSON representations drift         | High     | Validate both against a semantic checksum with Markdown authoritative      |
| Retries hide flaky behavior                     | High     | Treat retries as evidence and require an explicit disposition              |
| Repository structure becomes placeholder-heavy  | Medium   | Add directories only when they have an owner, contract, or near-term phase |
| Pinned-runtime verification remains outstanding | Medium   | Keep Phase 1 open until a fresh Node 22 clone passes all quality gates     |
| Static-analysis findings regress                | Medium   | Run the full-codebase Fallow gate within `npm run check`                   |

## Open decisions

- Decide whether CI initially targets one provider or the complete provider
  matrix.
