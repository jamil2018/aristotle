# Evaluate Test Scenarios

1. Use fresh evaluation context and load the exact approved requirements,
   scenario revision, projection-parity result, and checksum.
2. Reject scenario links to unknown or superseded requirements as `BLOCKED`.
3. Check applicable coverage, duplicate intent, observable expected results,
   permissions, state, data, preconditions, cleanup, feasibility, and
   unsupported assumptions.
4. Validate both requirement-to-scenario and scenario-to-requirement links.
5. Return `REVISE` with precise findings when the scenario set can be corrected
   without requirement clarification.
6. Return `BLOCKED` when requirements or authorization are insufficient.
7. Return `PASS` only when no material finding remains.
8. Never edit the scenario artifact or create a human decision.
