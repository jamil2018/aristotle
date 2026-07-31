import process from "node:process";

import {
  scanGeneratedTestOutputs,
  validateGeneratedTestArchitecture,
} from "./generated-tests.js";

const root = process.cwd();
const architecture = await validateGeneratedTestArchitecture(
  `${root}/tests/e2e`,
);
const secrets = await scanGeneratedTestOutputs(root);
if (!architecture.valid || secrets.matches.length > 0) {
  console.error(
    JSON.stringify({
      architectureViolations: architecture.violations,
      secretMatchFingerprints: secrets.matches,
    }),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Generated tests: ${String(architecture.files.length)} files, architecture valid, zero secret matches`,
  );
}
