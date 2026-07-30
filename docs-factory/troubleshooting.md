# Troubleshooting

- A workflow will not advance: inspect blocking ambiguity, actor authorization,
  exact artifact revisions, semantic checksums, and stale downstream records.
- Test generation is rejected: confirm evaluator `PASS` and human approval
  reference the current scenario revision and checksum.
- Repair is rejected: preserve evidence and obtain an exact `SCRIPT_ERROR`
  triage record; other classifications do not authorize repair.
- Browser setup fails: verify Node 22, `npx playwright install`, base URL,
  allowed origins, and environment-only credentials.
- Health fails: run `npm run health` and restore the reported versioned entry.
- Provider parity fails: compare its entry point and adapter manifest with the
  complete shared role, skill, and boundary sets.
