import { provenanceSchema } from "../schemas/contracts.js";
import { semanticChecksum } from "./artifact-lifecycle.js";

export interface ProvenanceInput {
  readonly createdAt?: Date;
  readonly gitCommit: string;
  readonly gitDirty: boolean;
  readonly nodeVersion?: string;
  readonly platform?: string;
  readonly architecture?: string;
  readonly provider: string;
  readonly configuration: unknown;
}

export function createProvenance(input: ProvenanceInput) {
  return provenanceSchema.parse({
    createdAt: (input.createdAt ?? new Date()).toISOString(),
    gitCommit: input.gitCommit,
    gitDirty: input.gitDirty,
    nodeVersion: input.nodeVersion ?? process.version,
    platform: `${input.platform ?? process.platform}-${input.architecture ?? process.arch}`,
    provider: input.provider,
    configurationChecksum: semanticChecksum(input.configuration),
  });
}
