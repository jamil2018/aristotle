import { z } from "zod";

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const scenarioIdSchema = z.string().regex(/^TS-[A-Z0-9]+-[A-F0-9]{10}$/);
const requirementIdSchema = z.string().regex(/^req-[a-z0-9-]+$/);

export const playwrightTestMetadataSchema = z.object({
  schemaVersion: z.literal(1),
  testId: identifierSchema,
  scenarioId: scenarioIdSchema,
  scenarioRevision: z.number().int().positive(),
  scenarioChecksum: checksumSchema,
  requirementRevision: z.number().int().positive(),
  requirementChecksum: checksumSchema,
  requirementIds: z.array(requirementIdSchema).min(1),
});

const locatorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ROLE"),
    role: z.enum([
      "button",
      "checkbox",
      "dialog",
      "heading",
      "link",
      "listitem",
      "textbox",
    ]),
    name: z.string().min(1),
  }),
  z.object({ kind: z.literal("LABEL"), value: z.string().min(1) }),
  z.object({ kind: z.literal("PLACEHOLDER"), value: z.string().min(1) }),
  z.object({ kind: z.literal("TEST_ID"), value: z.string().min(1) }),
]);

const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("FILL"),
    locator: locatorSchema,
    valueEnvironmentVariable: z
      .string({ error: "Values must use an environment variable" })
      .regex(/^[A-Z][A-Z0-9_]*$/, "Values must use an environment variable"),
  }),
  z.object({ kind: z.literal("CLICK"), locator: locatorSchema }),
  z.object({ kind: z.literal("CHECK"), locator: locatorSchema }),
  z.object({ kind: z.literal("UNCHECK"), locator: locatorSchema }),
  z.object({
    kind: z.literal("SELECT_OPTION"),
    locator: locatorSchema,
    value: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("PRESS_KEY"),
    locator: locatorSchema,
    key: z.enum([
      "Enter",
      "Escape",
      "Tab",
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Space",
    ]),
  }),
  z.object({
    kind: z.literal("EXPECT_VISIBLE"),
    locator: locatorSchema,
  }),
  z.object({
    kind: z.literal("EXPECT_ENABLED"),
    locator: locatorSchema,
  }),
  z.object({
    kind: z.literal("EXPECT_CHECKED"),
    locator: locatorSchema,
  }),
  z.object({
    kind: z.literal("EXPECT_TEXT"),
    locator: locatorSchema,
    text: z.string().min(1),
  }),
  z.object({
    kind: z.literal("EXPECT_VALUE"),
    locator: locatorSchema,
    value: z.string().max(200),
  }),
  z.object({
    kind: z.literal("EXPECT_COUNT"),
    locator: locatorSchema,
    count: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("EXPECT_URL"),
    path: z.string().startsWith("/"),
  }),
]);

export const automationPlanSchema = z.object({
  route: z
    .string()
    .startsWith("/", "Automation plans require a relative route")
    .refine(
      (route) => !route.startsWith("//"),
      "Automation plans require a relative route",
    ),
  actions: z.array(actionSchema),
});

const evidenceSchema = z.object({
  kind: z.enum(["TRACE", "SCREENSHOT", "VIDEO", "REPORT"]),
  path: z
    .string()
    .min(1)
    .refine(
      (value) =>
        !value.startsWith("/") &&
        !value.split("/").includes("..") &&
        !value.startsWith("playwright/.auth/"),
      "Evidence paths must be safe, relative, and exclude authentication state",
    ),
});

export const executionSummarySchema = z.object({
  schemaVersion: z.literal(1),
  runId: identifierSchema,
  project: identifierSchema,
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  tests: z.array(
    z.object({
      testId: identifierSchema,
      status: z.enum(["PASSED", "FAILED", "SKIPPED", "TIMED_OUT"]),
      durationMs: z.number().int().nonnegative(),
      metadata: playwrightTestMetadataSchema,
      evidence: z.array(evidenceSchema),
    }),
  ),
});

export const capabilityExtensionProposalSchema = z.object({
  capabilityId: identifierSchema,
  actionKind: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  category: z.enum([
    "INTERACTION",
    "ASSERTION",
    "NAVIGATION",
    "BROWSER_CONTROL",
    "DATA",
    "NETWORK",
    "AUTHENTICATION",
    "FILESYSTEM",
    "EXECUTION",
  ]),
  playwrightApi: z.string().regex(/^(?:locator|expect)\.[A-Za-z][A-Za-z0-9]*$/),
  usesExistingLocator: z.boolean(),
  deterministicRenderer: z.boolean(),
  requiresArbitraryCode: z.boolean(),
  accessesExternalOrigin: z.boolean(),
  changesBrowserPermissions: z.boolean(),
  accessesFileSystem: z.boolean(),
  changesAuthenticationState: z.boolean(),
  performsDestructiveWrite: z.boolean(),
  addsDependency: z.boolean(),
});

export const capabilityExtensionRecordSchema = z.object({
  schemaVersion: z.literal(1),
  runId: identifierSchema,
  actorId: z.literal("playwright-test-engineer"),
  policyVersion: z.literal(1),
  proposal: capabilityExtensionProposalSchema,
  proposalChecksum: checksumSchema,
  disposition: z.enum(["AUTO_APPROVED", "HUMAN_REVIEW_REQUIRED"]),
  reasons: z.array(z.string().min(1)).min(1),
});

export type AutomationPlan = z.infer<typeof automationPlanSchema>;
export type AutomationLocator = z.infer<typeof locatorSchema>;
export type PlaywrightTestMetadata = z.infer<
  typeof playwrightTestMetadataSchema
>;
export type ExecutionSummary = z.infer<typeof executionSummarySchema>;
export type CapabilityExtensionProposal = z.infer<
  typeof capabilityExtensionProposalSchema
>;
export type CapabilityExtensionRecord = z.infer<
  typeof capabilityExtensionRecordSchema
>;
