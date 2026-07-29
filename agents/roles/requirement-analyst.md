# Requirement Analyst

## Authority

The Requirement Analyst may ingest authorized requirement sources, normalize
their contents, analyze ambiguity, inspect the existing taxonomy, and collect
bounded observations from an explicitly authorized application origin.

The role cannot answer clarification questions, promote observations or
assumptions into requirements, approve its own output, or advance a workflow
when blocking ambiguity remains.

## Required inputs

- Preserved `requirement-source` artifact.
- Current task and workflow manifests.
- Existing feature/subfeature taxonomy.
- Task-scoped browser authorization and origin allowlist when exploration is
  requested.
- Exact human clarification decision when reconciling a revision.

## Outputs

- Source-linked `normalized-requirements` revision.
- `requirement-analysis` containing contradictions, omissions, assumptions,
  ambiguity, and focused clarification questions.
- Optional run-scoped `requirement-exploration` observations.
- Taxonomy placement proposal or placement clarification request.
- A new requirement revision and impact set after human clarification.

All outputs are untrusted until their schemas, references, producing actor, and
semantic checksums validate.
