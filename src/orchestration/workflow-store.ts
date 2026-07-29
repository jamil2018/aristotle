import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  workflowManifestSchema,
  type WorkflowManifest,
} from "../schemas/contracts.js";

type ReleaseLock = () => Promise<void>;

export class WorkflowStore {
  public constructor(private readonly root: string) {}

  public async save(
    workflowInput: WorkflowManifest,
    expectedRevision?: number,
  ): Promise<void> {
    const workflow = workflowManifestSchema.parse(workflowInput);
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const release = await acquireRunLock(
      this.root,
      `${workflow.taskId}-${workflow.workflowId}`,
    );
    try {
      if (expectedRevision !== undefined) {
        const current = await this.load(workflow.taskId, workflow.workflowId);
        const currentRevision = current?.revision ?? 0;
        if (currentRevision !== expectedRevision) {
          throw new Error(
            `Workflow revision conflict: expected ${String(expectedRevision)}, found ${String(currentRevision)}`,
          );
        }
      }
      const destination = this.workflowPath(
        workflow.taskId,
        workflow.workflowId,
      );
      const partial = `${destination}.partial-${randomUUID()}`;
      const handle = await open(partial, "wx", 0o600);
      try {
        await handle.writeFile(
          `${JSON.stringify(workflow, null, 2)}\n`,
          "utf8",
        );
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(partial, destination);
    } finally {
      await release();
    }
  }

  public async load(
    taskId: string,
    workflowId: string,
  ): Promise<WorkflowManifest | null> {
    const file = this.workflowPath(taskId, workflowId);
    try {
      return workflowManifestSchema.parse(
        JSON.parse(await readFile(file, "utf8")),
      );
    } catch (error: unknown) {
      if (isErrorCode(error, "ENOENT")) return null;
      throw error;
    }
  }

  public async recover(
    taskId: string,
    workflowId: string,
  ): Promise<WorkflowManifest | null> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const existing = await this.load(taskId, workflowId);
    if (existing !== null) return existing;

    const destination = this.workflowPath(taskId, workflowId);
    const prefix = `${path.basename(destination)}.partial-`;
    const candidates = (await readdir(this.root))
      .filter((file) => file.startsWith(prefix))
      .map((file) => path.join(this.root, file));
    let recovered:
      | { readonly path: string; readonly workflow: WorkflowManifest }
      | undefined;
    for (const candidate of candidates) {
      try {
        const workflow = workflowManifestSchema.parse(
          JSON.parse(await readFile(candidate, "utf8")),
        );
        if (
          workflow.taskId === taskId &&
          workflow.workflowId === workflowId &&
          (recovered === undefined ||
            workflow.revision > recovered.workflow.revision)
        ) {
          recovered = { path: candidate, workflow };
        }
      } catch {
        // Invalid partial outputs are preserved for inspection and never resumed.
      }
    }
    if (recovered === undefined) return null;

    const release = await acquireRunLock(this.root, `${taskId}-${workflowId}`);
    try {
      await rename(recovered.path, destination);
    } finally {
      await release();
    }
    return recovered.workflow;
  }

  private workflowPath(taskId: string, workflowId: string): string {
    assertIdentifier(taskId);
    assertIdentifier(workflowId);
    return path.join(this.root, `${taskId}.${workflowId}.json`);
  }
}

export async function acquireRunLock(
  root: string,
  runId: string,
): Promise<ReleaseLock> {
  assertIdentifier(runId);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const lockPath = path.join(root, `${runId}.lock`);
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
  } catch (error: unknown) {
    if (isErrorCode(error, "EEXIST")) {
      throw new Error(`Run ${runId} is already locked`, { cause: error });
    }
    throw error;
  }
  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })}\n`,
      "utf8",
    );
  } catch (error: unknown) {
    await handle.close();
    await unlink(lockPath).catch(() => undefined);
    throw error;
  }

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await handle.close();
    await unlink(lockPath).catch((error: unknown) => {
      if (!isErrorCode(error, "ENOENT")) throw error;
    });
  };
}

function assertIdentifier(value: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`Unsafe identifier: ${value}`);
  }
}

function isErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}
