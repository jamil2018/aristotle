# Failure Recovery Workflow

1. The Playwright test engineer registers the exact execution summary.
2. A passed execution enters final quality assessment.
3. A failed execution enters failure triage unchanged with preserved evidence.
4. The failure triage analyst records one exact classification artifact.
5. Only `SCRIPT_ERROR` may enter test repair. The Playwright engineer creates
   the next test revision, preserves the prior revision, and reruns it. No more
   than three repairs are allowed for one failure.
6. `REQUIREMENT_AMBIGUITY` returns to human clarification.
7. A sufficiently evidenced `PRODUCT_DEFECT` may create a defect candidate;
   target application source remains read-only.
8. Environment, data, ambiguity, and inconclusive outcomes remain visible as
   blockers or residual risk.
9. The final quality assessor checks exact artifacts and complete
   requirement-to-result traceability.
10. Only `READY_FOR_HUMAN_REVIEW` opens final human review. The factory stops
    there and waits for an actual human disposition.
