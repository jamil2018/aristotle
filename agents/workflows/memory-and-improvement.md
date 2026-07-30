# Memory and Improvement Workflow

1. After final human review, the knowledge curator creates an immutable,
   sanitized run summary. Raw transcripts are excluded.
2. Corrections, triage outcomes, repairs, coverage gaps, flakiness, stale
   artifacts, and placement questions become scoped feedback records.
3. Candidate lessons reference exact run summaries and declare confidence and
   invalidation conditions.
4. A human knowledge reviewer approves or rejects the exact proposal revision.
   Approval does not authorize a policy change.
5. Future runs retrieve only approved, non-stale, exact-scope entries and
   disclose their advisory influence. Current requirements remain authoritative.
6. Three similar findings across separate tasks, one severe failure, or an
   explicit human request may trigger an improvement proposal.
7. A separate human policy reviewer decides whether the exact improvement
   proposal may proceed to validation.
8. Adoption requires passing regression cases and shadow evaluation. Failed
   validation rejects or rolls back the proposal using its recorded plan.
