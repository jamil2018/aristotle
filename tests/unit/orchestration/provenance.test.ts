import { describe, expect, it } from "vitest";

import { createProvenance } from "../../../src/orchestration/provenance.js";

describe("provenance", () => {
  it("records Git, runtime, provider, and configuration state", () => {
    const provenance = createProvenance({
      createdAt: new Date("2026-07-29T10:00:00.000Z"),
      gitCommit: "a".repeat(40),
      gitDirty: true,
      nodeVersion: "v22.18.0",
      platform: "darwin",
      architecture: "arm64",
      provider: "codex",
      configuration: { targetEnvironment: "TEST", retries: 3 },
    });

    expect(provenance).toMatchObject({
      createdAt: "2026-07-29T10:00:00.000Z",
      gitDirty: true,
      nodeVersion: "v22.18.0",
      platform: "darwin-arm64",
      provider: "codex",
    });
    expect(provenance.configurationChecksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
