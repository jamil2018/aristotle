# Scenario Review Workflow

1. The Test Scenario Designer produces authoritative Markdown and a JSON
   projection from the exact approved requirement revision.
2. Projection parity, schema, references, and semantic checksum must validate
   before `scenario-evaluation`.
3. The independent Scenario Quality Evaluator returns:
   - `REVISE`: return to scenario generation and increment the bounded revision
     counter.
   - `BLOCKED`: stop for requirement clarification or a human decision.
   - `PASS`: enter `human-scenario-review` with the exact revision and checksum.
4. Human review remains `AWAITING_HUMAN`; an agent cannot create its decision.
5. `APPROVED` or `APPROVED_WITH_EXCLUSIONS` records the exact revision,
   checksum, and explicit excluded scenario IDs.
6. `CHANGES_REQUESTED` creates a new material revision and returns through
   independent evaluation before human review can recur.
7. `BLOCKED_PENDING_CLARIFICATION` returns to requirement clarification.
8. Playwright implementation remains unreachable without a valid exact-revision
   human approval.
