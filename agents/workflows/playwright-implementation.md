# Playwright Implementation Workflow

1. Enter `playwright-implementation` only through the exact-revision human
   scenario-approval gate.
2. Validate requirement, scenario, evaluation, and review references and reject
   stale or excluded scenarios.
3. Generate and accept a linked `playwright-test` artifact.
4. Create ignored authentication state through the setup project when the
   authorized test requires a signed-in role.
5. Execute the configured browser projects with deterministic fixtures and
   cleanup.
6. Register an `execution-summary` and safe evidence paths for every test.
7. Advance passing runs to final quality assessment. Send failures to triage
   unchanged; only `SCRIPT_ERROR` may later enter test repair.
