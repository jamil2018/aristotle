# ADR-001: Use policy-driven autonomy for routine factory decisions

## Status

Accepted

## Date

2026-07-30

## Context

The Quality Agent Factory must produce traceable artifacts at scale. Requiring a
human decision for every missing test primitive would turn routine factory
operation into a manually supervised custom-agent loop. Allowing an agent to
decide its own authority without a stable policy would create the opposite
problem: the implementing agent could expand the executable-code boundary that
is meant to constrain it.

The repository therefore needs a durable distinction between:

- Human authority over intent, scope, material ambiguity, external impact,
  security policy, and final acceptance.
- Agent autonomy over bounded, reversible, deterministic implementation choices
  that are already permitted by versioned policy.

## Decision

Use a deterministic, versioned classifier for Playwright capability extensions.
The Playwright Test Engineer may automatically implement one missing capability
per run only when it:

- Is a locator-based interaction or assertion.
- Reuses an existing safe locator contract.
- Has a deterministic renderer.
- Requires no arbitrary code, external origin, browser permission, filesystem
  access, authentication change, destructive write, or dependency change.
- Produces a permanent capability-extension record.
- Adds focused contract, renderer, and controlled-browser tests.
- Passes the complete repository quality gates.

The classifier computes the disposition. An agent-provided requested disposition
is non-authoritative. The agent may apply the policy but may not edit or weaken
the policy in the same run.

All other capability proposals return `HUMAN_REVIEW_REQUIRED`. Their scenarios
pause, while unrelated authorized work continues where safe.

## Existing human-decision audit

| Decision                                             | Current handling                          | Result | Rationale                                                          |
| ---------------------------------------------------- | ----------------------------------------- | ------ | ------------------------------------------------------------------ |
| Requirement clarification                            | Human answer, batch reconciliation        | Keep   | Establishes intended product behavior                              |
| Scenario approval and exclusions                     | Human review of one complete revision     | Keep   | Establishes authorized coverage; already batch-oriented            |
| Browser exploration origin and scope                 | Task-scoped authorization                 | Keep   | Grants access to an external target                                |
| Production writes                                    | Task-scoped human authorization           | Keep   | Externally consequential and potentially destructive               |
| Final package acceptance                             | Final human review                        | Keep   | Release and residual-risk authority                                |
| Scenario evaluation                                  | Independent agent                         | Keep   | Already automatic and distinct from generation                     |
| Failure classification                               | Failure-triage agent                      | Keep   | Already automatic; only classification controls subsequent routing |
| Test repair after `SCRIPT_ERROR`                     | Agent repair with bounded retries         | Keep   | Already policy-driven and does not require a human decision        |
| Taxonomy placement with a unique supported candidate | Automatic proposal                        | Keep   | Already deterministic                                              |
| Materially ambiguous taxonomy placement              | Human clarification                       | Keep   | Can alter ownership and downstream artifact placement              |
| Missing low-risk Playwright primitive                | Deterministic classifier and audit record | Change | Routine factory mechanics should not require human approval        |

This audit found no other routine implementation decision that currently
requires individual human approval. The remaining human gates establish business
intent, external authority, or acceptance rather than supervising minor agent
mechanics.

## Alternatives considered

### Require approval for every new action

Rejected because it creates excessive operational latency and prevents the
factory from scaling routine artifact generation.

### Let the implementing agent decide without policy

Rejected because subjective self-authorization is not an enforceable security
boundary and would make audit results inconsistent.

### Allow arbitrary Playwright source generation

Rejected because it bypasses typed validation and could introduce arbitrary
execution, secret access, unsafe origins, and unreliable waiting behavior.

## Consequences

- Common interaction and assertion primitives can be added and exercised without
  a human round trip.
- Sensitive capability changes remain explicit human decisions.
- Every automatic extension is attributable, reproducible, and reviewable.
- Policy evolution remains a deliberate repository change rather than an
  implicit decision made during test generation.
- Future phases should apply the same intent-versus-mechanics test when adding
  gates.
