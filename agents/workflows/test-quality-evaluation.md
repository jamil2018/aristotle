# Test quality evaluation workflow

1. Playwright implementation emits an exact test checksum.
2. The coordinator creates a bounded handoff to a fresh
   `playwright-quality-evaluator` context.
3. The evaluator runs focused quality checks and emits `generated-test-quality`.
4. `REVISE` returns to implementation. A material edit invalidates the result.
5. Exact-checksum `PASS` permits authentication static preflight.
6. Progressive execution is static preflight, disposable Chromium credential
   smoke, Chromium scenarios, remaining browsers, then policy-authorized
   affected reruns.
7. Failures are classified before expansion or repair. Only `SCRIPT_ERROR`
   permits bounded test-code repair.
