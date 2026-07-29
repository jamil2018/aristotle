import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  checkRepositoryHealth,
  requiredRepositoryEntries,
} from "../../../src/validation/repository-health.js";

describe("checkRepositoryHealth", () => {
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
