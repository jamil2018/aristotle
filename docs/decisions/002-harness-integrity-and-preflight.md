# ADR-002: Canonical harness integrity and fail-closed preflight

## Status

Accepted

## Date

2026-07-31

## Context

A bounded pilot revealed that independently valid factory components could still
produce unsafe outcomes when checksums, runtime paths, feasibility, and browser
evidence were not enforced as one pipeline. The pilot artifacts were permanently
removed. This decision contains no target URL, credential, captured evidence,
generated pilot test, or run output.

## Decision

1. Every authoritative contract is schema-parsed, canonically serialized, and
   semantically checksummed in that order.
2. Human approvals and manual results refer to exact revisions and checksums.
   Completion is derived from validated records, never caller-supplied flags.
3. Ad-hoc generated tests and evidence remain under ignored run storage.
   Promotion to tracked tests requires a distinct human publication record.
4. Scenario evaluation uses typed semantic domains, explicit feasibility, and
   deterministic quality findings before human review.
5. Playwright execution uses bounded typed actions, a fail-closed preflight, a
   short Chromium smoke, and then the registered three-browser matrix.

## Alternatives considered

- Keep loosely coupled checks and rely on review discipline. Rejected because
  stale approvals, path collisions, and incomplete evidence must fail in code.
- Permit generated tests directly under tracked end-to-end folders. Rejected
  because runtime output and durable published tests have different authority.
- Add arbitrary browser JavaScript for missing capabilities. Rejected because
  bounded typed Playwright primitives cover the approved need without widening
  execution authority.

## Consequences

- Callers must provide complete preflight context and exact manual-result
  records.
- Unsupported scenarios are classified before approval instead of becoming
  partial generated tests.
- Runtime artifacts remain disposable and excluded from source control.
- A new pilot remains a separately authorized activity and cannot reuse the
  deleted pilot state.
