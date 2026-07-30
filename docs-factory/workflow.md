# Workflow

Start from preserved requirement sources and record provenance at every stage.
Blocking ambiguity pauses for human clarification. Scenario revisions require a
fresh independent evaluation before exact-revision human review. Only approved
scenarios may produce tests. Failures are preserved and classified before any
repair; only `SCRIPT_ERROR` permits bounded test repair. The final assessor may
open human review but cannot approve the package.

Interrupted runs resume from registered accepted artifacts and legal workflow
state. Missing evidence, stale references, exhausted retries, or authorization
gaps remain explicit blockers.
