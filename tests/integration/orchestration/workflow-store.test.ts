import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  WorkflowStore,
  acquireRunLock,
} from "../../../src/orchestration/workflow-store.js";
import { createWorkflow } from "../../../src/orchestration/workflow.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("workflow persistence", () => {
  it("atomically saves and resumes a validated workflow", async () => {
    const root = await temporaryDirectory();
    const store = new WorkflowStore(root);
    const workflow = sampleWorkflow();

    await store.save(workflow);

    await expect(
      store.load(workflow.taskId, workflow.workflowId),
    ).resolves.toEqual(workflow);
    expect(
      (await readdir(root)).some((file) => file.includes(".partial-")),
    ).toBe(false);
  });

  it("rejects stale writes using the expected revision", async () => {
    const root = await temporaryDirectory();
    const store = new WorkflowStore(root);
    const workflow = sampleWorkflow();
    await store.save(workflow);

    await expect(store.save(workflow, 0)).rejects.toThrow(/revision conflict/);
  });

  it("recovers the highest valid partial output after interruption", async () => {
    const root = await temporaryDirectory();
    const store = new WorkflowStore(root);
    const workflow = sampleWorkflow();
    const partial = path.join(
      root,
      `${workflow.taskId}.${workflow.workflowId}.json.partial-recovery`,
    );
    await writeFile(partial, `${JSON.stringify(workflow)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });

    await expect(
      store.recover(workflow.taskId, workflow.workflowId),
    ).resolves.toEqual(workflow);
    await expect(
      store.load(workflow.taskId, workflow.workflowId),
    ).resolves.toEqual(workflow);
  });

  it("prevents concurrent modification of the same run", async () => {
    const root = await temporaryDirectory();
    const release = await acquireRunLock(root, "run-001");

    await expect(acquireRunLock(root, "run-001")).rejects.toThrow(
      /already locked/,
    );
    await release();
    const releaseAgain = await acquireRunLock(root, "run-001");
    await releaseAgain();
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "aristotle-workflow-"));
  temporaryDirectories.push(directory);
  return directory;
}

function sampleWorkflow() {
  return createWorkflow({
    workflowId: "workflow-001",
    taskId: "task-001",
    provenance: {
      createdAt: "2026-07-29T10:00:00.000Z",
      gitCommit: "a".repeat(40),
      gitDirty: false,
      nodeVersion: "v22.18.0",
      platform: "darwin-arm64",
      provider: "codex",
      configurationChecksum: "b".repeat(64),
    },
  });
}
