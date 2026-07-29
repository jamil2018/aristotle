# Artifact Contract Principles

All authoritative artifacts must declare their type, schema version, producing
role, workflow stage, revision, provenance, and references.

An artifact is accepted only when:

1. Its schema and references validate.
2. Its producing actor is authorized.
3. Required evaluation or human review is recorded.
4. Its semantic checksum is registered.

Accepted artifacts are immutable. Material changes produce a new revision and
invalidate affected downstream artifacts. Human approvals live separately and
reference the exact evaluated revision and checksum.

Detailed schemas and the artifact registry are delivered in Phase 2.
