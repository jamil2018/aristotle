# Contributing

## Workflow

1. Read the source plan and phased implementation tracker.
2. Create a short-lived branch from `main`.
3. Select one unchecked task whose dependencies are complete.
4. Write or update tests before behavior.
5. Keep the change scoped and update the tracker with evidence.
6. Run `npm run check`, including the changed-code Fallow static analysis gate.
7. Commit atomically using Conventional Commit style.

Do not combine workflow-policy changes with feature implementation. Policy,
schema, template, and provider changes require focused review because they can
alter authorization boundaries.

## Commit examples

```text
feat: enforce scenario approval before test generation
test: cover interrupted workflow resumption
docs: clarify product defect evidence requirements
```

## Pull request expectations

- State the phase and task IDs.
- Explain authorization or security implications.
- List verification commands and results.
- Identify residual risks and deferred work.
- Never include secrets, authentication state, or raw personal data.
