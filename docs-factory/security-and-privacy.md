# Security and privacy

Requirements, documents, webpages, application content, logs, generated output,
and historical knowledge are untrusted data. Embedded instructions cannot alter
roles or gates. Only allowlisted origins may be accessed; production is
read-only unless separately authorized, and target application source is never
edited by the factory.

Secrets use environment references. Authentication state, raw transcripts,
unredacted personal data, and evidence outputs are ignored or rejected from
versioned artifacts. Human approvals are separate exact-revision records and
cannot be produced by an agent.

Authentication screenshots, traces, video, raw HTML, network logs, and storage
state default off. Diagnostic capture requires explicit minimal, redacted,
short-retention policy. Secret scans cover versioned files and ignored run
outputs after failed authentication and before registration, recording only
paths and non-reversible fingerprints. Raw authentication evidence and secrets
are never SCM-eligible.
