import { describe, it, expect } from "vitest";
import zlib from "zlib";
import {
  extractBibliographicMetadata,
  chunkDocumentPages,
  extractPagesFromPDFBuffer,
} from "../extractor";

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

  it("extracts real text from a compressed binary PDF buffer without ArrayBuffer detachment", async () => {
    const stream = zlib.deflateSync(
      Buffer.from("BT /F1 12 Tf 72 720 Td (Modul Fisika Kelas XII Listrik Arus Searah Hukum Ohm) Tj ET")
    );
    const pdfBuffer = Buffer.concat([
      Buffer.from(
        "%PDF-1.7\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n4 0 obj<</Filter/FlateDecode/Length " +
          stream.length +
          ">>\nstream\n"
      ),
      stream,
      Buffer.from("\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF\n" + " ".repeat(20000)),
    ]);

    const res = await extractPagesFromPDFBuffer(pdfBuffer);
    expect(res.pages.length).toBe(1);
    expect(res.pages[0].text).toContain("Modul Fisika Kelas XII Listrik Arus Searah Hukum Ohm");
    expect(res.pages[0].text).not.toContain("Document text extracted from source.");
  });
});
