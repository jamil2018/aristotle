import { access } from "node:fs/promises";
import path from "node:path";

export const requiredRepositoryEntries = [
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "playwright.config.ts",
  "factory.config.ts",
  ".env.example",
  ".gitignore",
  "agents/shared",
  "agents/roles",
  "agents/skills",
  "agents/workflows",
  "agents/providers/codex",
  "agents/providers/cursor",
  "agents/providers/claude-code",
  "requirements",
  "docs",
  "tests",
  "artifacts",
  "tasks/active",
  "tasks/awaiting-human",
  "tasks/completed",
  "factory-memory/runs",
  "factory-memory/knowledge",
  "factory-memory/proposals",
  "factory-memory/evaluations",
  "src",
  "templates",
  "examples",
  "docs-factory",
] as const;

export interface RepositoryHealth {
  readonly healthy: boolean;
  readonly missing: readonly string[];
}

export async function checkRepositoryHealth(
  repositoryRoot: string,
): Promise<RepositoryHealth> {
  const checks = await Promise.all(
    requiredRepositoryEntries.map(async (entry) => {
      try {
        await access(path.join(repositoryRoot, entry));
        return null;
      } catch {
        return entry;
      }
    }),
  );
  const missing = checks.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null,
  );

  return { healthy: missing.length === 0, missing };
}
