# Playwright conventions

Generate TypeScript only from exact approved scenario revisions. Use relative
routes, accessible locators, web-first assertions, deterministic run-scoped
data, explicit cleanup, and configured browser projects. Do not use arbitrary
sleeps, brittle XPath, embedded credentials, shared mutable state, or
unregistered evidence.

Each test and result records exact requirement and scenario metadata. Failed
execution preserves evidence and waits for triage before test changes.

Use the layer-first, taxonomy-mirrored structure under `tests/e2e`: specs,
pages, components, fixtures, data, support, and setup. Specs group coherent
behavior and session state; pages and components own stable accessible locators
and domain actions; fixtures own lifecycle; data is synthetic; credentials are
available only through the environment credential provider.

Generated tests must pass `npm run check:generated-tests` in a fresh
`playwright-quality-evaluator` context for their exact checksum before static
preflight or browser execution. Authentication runs progress through static
preflight, disposable Chromium credential smoke, Chromium scenarios, remaining
browsers, and only then policy-authorized affected reruns.
