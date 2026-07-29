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
|     2 | Contracts and orchestration     | NOT_STARTED | Phase 1    | State transitions and authorization gates pass contract tests                  |
|     3 | Requirement pipeline            | NOT_STARTED | Phase 2    | All supported inputs produce validated, source-linked requirements             |
|     4 | Scenario pipeline               | NOT_STARTED | Phase 3    | Evaluated and human-approved scenarios are traceable and revision-safe         |
|     5 | Playwright pipeline             | NOT_STARTED | Phase 4    | Only approved scenarios produce executable, linked tests                       |
|     6 | Failure and assessment pipeline | NOT_STARTED | Phase 5    | Failures are classified before repair and final packages are assessable        |
|     7 | Memory and improvement          | NOT_STARTED | Phase 6    | Approved knowledge is retrievable and policy changes remain gated              |
|     8 | Provider hardening              | NOT_STARTED | Phases 1-7 | Codex, Cursor, and Claude Code pass the benchmark corpus                       |

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
- [ ] `P1-11` Commit and push the branch.

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
npm run test:unit
npm run build
npm run health
```

## Phase 2: Contracts and orchestration

**Goal:** Establish versioned artifact contracts and a resumable workflow state
machine whose authorization gates are enforced in code.

### Tasks

- [ ] `P2-01` Define Zod schemas for task, decision, workflow, and artifact
      manifests.
- [ ] `P2-02` Create the versioned artifact registry and output-path resolver.
- [ ] `P2-03` Implement workflow stages, legal transitions, retry limits, and
      locking.
- [ ] `P2-04` Enforce clarification, evaluator, human approval, triage, and
      final-review gates.
- [ ] `P2-05` Add semantic checksums, immutable acceptance records, and revision
      rules.
- [ ] `P2-06` Add atomic persistence, resumption, cancellation, and
      partial-output recovery.
- [ ] `P2-07` Record provenance for Git, runtime, provider, configuration, and
      revisions.
- [ ] `P2-08` Add schema, contract, integration, and interrupted-resumption
      tests.

### Checkpoint

- [ ] Invalid artifacts cannot advance state.
- [ ] Agents cannot create or overwrite human approvals.
- [ ] Material changes invalidate exact downstream artifacts.

## Phase 3: Requirement pipeline

**Goal:** Convert supported sources into stable, reviewed requirement revisions
and stop when material ambiguity remains.

### Tasks

- [ ] `P3-01` Preserve and ingest direct text and Markdown sources.
- [ ] `P3-02` Extract PDF text with `pdfjs-dist` without executing embedded
      content.
- [ ] `P3-03` Extract DOCX text with `mammoth` without executing macros.
- [ ] `P3-04` Normalize atomic requirements with stable IDs and source
      references.
- [ ] `P3-05` Detect contradictions, omissions, assumptions, and blocking
      ambiguity.
- [ ] `P3-06` Inspect taxonomy and implement placement proposals and
      clarification.
- [ ] `P3-07` Add bounded, allowlisted browser exploration as optional evidence.
- [ ] `P3-08` Reconcile human answers into a new revision and run impact
      analysis.

### Checkpoint

- [ ] Every supported format passes the sanitized corpus.
- [ ] Blocking ambiguity always pauses progression.
- [ ] Observed behavior is never silently promoted to intended behavior.

## Phase 4: Scenario pipeline

**Goal:** Generate human-readable, machine-validatable scenarios with
independent evaluation, revision safety, human approval, and bidirectional
traceability.

### Tasks

- [ ] `P4-01` Define Markdown scenario and JSON projection contracts.
- [ ] `P4-02` Generate coverage across applicable functional and quality
      dimensions.
- [ ] `P4-03` Validate projection parity and semantic checksums.
- [ ] `P4-04` Implement independent evaluator `PASS`, `REVISE`, and `BLOCKED`
      results.
- [ ] `P4-05` Implement bounded agent revision loops.
- [ ] `P4-06` Implement exact-revision human review and explicit exclusions.
- [ ] `P4-07` Return human-requested changes through independent evaluation.
- [ ] `P4-08` Generate and validate bidirectional traceability.

### Checkpoint

- [ ] Human review is unreachable until evaluator `PASS`.
- [ ] Material scenario changes invalidate evaluation and approval.
- [ ] Markdown remains authoritative over the JSON projection.

## Phase 5: Playwright pipeline

**Goal:** Generate and execute maintainable Playwright tests only from
authorized scenario revisions.

### Tasks

- [ ] `P5-01` Define requirement/scenario metadata conventions for tests.
- [ ] `P5-02` Add authentication setup with ignored storage state.
- [ ] `P5-03` Add fixtures, deterministic test-data utilities, and cleanup
      patterns.
- [ ] `P5-04` Implement approval verification before test generation.
- [ ] `P5-05` Implement safe test generation using repository conventions.
- [ ] `P5-06` Execute browser projects with HTML and machine-readable reporting.
- [ ] `P5-07` Register traces, screenshots, videos, and result artifacts.
- [ ] `P5-08` Add controlled sample-application end-to-end tests.

### Checkpoint

- [ ] Unapproved scenarios cannot generate test code.
- [ ] Tests use accessible locators, web-first assertions, and no arbitrary
      sleeps.
- [ ] Every result traces to exact scenario and requirement revisions.

## Phase 6: Failure and assessment pipeline

**Goal:** Classify evidence before repair, preserve product-defect candidates,
and assemble a traceable package for final human review.

### Tasks

- [ ] `P6-01` Define triage records and six failure classifications.
- [ ] `P6-02` Collect reproduction, trace, console, network, environment, and
      data evidence.
- [ ] `P6-03` Gate test-code repair on `SCRIPT_ERROR`.
- [ ] `P6-04` Add bounded repair/rerun loops and preserve revision history.
- [ ] `P6-05` Generate evidence-backed defect candidates without editing
      application code.
- [ ] `P6-06` Handle environment, data, ambiguity, and inconclusive blockers.
- [ ] `P6-07` Implement final quality assessment and residual-risk reporting.
- [ ] `P6-08` Stop at final human review and record the disposition.

### Checkpoint

- [ ] No failure is repaired before classification.
- [ ] Product defects never authorize application changes.
- [ ] Final packages provide requirement-to-result traceability.

## Phase 7: Memory and improvement

**Goal:** Learn safely from approved repository-local experience without
silently changing active policy.

### Tasks

- [ ] `P7-01` Store immutable structured run summaries without raw transcripts.
- [ ] `P7-02` Define scoped knowledge proposals with evidence and invalidation
      conditions.
- [ ] `P7-03` Add human approval and promotion gates for authoritative
      knowledge.
- [ ] `P7-04` Retrieve narrowly relevant approved knowledge and disclose its
      influence.
- [ ] `P7-05` Capture correction, triage, repair, coverage, and flakiness
      feedback.
- [ ] `P7-06` Detect improvement thresholds and generate evidence-backed
      proposals.
- [ ] `P7-07` Add regression, shadow-evaluation, and rollback workflows.
- [ ] `P7-08` Test stale, rejected, sensitive, and cross-scope memory behavior.

### Checkpoint

- [ ] Historical patterns never override current approved requirements.
- [ ] Knowledge and policy changes require distinct human approvals.
- [ ] Improvements pass regression and shadow evaluation before adoption.

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

| Date       | Decision                                                                     | Rationale                                                                      |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 2026-07-29 | Use the source plan's eight delivery phases                                  | Preserves author intent and dependency order                                   |
| 2026-07-29 | Make Phase 1 tooling and health checks executable                            | A clone-ready foundation must be verifiable before workflow features are added |
| 2026-07-29 | Keep runtime source under `src/` and repository instructions under `agents/` | Separates enforceable behavior from provider-facing guidance                   |

## Risks and mitigations

| Risk                                           | Impact   | Mitigation                                                                 |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Provider instruction formats diverge           | High     | Keep shared contracts provider-neutral and test adapters separately        |
| Agent-generated approvals bypass humans        | Critical | Store human decisions separately and reject agent actors in schemas        |
| Untrusted content causes instruction injection | Critical | Parse as data, label provenance, and enforce role/security boundaries      |
| Scenario and JSON representations drift        | High     | Validate both against a semantic checksum with Markdown authoritative      |
| Retries hide flaky behavior                    | High     | Treat retries as evidence and require an explicit disposition              |
| Repository structure becomes placeholder-heavy | Medium   | Add directories only when they have an owner, contract, or near-term phase |

## Open decisions

- Choose the supported Node LTS major after dependency compatibility validation.
- Define the first durable task-manifest storage schema in Phase 2.
- Select the controlled sample application and authentication strategy in
  Phase 5.
- Decide whether CI initially targets one provider or the complete provider
  matrix.
