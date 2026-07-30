# Automate Approved Scenarios

1. Validate the normalized requirements, scenario specification, evaluator
   result, and human review against their schemas and semantic checksums.
2. Stop unless the evaluator disposition is `PASS` and the human decision
   approves the exact scenario revision. Remove explicitly excluded scenarios.
3. Inspect the existing Playwright harness and convert only observable scenario
   actions into a typed automation plan.
4. Use relative routes, accessible locators, web-first assertions, environment
   references for secrets, deterministic run-scoped data, and registered
   cleanup.
5. Generate metadata that links the test to exact scenario and requirement
   revisions and checksums.
6. Execute configured browser projects and retain HTML plus machine-readable
   reports. Register only safe relative trace, screenshot, video, and report
   paths; never register authentication state.
7. Preserve failures without modifying test or application code until triage
   records a classification.
8. If a required action is unsupported, create a capability proposal. Apply the
   versioned classifier rather than making a subjective risk decision.
9. For `AUTO_APPROVED`, implement at most one capability per run, add contract,
   renderer, unit, and controlled browser coverage, then run all quality gates
   and register the extension. For `HUMAN_REVIEW_REQUIRED`, stop that scenario
   and continue unrelated work where safe.
10. The implementing agent cannot edit the automatic-extension policy in the
    same run or claim a disposition different from the classifier output.
