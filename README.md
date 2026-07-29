# Quality Agent Factory

Quality Agent Factory is a clone-ready, repository-resident workflow for turning
requirements into reviewed, traceable Playwright tests with coding agents. It is
designed for Codex, Cursor, and Claude Code. Versioned Markdown and JSON are the
source of truth; v1 has no initialization CLI or separate web application.

The factory enforces a sequence of requirement analysis, independent scenario
evaluation, human scenario approval, test implementation, failure
classification, final quality assessment, and final human review. It never
self-approves.

## Current status

Phase 1, repository foundation, is in progress. See
[`docs/plans/phased-implementation-plan.md`](docs/plans/phased-implementation-plan.md)
for the live progress tracker and
[`docs/plans/quality-agent-factory-development-plan.md`](docs/plans/quality-agent-factory-development-plan.md)
for the complete source plan.

## Prerequisites

- Node.js 22 LTS
- npm 10 or later
- Git

## Setup

```bash
npm ci
npx playwright install
cp .env.example .env
npm run check
```

Set `FACTORY_BASE_URL` and `FACTORY_ALLOWED_ORIGINS` to the target test
environment before running browser tests.

## Commands

| Command                    | Purpose                          |
| -------------------------- | -------------------------------- |
| `npm run health`           | Verify the clone-ready structure |
| `npm run typecheck`        | Check strict TypeScript          |
| `npm run lint`             | Check source and tests           |
| `npm run test:unit`        | Run unit tests                   |
| `npm run test:integration` | Run integration tests            |
| `npm run test:e2e`         | Run Playwright browser tests     |
| `npm run static:analysis`  | Audit changed code with Fallow   |
| `npm run build`            | Compile runtime TypeScript       |
| `npm run check`            | Run all required quality gates   |

## Safety defaults

- Production targets are read-only by default.
- Browser targets must be allowlisted.
- Application source is not modified by generated test workflows.
- Secrets, authentication state, evidence, and build output are ignored by Git.
- Human approvals are separate, exact-revision artifacts.
- Only a classified `SCRIPT_ERROR` may authorize automatic test repair.

Read [`AGENTS.md`](AGENTS.md) before using a coding agent in this repository.
