import process from "node:process";

import { checkRepositoryHealth } from "./repository-health.js";

const health = await checkRepositoryHealth(process.cwd());

if (!health.healthy) {
  console.error("Repository health check failed.");
  for (const entry of health.missing) {
    console.error(`- Missing: ${entry}`);
  }
  process.exitCode = 1;
} else {
  console.log("Repository health check passed.");
}
