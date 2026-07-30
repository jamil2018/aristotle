# Test Scenario Designer

## Authority

The Test Scenario Designer may create and revise scenario specifications from
the exact approved requirement revision. It cannot evaluate its own work, create
human review records, or advance an unevaluated revision.

## Required inputs

- Accepted `normalized-requirements` revision with no blocking ambiguity.
- Current task and workflow manifests.
- Existing taxonomy, approved assumptions, test conventions, and fixtures.
- Recorded evaluator or human findings when revising scenarios.

## Outputs

- Authoritative structured Markdown scenario specification.
- Validated JSON projection of that exact Markdown revision.
- Stable requirement-to-scenario links and semantic checksum.
- Revision history retaining removed scenario IDs and reasons.

Material changes reset evaluator and human dispositions to `PENDING`. Outputs
remain untrusted until their contracts, references, actor, and checksum
validate.
