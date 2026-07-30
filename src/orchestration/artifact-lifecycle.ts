import { createHash } from "node:crypto";

import { sameArtifactReference } from "./artifact-reference.js";
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
  readonly availableArtifacts?: readonly ArtifactManifest[];
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

  const humanProduced = definition.producingRole.startsWith("human-");
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
  validateArtifactReferences(
    manifest,
    input.availableArtifacts ?? [],
    definition.requiredReferences,
  );

  return artifactManifestSchema.parse({
    ...manifest,
    status: "ACCEPTED",
    semanticChecksum: semanticChecksum(input.content),
    acceptedAt: input.acceptedAt,
  });
}

function validateArtifactReferences(
  manifest: ArtifactManifest,
  availableArtifacts: readonly ArtifactManifest[],
  requiredTypes: readonly ArtifactManifest["artifactType"][] = [],
): void {
  const acceptedByReference = new Set(
    availableArtifacts
      .map((artifact) => artifactManifestSchema.parse(artifact))
      .filter(
        (
          artifact,
        ): artifact is ArtifactManifest & {
          semanticChecksum: string;
        } =>
          artifact.status === "ACCEPTED" &&
          artifact.semanticChecksum !== undefined,
      )
      .map((artifact) =>
        [
          artifact.artifactId,
          artifact.artifactType,
          artifact.revision,
          artifact.semanticChecksum,
        ].join(":"),
      ),
  );

  for (const reference of manifest.references) {
    const key = [
      reference.artifactId,
      reference.artifactType,
      reference.revision,
      reference.semanticChecksum,
    ].join(":");
    if (!acceptedByReference.has(key)) {
      throw new Error(
        `Artifact reference ${reference.artifactId} does not resolve to an exact accepted revision`,
      );
    }
  }
  for (const requiredType of requiredTypes) {
    if (
      !manifest.references.some(
        (reference) => reference.artifactType === requiredType,
      )
    ) {
      throw new Error(`Artifact requires a ${requiredType} reference`);
    }
  }
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
      sameArtifactReference(reference, changed),
    );
    if (!dependsOnChangedRevision) return artifact;
    return artifactManifestSchema.parse({ ...artifact, status: "STALE" });
  });
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJson(value, new WeakSet()));
}

type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

function normalizeJson(value: unknown, ancestors: WeakSet<object>): JsonValue {
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
  if (Array.isArray(value)) return normalizeArray(value, ancestors);
  if (typeof value === "object") return normalizeObject(value, ancestors);
  throw new Error("Content must be valid JSON");
}

function normalizeArray(
  value: readonly unknown[],
  ancestors: WeakSet<object>,
): readonly JsonValue[] {
  assertNotCyclic(value, ancestors);
  const normalized = value.map((item) => normalizeJson(item, ancestors));
  ancestors.delete(value);
  return normalized;
}

function normalizeObject(
  value: object,
  ancestors: WeakSet<object>,
): Readonly<Record<string, JsonValue>> {
  assertNotCyclic(value, ancestors);
  const normalized: Record<string, JsonValue> = {};
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

function assertNotCyclic(value: object, ancestors: WeakSet<object>): void {
  if (ancestors.has(value)) throw new Error("Content must not be cyclic");
  ancestors.add(value);
}
