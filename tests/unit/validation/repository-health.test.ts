import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  checkRepositoryHealth,
  requiredRepositoryEntries,
} from "../../../src/validation/repository-health.js";

describe("checkRepositoryHealth", () => {
  it("requires the versioned commit gate and knowledge graph", () => {
    expect(requiredRepositoryEntries).toEqual(
      expect.arrayContaining([
        ".githooks/pre-commit",
        ".cursor/rules/graphify.mdc",
        "agents/skills/use-knowledge-graph.md",
        "agents/skills/curate-project-knowledge.md",
        "agents/roles/knowledge-curator.md",
        "agents/roles/workflow-improvement-analyst.md",
        "agents/workflows/memory-and-improvement.md",
        "graphify-out/GRAPH_REPORT.md",
        "graphify-out/graph.html",
        "graphify-out/graph.json",
      ]),
    );
  });

  it("reports missing repository entries", async () => {
    const root = path.join(
      process.env["TMPDIR"] ?? "/tmp",
      `quality-agent-factory-health-${crypto.randomUUID()}`,
    );
    await mkdir(root, { recursive: true });

    const health = await checkRepositoryHealth(root);

    expect(health.healthy).toBe(false);
    expect(health.missing).toEqual(requiredRepositoryEntries);
  });

  it("passes when all required repository entries exist", async () => {
    const root = path.join(
      process.env["TMPDIR"] ?? "/tmp",
      `quality-agent-factory-health-${crypto.randomUUID()}`,
    );
    await Promise.all(
      requiredRepositoryEntries.map(async (entry) => {
        const entryPath = path.join(root, entry);
        if (path.extname(entry)) {
          await mkdir(path.dirname(entryPath), { recursive: true });
          await writeFile(entryPath, "");
        } else {
          await mkdir(entryPath, { recursive: true });
        }
      }),
    );

    await expect(checkRepositoryHealth(root)).resolves.toEqual({
      healthy: true,
      missing: [],
    });
  });
});
