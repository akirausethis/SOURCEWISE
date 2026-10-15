import { describe, it, expect } from "vitest";
import { extractBibliographicMetadata, chunkDocumentPages } from "../extractor";

describe("PDF Bibliographic Extractor and Chunker", () => {
  const sampleFirstPage = `
    Attention Is All You Need
    Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit
    Google Brain, Google Research
    abstract
    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.
    Advances in Neural Information Processing Systems (NeurIPS 2017)
    doi: 10.48550/arXiv.1706.03762
  `;

  it("extracts DOI, publication year, and authors without inventing missing data", () => {
    const meta = extractBibliographicMetadata(sampleFirstPage, "vaswani_2017.pdf");
    expect(meta.doi).toBe("10.48550/arXiv.1706.03762");
    expect(meta.publication_year).toBe(2017);
    expect(meta.authors.length).toBeGreaterThan(0);
    expect(meta.authors[0]).toContain("Ashish Vaswani");
  });

  it("chunks page texts preserving physical page provenance and character offsets", () => {
    const pages = [
      {
        page_number: 1,
        text: "Paragraph one with some detailed methodological insight.\n\nParagraph two with key experimental results.",
      },
      {
        page_number: 2,
        text: "Paragraph three continuing discussion on limitations.",
      },
    ];

    const chunks = chunkDocumentPages("doc_test_123", pages, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].page_number).toBe(1);
    expect(chunks[chunks.length - 1].page_number).toBe(2);
    expect(chunks[0].document_id).toBe("doc_test_123");
    expect(typeof chunks[0].char_start).toBe("number");
  });
});
