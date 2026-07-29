import { createHash } from "node:crypto";

import { artifactRegistry } from "./artifact-registry.js";
import {
  artifactManifestSchema,
  type Actor,
  type ArtifactManifest,
  type ArtifactReference,
} from "../schemas/contracts.js";

export function semanticChecksum(content: unknown): string {
  return createHash("sha256").update(canonicalJson(content)).digest("hex");
}

export interface AcceptArtifactInput {
  readonly actor: Actor;
  readonly content: unknown;
  readonly acceptedAt: string;
}

export function acceptArtifact(
  manifestInput: ArtifactManifest,
  input: AcceptArtifactInput,
): ArtifactManifest {
  const manifest = artifactManifestSchema.parse(manifestInput);
  if (manifest.status === "ACCEPTED") {
    throw new Error("Accepted artifacts are immutable");
  }

  const definition = artifactRegistry[manifest.artifactType];
  if (
    manifest.producingRole !== definition.producingRole ||
    manifest.workflowStage !== definition.workflowStage
  ) {
    throw new Error("Artifact does not match its registered contract");
  }

  const humanProduced =
    definition.producingRole === "human-scenario-reviewer" ||
    definition.producingRole === "final-human-reviewer";
  if (humanProduced) {
    if (input.actor.actorType !== "HUMAN") {
      throw new Error("Human review artifacts require a human actor");
    }
  } else if (
    input.actor.actorType !== "AGENT" ||
    input.actor.actorId !== definition.producingRole
  ) {
    throw new Error("Actor is not the registered producing role");
  }

  return artifactManifestSchema.parse({
    ...manifest,
    status: "ACCEPTED",
    semanticChecksum: semanticChecksum(input.content),
    acceptedAt: input.acceptedAt,
  });
}

export function createArtifactRevision(
  acceptedInput: ArtifactManifest,
  path: string,
  provenance: ArtifactManifest["provenance"],
): ArtifactManifest {
  const accepted = artifactManifestSchema.parse(acceptedInput);
  if (accepted.status !== "ACCEPTED") {
    throw new Error("Only an accepted artifact can be revised");
  }

  return artifactManifestSchema.parse({
    artifactType: accepted.artifactType,
    schemaVersion: accepted.schemaVersion,
    producingRole: accepted.producingRole,
    workflowStage: accepted.workflowStage,
    revision: accepted.revision + 1,
    provenance,
    references: accepted.references,
    artifactId: accepted.artifactId,
    taskId: accepted.taskId,
    path,
    status: "DRAFT",
  });
}

export function invalidateDownstreamArtifacts(
  changed: ArtifactReference,
  artifacts: readonly ArtifactManifest[],
): ArtifactManifest[] {
  return artifacts.map((artifactInput) => {
    const artifact = artifactManifestSchema.parse(artifactInput);
    const dependsOnChangedRevision = artifact.references.some((reference) =>
      sameReference(reference, changed),
    );
    if (!dependsOnChangedRevision) return artifact;
    return artifactManifestSchema.parse({ ...artifact, status: "STALE" });
  });
}

function sameReference(
  left: ArtifactReference,
  right: ArtifactReference,
): boolean {
  return (
    left.artifactId === right.artifactId &&
    left.artifactType === right.artifactType &&
    left.revision === right.revision &&
    left.semanticChecksum === right.semanticChecksum
  );
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJson(value, new WeakSet()));
}

function normalizeJson(
  value: unknown,
  ancestors: WeakSet<object>,
):
  | null
  | boolean
  | number
  | string
  | readonly unknown[]
  | Record<string, unknown> {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Content must be valid JSON");
    return value;
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new Error("Content must not be cyclic");
    ancestors.add(value);
    const normalized = value.map((item) => normalizeJson(item, ancestors));
    ancestors.delete(value);
    return normalized;
  }
  if (typeof value === "object") {
    if (ancestors.has(value)) throw new Error("Content must not be cyclic");
    ancestors.add(value);
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (item === undefined) {
        throw new Error("Content must not contain undefined values");
      }
      normalized[key] = normalizeJson(item, ancestors);
    }
    ancestors.delete(value);
    return normalized;
  }
  throw new Error("Content must be valid JSON");
}
