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

  it("synthesizes uploaded Physics PDF topics cleanly without raw ** stars or unrelated RAG/LLM chunks", async () => {
    const { queryResearchAssistant } = await import("../gemini");
    const physicsPaper = {
      id: "paper_fisika_1",
      project_id: "proj_custom_1",
      user_id: "usr_1",
      title: "Modul Fisika Kelas XII KD 3.1",
      authors: ["ISSI ANISSA"],
      publication_year: 2020,
      journal_or_venue: "Direktorat SMA",
      doi: null,
      file_path: "/uploads/fisika.pdf",
      file_size_bytes: 1352472,
      file_hash: "hash_1",
      page_count: 38,
      processing_status: "ready" as const,
      error_message: null,
      created_at: "2026-10-17T00:00:00Z",
      updated_at: "2026-10-17T00:00:00Z",
    };

    const physicsPages: DocumentPage[] = [
      {
        id: "pg_6",
        document_id: "paper_fisika_1",
        page_number: 6,
        char_count: 450,
        text_content:
          "Modul Fisika Kelas XII KD 3.1\n@2020, Direktorat SMA\nPENDAHULUAN\nJudul Modul : Listrik Arus Searah (DC)\nPada modul listrik arus searah ini, Anda akan belajar tentang prinsip kerja peralatan listrik searah, diawali dari konsep besaran-besaran listrik meliputi kuat arus listrik, beda potensial, dan hambatan listrik. Anda juga akan belajar tentang Hukum Ohm dan Hukum Kirchoff serta rangkaian seri dan paralel.",
        created_at: "2026-10-17T00:00:00Z",
      },
      {
        id: "pg_24",
        document_id: "paper_fisika_1",
        page_number: 24,
        char_count: 350,
        text_content:
          "Modul Fisika Kelas XII KD 3.1\n@2020, Direktorat SMA\n2. Energi dan Daya Listrik\nEnergi listrik adalah energi yang mampu menggerakkan muatan-muatan listrik pada suatu beda potensial tertentu. Daya listrik merupakan laju aliran energi setiap satuan waktu.",
        created_at: "2026-10-17T00:00:00Z",
      },
    ];

    const physicsChunks: DocumentChunk[] = physicsPages.map((pg, idx) => ({
      id: `chk_fis_${idx}`,
      document_id: "paper_fisika_1",
      page_number: pg.page_number,
      chunk_index: idx,
      content: pg.text_content,
      token_count: 80,
      created_at: "2026-10-17T00:00:00Z",
    }));

    const res = await queryResearchAssistant({
      question: "What are the main thing that are thought in this pdf?",
      projectId: "proj_custom_1",
      papers: [physicsPaper],
      chunks: physicsChunks,
      pages: physicsPages,
      selectedPaperId: "paper_fisika_1",
    });

    expect(res.content).toContain("Modul Fisika Kelas XII KD 3.1");
    expect(res.content).toContain("Ohm");
    expect(res.content).toContain("Kirchhoff");
    expect(res.content).not.toContain("**");
    expect(res.content).not.toContain("Transformer");
    expect(res.thinking).toContain("Understanding Your Question");
    expect(res.citations.length).toBeGreaterThan(0);
  });
});
