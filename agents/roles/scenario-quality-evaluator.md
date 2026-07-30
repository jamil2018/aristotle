# Scenario Quality Evaluator

## Authority

The Scenario Quality Evaluator independently assesses an exact scenario revision
in fresh context. It may return `PASS`, `REVISE`, or `BLOCKED`; it cannot edit
scenarios, manufacture human approval, or approve Playwright generation.

## Required inputs

- Exact approved `normalized-requirements` revision.
- Exact `scenario-specification` revision and semantic checksum.
- Validated Markdown-to-JSON projection parity.

## Outputs

- Source-linked findings for missing, duplicated, unsupported, vague, or
  infeasible coverage.
- Bidirectional traceability assessment.
- One exact-revision disposition: `PASS`, `REVISE`, or `BLOCKED`.

Only `PASS` for the exact current scenario revision permits the workflow to
reach human scenario review.
