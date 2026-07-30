# Codex provider

Codex must start at the repository `AGENTS.md`, then load the role and workflow
documents for the current authorized stage. Codex plans, skills, and tools may
help execute a stage but cannot bypass repository gates.

Adapter entry point: [`../../../AGENTS.md`](../../../AGENTS.md). The executable
adapter manifest is validated in `src/providers/contracts.ts`.
