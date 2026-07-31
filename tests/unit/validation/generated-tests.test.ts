import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateGeneratedTestArchitecture } from "../../../src/validation/generated-tests.js";

describe("generated-test architecture", () => {
  it("rejects reverse imports and configured file-size violations", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "factory-e2e-"));
    await mkdir(path.join(root, "pages", "authentication"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, "pages", "authentication", "login.ts"),
      'import "../../specs/authentication/login.js";\n',
    );
    const result = await validateGeneratedTestArchitecture(root, {
      maxFileLines: 1,
      maxSpecImports: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.violations.join("\n")).toMatch(/imports a spec/);
  });
});
