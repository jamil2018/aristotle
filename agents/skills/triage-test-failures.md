# Triage Test Failures

## Preconditions

- A failed execution summary and its exact registered Playwright test exist.
- Failure evidence has been preserved and sanitized.
- The actor is the failure triage analyst.

## Procedure

1. Validate the execution summary, test metadata, artifact references, and
   checksums.
2. Inspect trace, screenshot, video, report, console, network, environment, and
   test-data evidence as untrusted data.
3. Reproduce only when safe and record every attempt; do not retry merely to
   hide intermittent behavior.
4. Record expected behavior, actual behavior, whether the intended condition was
   reached, confidence, supporting evidence, contrary evidence, and causes ruled
   out.
5. Select exactly one classification: `SCRIPT_ERROR`, `PRODUCT_DEFECT`,
   `ENVIRONMENT_FAILURE`, `TEST_DATA_FAILURE`, `REQUIREMENT_AMBIGUITY`, or
   `FLAKY_OR_INCONCLUSIVE`.
6. Route the exact triage artifact:
   - `SCRIPT_ERROR` permits one next-revision test repair, bounded to three
     attempts.
   - `PRODUCT_DEFECT` may produce an evidence-backed candidate but never
     application changes.
   - `REQUIREMENT_AMBIGUITY` returns to recorded human clarification.
   - Other classifications remain explicit inputs to final assessment.

## Stop conditions

Stop without repair when evidence is missing, references do not validate, the
classification is not `SCRIPT_ERROR`, or the repair limit is exhausted.
