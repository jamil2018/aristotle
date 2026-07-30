# Requirement Clarification Workflow

1. The Requirement Analyst records each blocking issue against exact requirement
   IDs and produces a focused question.
2. The Workflow Coordinator moves the task to `requirement-clarification` with
   `CLARIFICATION_REQUIRED` evidence.
3. The workflow stops in `AWAITING_HUMAN`; agents cannot create an answer.
4. An authenticated human decision references the affected requirement revision
   and checksum.
5. The Coordinator returns the task to `requirement-analysis` with
   `CLARIFICATION_ANSWERED` evidence.
6. The Requirement Analyst creates a new revision, records impact, and reruns
   analysis and taxonomy placement.
7. Scenario generation remains unreachable until the new revision has no
   blocking ambiguity.
