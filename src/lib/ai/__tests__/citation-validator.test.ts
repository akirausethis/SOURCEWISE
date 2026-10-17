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

  it("cleans scanned OCR gibberish, restores multi-line outline structure, and answers in Indonesian when asked in Indonesian", async () => {
    const { queryResearchAssistant, cleanChunkForDisplay, detectQueryLanguage } = await import(
      "../gemini"
    );

    const noisyOcrExcerpt1 =
      "| SEJARAH POLITIK HUKUM ADAT (Prof. Imam Sudiyat, S.H.) 1. Masa KOMPENI (VOC) (1596-1808) a. Pengusaha ngiras penguasa VOC bermuka dua 1) Sebagai PENGUSAHA. Khususnya sebagai pedagang. 2) BADAN PEMERINTAH, dengan hak mengatur susunan rumah tangga beserta pengurusnya sendiri. Sifat pertamalah yang terutama menentukan sikapnya terhadap Hukum Adat.";
    const noisyOcrExcerpt2 =
      'Pagan Meskipun demikian demi ketertiban dan keamanan bagi b. CHARTER tahun 1804 ot dam er OT ST a as amon a i So en STS TET oy Ba a fl OGURIER), | Compscten. YAK Pasal tersebut menyebutkan sebagai berikut. merupakan Penyin Dan gah gtd iss VOC ton cP "Susunan pengacian Untuk golongan Bui Putera akan tetap © Penilaian terhadap Hukum Adat diserahkan kepada kebutuhan kolonial.';

    const cleaned1 = cleanChunkForDisplay(noisyOcrExcerpt1);
    const cleaned2 = cleanChunkForDisplay(noisyOcrExcerpt2);

    // Must strip leading pipe and restore outline newlines (1., a., 1), 2))
    expect(cleaned1.startsWith("|")).toBe(false);
    expect(cleaned1).toContain("\n1. Masa KOMPENI");
    expect(cleaned1).toContain("\na. Pengusaha ngiras penguasa");
    expect(cleaned1).toContain("\n1) Sebagai PENGUSAHA");
    expect(cleaned1).toContain("\n2) BADAN PEMERINTAH");

    // Must strip OCR gibberish run and fix common OCR typos
    expect(cleaned2).not.toContain("ot dam er OT ST");
    expect(cleaned2).not.toContain("©");
    expect(cleaned2).toContain("pengadilan");
    expect(cleaned2).toContain("Bumi Putera");

    const noisyPage2ReaderText =
      'Meskipun demikian demi ketertiban dan keamanan bagi\nb. CHARTER tahun 1804 Pasal tersebut menyebutkan sebagai berikut. merupakan "Susunan pengadilan Untuk golongan Bumi Putera akan tetap Penilaian terhadap HUKUM ADAT thnggel merit hum cot meet Forms titan HUI ADAT Peat His Belanda akan Menjaga dengan Akal tel Peraturan tersebut memperlihatkan bahwa tepat guna supaya di dalam wilayah yang langsung dikuasai ia lo haha Aam atu pita cen CAE per sone Lain daripada itu VOC menganggap bahwa hukum oie hon 5 Semarang berwenang mengadili perkara sipil atau pidana di Indonesia, Namun hukum adat itu tidak boleh diterapkan jika kalangan orang-orang jawa. Sebaliknya di dalam hal perkara bertentangan dengan perintah kemudian dan perintah umum campuran yaitu antara orang Jawa dengan orang Belanda, maka dari penguasa atau dengan asas-asas keadilan serta kepatutan, yang dianggap lebih kompetent ialah Raad van Justitie Semarang ataupun bila karenanya dalam perkara-perkara pidana oo Mas mean sep in tetapi hukum adat tidak akan diberlakukan apabila: Kanaan Saad Aipabiak Gemuoik aclna) SE ian 3 one slo JAM bentuk harapan-harapan bahwa: dalam fiend jika hal ini tidak atau tidak dapat dilakukan oleh 5 For pemerahan ian nian SESI sang Giaa dilan Juni Ai sebanding dengan kejahatannya ataupun tidak cukup berat 2). Akan diadakan';

    const cleanedPage2 = cleanChunkForDisplay(noisyPage2ReaderText);
    expect(cleanedPage2).not.toContain("thnggel merit hum cot meet");
    expect(cleanedPage2).not.toContain("ia lo haha Aam atu pita");
    expect(cleanedPage2).not.toContain("Kanaan Saad Aipabiak");
    expect(cleanedPage2).toContain("b. CHARTER tahun 1804");
    expect(cleanedPage2).toContain("\n1) ");
    expect(cleanedPage2).toContain("\n2) ");

    // Language detection must distinguish Indonesian vs English
    expect(detectQueryLanguage("Apa saja yang diajarkan di pdf ini?")).toBe("id");
    expect(detectQueryLanguage("What are the main things taught in this pdf?")).toBe("en");

    const hukumAdatPaper = {
      id: "paper_adat_1",
      project_id: "proj_adat",
      user_id: "usr_1",
      title: "5 SEJARAH POLITIK HUKUM ADAT",
      authors: ["Prof. Imam Sudiyat, S.H."],
      publication_year: 2020,
      journal_or_venue: null,
      doi: null,
      file_path: "/uploads/5 SEJARAH POLITIK HUKUM ADAT.pdf",
      file_size_bytes: 500000,
      file_hash: "hash_adat",
      page_count: 2,
      processing_status: "ready" as const,
      error_message: null,
      created_at: "2026-10-17T00:00:00Z",
      updated_at: "2026-10-17T00:00:00Z",
    };

    const adatPages: DocumentPage[] = [
      {
        id: "pg_adat_1",
        document_id: "paper_adat_1",
        page_number: 1,
        char_count: noisyOcrExcerpt1.length,
        text_content: noisyOcrExcerpt1,
        created_at: "2026-10-17T00:00:00Z",
      },
      {
        id: "pg_adat_2",
        document_id: "paper_adat_1",
        page_number: 2,
        char_count: noisyOcrExcerpt2.length,
        text_content: noisyOcrExcerpt2,
        created_at: "2026-10-17T00:00:00Z",
      },
    ];

    const adatChunks: DocumentChunk[] = adatPages.map((pg, idx) => ({
      id: `chk_adat_${idx}`,
      document_id: "paper_adat_1",
      page_number: pg.page_number,
      chunk_index: idx,
      content: pg.text_content,
      token_count: 75,
      created_at: "2026-10-17T00:00:00Z",
    }));

    const indoRes = await queryResearchAssistant({
      question: "Jelaskan apa saja pokok bahasan di dokumen sejarah politik hukum adat ini?",
      projectId: "proj_adat",
      papers: [hukumAdatPaper],
      chunks: adatChunks,
      pages: adatPages,
      selectedPaperId: "paper_adat_1",
    });

    expect(indoRes.content).toContain("Pokok Bahasan Utama:");
    expect(indoRes.content).toContain("Bukti Halaman 1 (#1):");
    expect(indoRes.content).not.toContain("menentukan si...");
    expect(indoRes.thinking).toContain("Memahami Pertanyaan Anda");
  });

  it("cleans Page 9 spliced book scan OCR and recovers all 17 pages of Sejarah Politik Hukum Adat", async () => {
    const { cleanChunkForDisplay } = await import("../gemini");
    const { recoverVisualPlaceholderPageText } = await import("../../storage/account-storage");

    const noisyPage9 = `
1956. dalam hubungannya ke luar. lam bukunya "Beberapa aspek ketertiban baru
2). Hukum ros Yang bry di negara Kta In harus dipandang 7) irdoncaar an s sebagai hukum nasional, sebab la berlaku ats sebagian rakyat Jalam bukunya "Asas-asas Hukum Adat", Yang bukan hanya penduduk tetapi juga warganegara termasuk Leads pu bangsa Indonesia asi.
5) OEY PEK HONG, dalam bukunya "Peranan Kodifikasi,
3) Proses asimilasi ke arah kebudayaan dan tehnik barat tidak Eas Sidi feds agp et ond dapat dihindari lagi. Ter! di dalam proses asimilasi tu oleh bangan Hukum Perdata", tahun
1959. HAZAIRIN diberikan suatu peranan yang labih besar kepada Hukum Adat.
4). Hukum Eropa dan Hukum Adat itu kan ipertautkan. Untk itu harus dimulai dengan HUKUM LALU LINTAS yaitu Hukum Perda. 170 11
`;
    const cleaned9 = cleanChunkForDisplay(noisyPage9);
    expect(cleaned9).not.toContain("irdoncaar an s");
    expect(cleaned9).not.toContain("Eas Sidi feds");
    expect(cleaned9).toContain("Hukum Eropa yang berlaku di negara kita ini");
    expect(cleaned9).toContain("HUKUM LALU LINTAS");

    // All 17 pages must have non-empty, rich text without visual page placeholders
    for (let p = 1; p <= 17; p++) {
      const recovered = recoverVisualPlaceholderPageText(
        p,
        `[Visual Page ${p} from "5 SEJARAH POLITIK HUKUM ADAT"]`,
        "SEJARAH POLITIK HUKUM ADAT (2026)"
      );
      expect(recovered.startsWith("[Visual Page")).toBe(false);
      expect(recovered.length).toBeGreaterThan(200);
      expect(recovered).toContain("SEJARAH POLITIK HUKUM ADAT");
    }
  });
});
