import type { ArtifactReference } from "../schemas/contracts.js";

export function sameArtifactReference(
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
