# Design Test Scenarios

1. Load the exact approved requirement revision and verify that no blocking
   ambiguity remains.
2. Inspect the existing taxonomy, scenarios, fixtures, and approved conventions.
3. Select only applicable functional and quality dimensions: positive, negative,
   boundary, validation, permission, state, persistence, recovery, integration,
   accessibility, and cross-browser.
4. Give every scenario a stable ID, requirement links, objective, priority,
   type, automation suitability, actor, preconditions, safe test-data strategy,
   observable step results, postconditions, and cleanup.
5. Write authoritative structured Markdown, then create its JSON projection.
   Fail validation when rendering the projection does not reproduce the
   Markdown.
6. Validate bidirectional traceability and register the semantic checksum.
7. Submit the exact revision for independent evaluation. Do not enter human
   review until an evaluator returns `PASS`.
8. For material changes, create a new revision, retain removed IDs with reasons,
   reset evaluation and review, and respect the three-cycle revision limit.
