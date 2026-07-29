import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const ingestedRequirementSourceSchema = z.object({
  sourceId: identifierSchema,
  format: z.enum(["TEXT", "MARKDOWN", "PDF", "DOCX"]),
  text: z.string().min(1),
  originalChecksum: checksumSchema,
  metadata: z.record(z.string(), z.unknown()),
  pages: z.array(
    z.object({
      page: z.number().int().positive(),
      text: z.string(),
    }),
  ),
});

export const atomicRequirementSchema = z.object({
  requirementId: identifierSchema,
  text: z.string().min(1),
  classification: z.enum(["STATED_REQUIREMENT", "ASSUMPTION", "OBSERVATION"]),
  source: z.object({
    sourceId: identifierSchema,
    sourceChecksum: checksumSchema,
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
  }),
});

export const normalizedRequirementsSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  sourceId: identifierSchema,
  sourceChecksum: checksumSchema,
  requirements: z.array(atomicRequirementSchema),
});

export const requirementAnalysisSchema = z.object({
  issues: z.array(
    z.object({
      kind: z.enum(["CONTRADICTION", "OMISSION", "ASSUMPTION", "AMBIGUITY"]),
      requirementIds: z.array(identifierSchema),
      message: z.string().min(1),
      blocking: z.boolean(),
    }),
  ),
  clarificationQuestions: z.array(z.string().min(1)),
  hasBlockingAmbiguity: z.boolean(),
});

export type ValidatedRequirementSource = z.infer<
  typeof ingestedRequirementSourceSchema
>;
export type ValidatedNormalizedRequirements = z.infer<
  typeof normalizedRequirementsSchema
>;
