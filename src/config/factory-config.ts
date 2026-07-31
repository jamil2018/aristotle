import { z } from "zod";

const environmentSchema = z.enum([
  "LOCAL",
  "DEVELOPMENT",
  "TEST",
  "STAGING",
  "PRODUCTION",
]);

const screenshotPolicySchema = z.enum(["off", "on", "only-on-failure"]);
const tracePolicySchema = z.enum([
  "off",
  "on",
  "retain-on-failure",
  "on-first-retry",
  "on-all-retries",
]);
const videoPolicySchema = z.enum([
  "off",
  "on",
  "retain-on-failure",
  "on-first-retry",
]);

const rawConfigSchema = z.object({
  FACTORY_BASE_URL: z.url().default("http://127.0.0.1:3000"),
  FACTORY_ENVIRONMENT: environmentSchema.default("LOCAL"),
  FACTORY_ALLOW_PRODUCTION_WRITES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FACTORY_ALLOWED_ORIGINS: z.string().default("http://127.0.0.1:3000"),
  FACTORY_SCREENSHOT_POLICY: screenshotPolicySchema.default("off"),
  FACTORY_TRACE_POLICY: tracePolicySchema.default("off"),
  FACTORY_VIDEO_POLICY: videoPolicySchema.default("off"),
});

export interface FactoryConfig {
  readonly environment: z.infer<typeof environmentSchema>;
  readonly baseUrl: URL;
  readonly allowedOrigins: readonly string[];
  readonly allowProductionWrites: boolean;
  readonly evidence: {
    readonly screenshot: z.infer<typeof screenshotPolicySchema>;
    readonly trace: z.infer<typeof tracePolicySchema>;
    readonly video: z.infer<typeof videoPolicySchema>;
  };
}

export function loadFactoryConfig(
  environment: NodeJS.ProcessEnv,
): FactoryConfig {
  const parsed = rawConfigSchema.parse(environment);
  const baseUrl = new URL(parsed.FACTORY_BASE_URL);
  const allowedOrigins = parsed.FACTORY_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);

  if (!allowedOrigins.includes(baseUrl.origin)) {
    throw new Error(
      `FACTORY_BASE_URL origin ${baseUrl.origin} is not present in FACTORY_ALLOWED_ORIGINS`,
    );
  }

  if (
    parsed.FACTORY_ENVIRONMENT === "PRODUCTION" &&
    parsed.FACTORY_ALLOW_PRODUCTION_WRITES
  ) {
    throw new Error(
      "Production writes require task-scoped human authorization and cannot be enabled globally",
    );
  }

  return {
    environment: parsed.FACTORY_ENVIRONMENT,
    baseUrl,
    allowedOrigins,
    allowProductionWrites: parsed.FACTORY_ALLOW_PRODUCTION_WRITES,
    evidence: {
      screenshot: parsed.FACTORY_SCREENSHOT_POLICY,
      trace: parsed.FACTORY_TRACE_POLICY,
      video: parsed.FACTORY_VIDEO_POLICY,
    },
  };
}
