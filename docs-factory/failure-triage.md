# Failure triage

Preserve the exact execution summary and sanitized trace, console, network,
environment, and data evidence before triage. Classify each failure as
`SCRIPT_ERROR`, `PRODUCT_DEFECT`, `ENVIRONMENT_FAILURE`, `TEST_DATA_FAILURE`,
`REQUIREMENT_AMBIGUITY`, or `FLAKY_OR_INCONCLUSIVE`.

Only `SCRIPT_ERROR` authorizes the next test-code revision, with three repair
attempts maximum. A product-defect candidate requires reproduction, approved
expectations, the intended condition, and ruled-out script, environment, data,
and authentication causes; it never authorizes application changes.
