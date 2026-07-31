import { describe, expect, it } from "vitest";

import {
  analyzeRequirements,
  normalizeRequirements,
  reconcileClarifications,
} from "../../../src/requirements/analysis.js";
import {
  exploreAllowedOrigin,
  proposeTaxonomyPlacement,
} from "../../../src/requirements/exploration.js";
import {
  ingestDirectText,
  ingestDocx,
  ingestMarkdown,
  ingestPdf,
} from "../../../src/requirements/ingestion.js";

describe("requirement source ingestion", () => {
  it("preserves direct text and emits source coordinates", () => {
    const source = ingestDirectText(
      "The administrator must create users.\nUsers must receive an email.",
      "prompt-1",
    );

    expect(source.originalChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(source.text).toContain("administrator");
    expect(source.sourceId).toBe("prompt-1");
  });

  it("parses Markdown as data and excludes frontmatter from requirement text", () => {
    const source = ingestMarkdown(
      Buffer.from("---\ntitle: Login\n---\n# Login\nUsers must sign in."),
      "login-md",
    );

    expect(source.text).toBe("# Login\nUsers must sign in.");
    expect(source.metadata).toEqual({ title: "Login" });
  });

  it("extracts PDF and DOCX through inert parser boundaries", async () => {
    const pdf = await ingestPdf(Buffer.from("pdf"), "source-pdf", () =>
      Promise.resolve(["First page", "Second page"]),
    );
    const docx = await ingestDocx(Buffer.from("docx"), "source-docx", () =>
      Promise.resolve("The user must sign out."),
    );

    expect(pdf.text).toBe("First page\n\nSecond page");
    expect(pdf.pages).toHaveLength(2);
    expect(docx.text).toBe("The user must sign out.");
  });

  it("extracts the sanitized PDF and DOCX corpus with the configured parsers", async () => {
    const pdf = await ingestPdf(
      createMinimalPdf("The user must reset passwords."),
      "corpus-pdf",
    );
    const docx = await ingestDocx(
      Buffer.from(
        "UEsDBAoAAAAIAIVu/VzmdcR+0gAAAIsBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH2QvVLDMAzHX8XnlasVGBh6SToAKzD0BXSOkvjw11luad++Sls6cIVR+n/8ZLebQ/BqT4Vdip1+NI3e9O32mImVKJE7Pdea1wBsZwrIJmWKooypBKwylgky2i+cCJ6a5hlsipViXdWlQ/ftK42481W9HWR9oRTyrNXLxbiwOo05e2exig77OPyirK4EI8mzh2eX+UEMGu4SFuVvwDX3Ic8ubiD1iaW+YxAXfKcywJDsLkjS/F9z5840js7SLb+05ZIsMbs4BW9uSkAXf+6H83f3J1BLAwQKAAAAAACFbv1cAAAAAAAAAAAAAAAABgAAAF9yZWxzL1BLAwQKAAAACACFbv1cXzOVUpUAAAAHAQAACwAAAF9yZWxzLy5yZWxzjc87DsIwDAbgq0Q+QJ0yMKCmXVi6Ii4QJW5T0TzkhNftycBAEQOjf//6LHfDw6/iRpyXGBS0jYSh70606lKD7JaURW2ErMCVkg6I2TjyOjcxUaibKbLXpY48Y9LmomfCnZR75E8DtqYYrQIebQvi/Ez0jx2naTF0jObqKZQfJ74aVdY8U1Fwj2zRvuOmsoB9h5sX+xdQSwMECgAAAAAAhW79XAAAAAAAAAAAAAAAAAUAAAB3b3JkL1BLAwQKAAAACACFbv1cDmpwmYwAAAC+AAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sRY5LDoMwDESvEuUAmHbRBeJziV6AgguRcBzZTmlvX0IX3bzR6EmjaYc3be6FooFj5y9V7Ye+3ZuZp0wYzR06arN3fjVLDYBOK9KoFSeMh3uy0GhHlQV2ljkJT6ga4kIbXOv6BjSG6Mvkg+dPyVQgBdbfV3RZURxlNadhiY6zVS0UWSgn08nfAPzP9V9QSwECFAAKAAAACACFbv1c5nXEftIAAACLAQAAEwAAAAAAAAAAAAAAAAAAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAAoAAAAAAIVu/VwAAAAAAAAAAAAAAAAGAAAAAAAAAAAAEAAAAAMBAABfcmVscy9QSwECFAAKAAAACACFbv1cXzOVUpUAAAAHAQAACwAAAAAAAAAAAAAAAAAnAQAAX3JlbHMvLnJlbHNQSwECFAAKAAAAAACFbv1cAAAAAAAAAAAAAAAABQAAAAAAAAAAABAAAADlAQAAd29yZC9QSwECFAAKAAAACACFbv1cDmpwmYwAAAC+AAAAEQAAAAAAAAAAAAAAAAAIAgAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAUABQAgAQAAwwIAAAAA",
        "base64",
      ),
      "corpus-docx",
    );

    expect(pdf.text).toContain("reset passwords");
    expect(docx.text).toBe("The user must sign out.");
  });

  it("rejects empty and oversized sources", () => {
    expect(() => ingestDirectText(" \n ", "empty")).toThrow(
      "Source text is empty",
    );
    expect(() =>
      ingestMarkdown(Buffer.alloc(10 * 1024 * 1024 + 1), "large"),
    ).toThrow("exceeds");
  });
});

function createMinimalPdf(text: string): Buffer {
  const escapedText = text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
  const stream = `BT /F1 12 Tf 72 720 Td (${escapedText}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${String(Buffer.byteLength(stream))} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let content = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(content));
    content += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(content);
  content += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  content += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  content += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xrefOffset)}\n%%EOF\n`;
  return Buffer.from(content);
}

describe("requirement analysis", () => {
  it("creates stable atomic IDs with exact source links", () => {
    const source = ingestDirectText(
      "The administrator must create users.\nThe administrator must disable users.",
      "prompt-2",
    );
    const first = normalizeRequirements(source, 1);
    const second = normalizeRequirements(source, 2);

    expect(first.requirements).toHaveLength(2);
    expect(first.requirements[0]?.requirementId).toBe(
      second.requirements[0]?.requirementId,
    );
    expect(first.requirements[0]?.source).toMatchObject({
      sourceId: "prompt-2",
      startLine: 1,
      endLine: 1,
    });
  });

  it("uses Markdown headings as context rather than requirements", () => {
    const source = ingestMarkdown(
      Buffer.from("# Authentication\n\n- Users must sign in."),
      "heading-source",
    );

    expect(normalizeRequirements(source, 1).requirements).toHaveLength(1);
  });

  it("blocks contradictions, omissions, and materially vague language", () => {
    const source = ingestDirectText(
      [
        "The account must lock after five failed attempts.",
        "The account must not lock after five failed attempts.",
        "The dashboard should load quickly.",
      ].join("\n"),
      "ambiguous",
    );
    const normalized = normalizeRequirements(source, 1);
    const analysis = analyzeRequirements(normalized);

    expect(analysis.hasBlockingAmbiguity).toBe(true);
    expect(analysis.issues.map((issue) => issue.kind)).toEqual(
      expect.arrayContaining(["CONTRADICTION", "AMBIGUITY"]),
    );
    expect(analysis.clarificationQuestions.length).toBeGreaterThan(0);
  });

  it("keeps observed behavior separate from intended requirements", () => {
    const source = ingestDirectText(
      "Observed: the login page currently accepts 6 characters.",
      "observation",
    );
    const normalized = normalizeRequirements(source, 1);

    expect(normalized.requirements[0]?.classification).toBe("OBSERVATION");
  });

  it("reconciles human answers into a new revision with impact", () => {
    const source = ingestDirectText(
      "The dashboard should load quickly.",
      "reconcile",
    );
    const initial = normalizeRequirements(source, 1);
    const next = reconcileClarifications(initial, {
      actor: { actorType: "HUMAN", actorId: "product-owner" },
      answers: [
        {
          requirementId: initial.requirements[0]?.requirementId ?? "",
          replacementText: "The dashboard must load within two seconds.",
        },
      ],
    });

    expect(next.canonical.revision).toBe(2);
    expect(next.impact.modified).toHaveLength(1);
    expect(next.canonical.requirements[0]?.text).toContain("two seconds");
  });

  it("rejects agent-authored or unknown clarification answers", () => {
    const source = ingestDirectText(
      "The dashboard should load quickly.",
      "invalid-answer",
    );
    const initial = normalizeRequirements(source, 1);

    expect(() =>
      reconcileClarifications(initial, {
        actor: { actorType: "AGENT", actorId: "requirement-analyst" },
        answers: [],
      }),
    ).toThrow("human actor");
    expect(() =>
      reconcileClarifications(initial, {
        actor: { actorType: "HUMAN", actorId: "product-owner" },
        answers: [
          {
            requirementId: "req-does-not-exist",
            replacementText: "Unknown requirement.",
          },
        ],
      }),
    ).toThrow("unknown requirement");
  });
});

describe("taxonomy and optional exploration", () => {
  it("proposes the strongest existing taxonomy match", () => {
    const proposal = proposeTaxonomyPlacement(
      ["login/user-registration", "billing/invoices"],
      ["Users must register with an email address."],
    );

    expect(proposal).toMatchObject({
      proposedPath: "login/user-registration",
      requiresClarification: false,
    });
  });

  it("requires clarification for tied placements", () => {
    const proposal = proposeTaxonomyPlacement(
      ["accounts/profile", "accounts/settings"],
      ["Accounts must be editable."],
    );

    expect(proposal.requiresClarification).toBe(true);
  });

  it("bounds allowlisted exploration and labels results as observations", async () => {
    const visited: string[] = [];
    const evidence = await exploreAllowedOrigin(
      {
        authorized: true,
        allowedOrigins: ["https://example.test"],
        startUrls: [
          "https://example.test/login",
          "https://example.test/dashboard",
          "https://example.test/ignored",
        ],
        maxPages: 2,
      },
      (url) => {
        visited.push(url);
        return Promise.resolve(`Visible content at ${url}`);
      },
    );

    expect(visited).toHaveLength(2);
    expect(evidence).toHaveLength(2);
    expect(evidence[0]?.classification).toBe("OBSERVATION");
  });

  it("rejects unauthorized or non-allowlisted exploration", async () => {
    await expect(
      exploreAllowedOrigin(
        {
          authorized: false,
          allowedOrigins: ["https://example.test"],
          startUrls: ["https://example.test/login"],
          maxPages: 1,
        },
        () => Promise.resolve("content"),
      ),
    ).rejects.toThrow("authorization");

    await expect(
      exploreAllowedOrigin(
        {
          authorized: true,
          allowedOrigins: ["https://example.test"],
          startUrls: ["https://evil.test/login"],
          maxPages: 1,
        },
        () => Promise.resolve("content"),
      ),
    ).rejects.toThrow("allowlisted");
  });
});
