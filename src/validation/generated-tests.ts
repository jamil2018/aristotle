import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { scanForSecrets } from "../optimization/pipeline.js";

export interface GeneratedTestLimits {
  readonly maxFileLines: number;
  readonly maxSpecImports: number;
}

const defaultGeneratedTestLimits: GeneratedTestLimits = {
  maxFileLines: 400,
  maxSpecImports: 12,
};

const layers = [
  "specs",
  "pages",
  "components",
  "fixtures",
  "data",
  "support",
  "setup",
] as const;

export async function validateGeneratedTestArchitecture(
  root: string,
  limits: GeneratedTestLimits = defaultGeneratedTestLimits,
) {
  const files = await collectFiles(root);
  const violations: string[] = [];
  for (const file of files.filter((entry) => entry.endsWith(".ts"))) {
    const content = await readFile(file, "utf8");
    const relative = path.relative(root, file);
    const layer = relative.split(path.sep)[0];
    if (!layers.includes(layer as (typeof layers)[number])) {
      violations.push(`${relative}: file is outside an approved E2E layer`);
    }
    const lines = content.split("\n").length;
    if (lines > limits.maxFileLines) {
      violations.push(`${relative}: ${String(lines)} lines exceeds limit`);
    }
    const imports = [
      ...content.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g),
    ].map((match) => match[1] ?? "");
    if (layer === "specs" && imports.length > limits.maxSpecImports) {
      violations.push(`${relative}: excessive imports`);
    }
    if (
      ["pages", "components", "data", "support"].includes(layer ?? "") &&
      imports.some((item) => /(?:^|\/)specs\//u.test(item))
    ) {
      violations.push(`${relative}: lower layer imports a spec`);
    }
    if (
      layer === "pages" &&
      imports.some((item) => item.includes("/fixtures/"))
    ) {
      violations.push(`${relative}: page imports a fixture`);
    }
  }
  return { valid: violations.length === 0, violations, files };
}

export async function scanGeneratedTestOutputs(repositoryRoot: string) {
  const roots = ["tests/e2e", "test-results", "playwright-report", "artifacts"];
  const paths = (
    await Promise.all(
      roots.map((entry) => collectFiles(path.join(repositoryRoot, entry))),
    )
  ).flat();
  const readable = await Promise.all(
    paths.map(async (file) => ({
      path: path.relative(repositoryRoot, file),
      content: await readFile(file, "utf8"),
    })),
  );
  return scanForSecrets(readable);
}

async function collectFiles(root: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(root, entry.name);
      return entry.isDirectory()
        ? collectFiles(target)
        : Promise.resolve([target]);
    }),
  );
  return nested.flat();
}
