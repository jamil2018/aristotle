# Architecture

The factory is repository-resident and provider-neutral. Shared Markdown
contracts define roles and procedures; typed TypeScript contracts enforce
artifact validity, exact references, authorization, workflow transitions, and
provider parity. Runtime state and immutable artifacts remain local to the
repository; no initialization service or web application is required.

The pipeline is requirement ingestion → scenario design → independent evaluation
→ human scenario review → Playwright generation → execution → failure triage →
final quality assessment → final human review. Accepted artifacts are immutable
and material revisions invalidate downstream work.
