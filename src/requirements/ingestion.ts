import { createHash } from "node:crypto";

import matter from "gray-matter";
import mammoth from "mammoth";

import { ingestedRequirementSourceSchema } from "./contracts.js";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export type RequirementSourceFormat = "TEXT" | "MARKDOWN" | "PDF" | "DOCX";

export interface SourcePage {
  readonly page: number;
  readonly text: string;
}

export interface IngestedRequirementSource {
  readonly sourceId: string;
  readonly format: RequirementSourceFormat;
  readonly text: string;
  readonly originalChecksum: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly pages: readonly SourcePage[];
}

type PdfExtractor = (content: Buffer) => Promise<readonly string[]>;
type DocxExtractor = (content: Buffer) => Promise<string>;

export function ingestDirectText(
  text: string,
  sourceId: string,
): IngestedRequirementSource {
  const content = Buffer.from(text);
  validateSource(content, text);
  return source("TEXT", sourceId, content, text, {}, []);
}

export function ingestMarkdown(
  content: Buffer,
  sourceId: string,
): IngestedRequirementSource {
  validateSize(content);
  const parsed = matter(content.toString("utf8"));
  validateText(parsed.content);
  return source(
    "MARKDOWN",
    sourceId,
    content,
    parsed.content.trim(),
    parsed.data,
    [],
  );
}

export async function ingestPdf(
  content: Buffer,
  sourceId: string,
  extractor: PdfExtractor = extractPdfText,
): Promise<IngestedRequirementSource> {
  validateSize(content);
  const extractedPages = await extractor(content);
  const text = extractedPages.join("\n\n");
  validateText(text);
  return source(
    "PDF",
    sourceId,
    content,
    text,
    {},
    extractedPages.map((pageText, index) => ({
      page: index + 1,
      text: pageText,
    })),
  );
}

export async function ingestDocx(
  content: Buffer,
  sourceId: string,
  extractor: DocxExtractor = extractDocxText,
): Promise<IngestedRequirementSource> {
  validateSize(content);
  const text = await extractor(content);
  validateText(text);
  return source("DOCX", sourceId, content, text.trim(), {}, []);
}

async function extractPdfText(content: Buffer): Promise<readonly string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(content),
    useWorkerFetch: false,
  });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim(),
    );
  }
  await loadingTask.destroy();
  return pages;
}

async function extractDocxText(content: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: content });
  return result.value;
}

function source(
  format: RequirementSourceFormat,
  sourceId: string,
  content: Buffer,
  text: string,
  metadata: Readonly<Record<string, unknown>>,
  pages: readonly SourcePage[],
): IngestedRequirementSource {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) {
    throw new Error(`Unsafe source identifier: ${sourceId}`);
  }
  return ingestedRequirementSourceSchema.parse({
    sourceId,
    format,
    text,
    originalChecksum: createHash("sha256").update(content).digest("hex"),
    metadata,
    pages,
  });
}

function validateSource(content: Buffer, text: string): void {
  validateSize(content);
  validateText(text);
}

function validateSize(content: Buffer): void {
  if (content.byteLength > MAX_SOURCE_BYTES) {
    throw new Error(
      `Requirement source exceeds ${String(MAX_SOURCE_BYTES)} byte limit`,
    );
  }
}

function validateText(text: string): void {
  if (text.trim().length === 0) {
    throw new Error("Source text is empty");
  }
}
