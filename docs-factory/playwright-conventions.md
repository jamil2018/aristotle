# Playwright conventions

Generate TypeScript only from exact approved scenario revisions. Use relative
routes, accessible locators, web-first assertions, deterministic run-scoped
data, explicit cleanup, and configured browser projects. Do not use arbitrary
sleeps, brittle XPath, embedded credentials, shared mutable state, or
unregistered evidence.

Each test and result records exact requirement and scenario metadata. Failed
execution preserves evidence and waits for triage before test changes.
