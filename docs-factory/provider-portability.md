# Provider portability

Codex uses `AGENTS.md`, Cursor uses `.cursor/rules/factory.mdc`, and Claude Code
uses `CLAUDE.md`. Each entry point delegates to the same versioned roles,
skills, workflows, and boundaries. `src/providers/contracts.ts` defines the
executable adapter manifests; provider contract tests reject missing contracts
or weakened gates.

The permanent sanitized benchmark covers ambiguity, scenario quality, failure
classification, prompt injection, leakage, revisions, and resumption. Reports
measure acceptance, classification accuracy, policy compliance, human
correction, leakage, and traceability without optimizing only for pass rate.
