export interface TaxonomyProposal {
  readonly proposedPath?: string;
  readonly alternatives: readonly string[];
  readonly requiresClarification: boolean;
  readonly rationale: string;
}

export function proposeTaxonomyPlacement(
  existingPaths: readonly string[],
  requirementTexts: readonly string[],
): TaxonomyProposal {
  const requirementTokens = tokens(requirementTexts.join(" "));
  const scored = existingPaths
    .map((path) => {
      validateTaxonomyPath(path);
      const score = [...tokens(path.replaceAll("/", " "))].filter((token) =>
        requirementTokens.has(token),
      ).length;
      return { path, score };
    })
    .sort((left, right) => right.score - left.score);
  const best = scored[0];
  const tied =
    best === undefined ||
    best.score === 0 ||
    scored.filter((candidate) => candidate.score === best.score).length > 1;
  if (tied) {
    return {
      alternatives: scored
        .filter((candidate) => candidate.score === best?.score)
        .map((candidate) => candidate.path),
      requiresClarification: true,
      rationale: "No unique existing taxonomy placement is supported.",
    };
  }
  return {
    proposedPath: best.path,
    alternatives: scored.slice(1, 3).map((candidate) => candidate.path),
    requiresClarification: false,
    rationale: `Matched ${String(best.score)} taxonomy token(s).`,
  };
}

export interface ExplorationPolicy {
  readonly authorized: boolean;
  readonly allowedOrigins: readonly string[];
  readonly startUrls: readonly string[];
  readonly maxPages: number;
}

export interface ExplorationEvidence {
  readonly url: string;
  readonly content: string;
  readonly classification: "OBSERVATION";
}

export async function exploreAllowedOrigin(
  policy: ExplorationPolicy,
  inspectPage: (url: string) => Promise<string>,
): Promise<readonly ExplorationEvidence[]> {
  if (!policy.authorized) {
    throw new Error("Browser exploration requires task-scoped authorization");
  }
  if (
    !Number.isSafeInteger(policy.maxPages) ||
    policy.maxPages < 1 ||
    policy.maxPages > 20
  ) {
    throw new Error("Browser exploration maxPages must be between 1 and 20");
  }
  const allowedOrigins = new Set(
    policy.allowedOrigins.map((origin) => validatedWebUrl(origin).origin),
  );
  const selectedUrls = policy.startUrls.slice(0, policy.maxPages);
  for (const url of selectedUrls) {
    if (!allowedOrigins.has(validatedWebUrl(url).origin)) {
      throw new Error(`Browser exploration URL is not allowlisted: ${url}`);
    }
  }
  const evidence: ExplorationEvidence[] = [];
  for (const url of selectedUrls) {
    evidence.push({
      url,
      content: await inspectPage(url),
      classification: "OBSERVATION",
    });
  }
  return evidence;
}

function validatedWebUrl(value: string): URL {
  const url = new URL(value);
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    throw new Error(`Browser exploration requires an HTTP(S) URL: ${value}`);
  }
  return url;
}

function validateTaxonomyPath(path: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
    throw new Error(`Invalid feature/subfeature taxonomy path: ${path}`);
  }
}

function tokens(text: string): Set<string> {
  const raw = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  const expanded = raw.flatMap((token) => [
    token,
    token.endsWith("s") ? token.slice(0, -1) : token,
  ]);
  return new Set(expanded);
}
