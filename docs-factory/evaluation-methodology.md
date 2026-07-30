# Evaluation methodology

The permanent benchmark is synthetic, sanitized, deterministic, and shared
across providers. A provider passes only when every case validates, expected
classifications and policy routes match, sensitive fixtures do not leak, and all
outputs retain traceability. Human correction rate is reported separately so
agent quality is not hidden by downstream review.

Unit tests verify contracts and metrics; deterministic integration tests verify
workflow boundaries; controlled Playwright tests verify the browser harness.
Real-provider benchmark observations must record provider version, runtime,
configuration, timestamps, and human corrections before they can supplement the
deterministic baseline.
