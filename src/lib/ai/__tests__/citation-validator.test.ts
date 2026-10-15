import { describe, it, expect } from "vitest";
import { validateCitations } from "../citation-validator";
import { DocumentPage, DocumentChunk } from "@/types";

describe("Strict Citation Validator", () => {
  const mockPages: DocumentPage[] = [
    {
      id: "p1",
      document_id: "doc_transformer",
      page_number: 1,
      char_count: 500,
      text_content:
        "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
      created_at: "2026-10-15T00:00:00Z",
    },
    {
      id: "p2",
      document_id: "doc_transformer",
      page_number: 2,
      char_count: 400,
      text_content:
        "Recurrent models typically factor computation along the symbol positions of the input and output sequences.",
      created_at: "2026-10-15T00:00:00Z",
    },
  ];

  const mockChunks: DocumentChunk[] = [
    {
      id: "c1",
      document_id: "doc_transformer",
      page_number: 1,
      chunk_index: 0,
      content:
        "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
      token_count: 20,
      created_at: "2026-10-15T00:00:00Z",
    },
  ];

  it("verifies authentic citations with matching physical page and text quote", () => {
    const candidate = [
      {
        document_id: "doc_transformer",
        page_number: 1,
        passage_quote: "Transformer, based solely on attention mechanisms.",
      },
    ];

    const result = validateCitations(candidate, mockPages, mockChunks);
    expect(result.validCitations.length).toBe(1);
    expect(result.validCitations[0].verified).toBe(true);
    expect(result.validCitations[0].page_number).toBe(1);
    expect(result.rejectedCitations.length).toBe(0);
  });

  it("rejects citation when the page number does not exist in the document", () => {
    const candidate = [
      {
        document_id: "doc_transformer",
        page_number: 99, // Fake page number
        passage_quote: "Transformer, based solely on attention mechanisms.",
      },
    ];

    const result = validateCitations(candidate, mockPages, mockChunks);
    expect(result.validCitations.length).toBe(0);
    expect(result.rejectedCitations.length).toBe(1);
    expect(result.rejectedCitations[0].reason).toContain("Page 99 does not exist");
  });

  it("rejects citation when the quote is fabricated and not found on the page", () => {
    const candidate = [
      {
        document_id: "doc_transformer",
        page_number: 1,
        passage_quote: "This model proves that artificial consciousness has been achieved.", // Hallucination
      },
    ];

    const result = validateCitations(candidate, mockPages, mockChunks);
    expect(result.validCitations.length).toBe(0);
    expect(result.rejectedCitations.length).toBe(1);
    expect(result.rejectedCitations[0].reason).toContain("could not be verified");
  });

  it("rejects citation referencing an unauthorized or non-existent document ID", () => {
    const candidate = [
      {
        document_id: "doc_unauthorized_user_999",
        page_number: 1,
        passage_quote: "Some stolen data quote here.",
      },
    ];

    const result = validateCitations(candidate, mockPages, mockChunks);
    expect(result.validCitations.length).toBe(0);
    expect(result.rejectedCitations.length).toBe(1);
    expect(result.rejectedCitations[0].reason).toContain("not found in authorized collection");
  });
});
