import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
  ".prettierignore",
  ".githooks/pre-commit",
  ".cursor/rules/graphify.mdc",
  ".cursor/rules/factory.mdc",
  ".github/workflows/quality.yml",
  "CLAUDE.md",
  "agents/shared",
  "agents/roles",
  "agents/roles/knowledge-curator.md",
  "agents/roles/workflow-improvement-analyst.md",
  "agents/skills",
  "agents/skills/curate-project-knowledge.md",
  "agents/skills/use-knowledge-graph.md",
  "agents/workflows",
  "agents/workflows/memory-and-improvement.md",
  "agents/providers/codex",
  "agents/providers/cursor",
  "agents/providers/claude-code",
  "docs-factory/architecture.md",
  "docs-factory/workflow.md",
  "docs-factory/security-and-privacy.md",
  "docs-factory/failure-triage.md",
  "docs-factory/memory-model.md",
  "docs-factory/provider-portability.md",
  "docs-factory/troubleshooting.md",
  "docs-factory/evaluation-methodology.md",
  "docs-factory/playwright-conventions.md",
  "examples/authentication",
  "examples/sample-application",
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
  "graphify-out/GRAPH_REPORT.md",
  "graphify-out/graph.html",
  "graphify-out/graph.json",
] as const;

export interface RepositoryHealth {
  readonly healthy: boolean;
  readonly missing: readonly string[];
  readonly hygieneViolations: readonly string[];
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
  const hygieneViolations =
    await findRepositoryHygieneViolations(repositoryRoot);

  return {
    healthy: missing.length === 0 && hygieneViolations.length === 0,
    missing,
    hygieneViolations,
  };
}

async function findRepositoryHygieneViolations(
  repositoryRoot: string,
): Promise<readonly string[]> {
  const violations: string[] = [];
  try {
    const ignore = await readFile(
      path.join(repositoryRoot, ".gitignore"),
      "utf8",
    );
    for (const rule of [
      "artifacts/**",
      "tests/e2e/generated/",
      "tests/e2e/pilot/",
      "src/generated/",
      "src/pilot/",
    ]) {
      if (!ignore.split(/\r?\n/).includes(rule)) {
        violations.push(`Missing runtime ignore rule: ${rule}`);
      }
    }
  } catch {
    return violations;
  }

  try {
    const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    const unsafe = stdout
      .split("\0")
      .filter(Boolean)
      .filter((file) =>
        /^(?:artifacts\/runs\/|src\/(?:generated|pilot)\/|tests\/e2e\/(?:generated|pilot)\/)/.test(
          file,
        ),
      );
    violations.push(
      ...unsafe.map((file) => `Tracked runtime artifact: ${file}`),
    );
  } catch {
    try {
      await access(path.join(repositoryRoot, ".git"));
      violations.push("Unable to verify tracked runtime artifacts with Git");
    } catch {
      // A synthetic health fixture may intentionally not be a Git checkout.
    }
  }
  return violations;
}
