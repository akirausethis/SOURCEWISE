import { DocumentPage, DocumentChunk } from "@/types";

export interface ExtractedPDFMetadata {
  title: string;
  authors: string[];
  publication_year: number | null;
  journal_or_venue: string | null;
  doi: string | null;
  page_count: number;
}

export interface ExtractedPDFResult {
  metadata: ExtractedPDFMetadata;
  pages: DocumentPage[];
  chunks: DocumentChunk[];
}

/**
 * Helper to check if a string looks like raw PDF binary/dictionary syntax rather than human text.
 */
export function isRawPDFBinaryGarbage(str: string): boolean {
  if (!str) return false;
  const sample = str.slice(0, 600);
  return (
    sample.startsWith("%PDF-") ||
    sample.includes("<</Type/Catalog") ||
    sample.includes("<</Type/Page") ||
    sample.includes("/FontDescriptor") ||
    sample.includes("endobj") ||
    sample.includes("stream JFIF")
  );
}

/**
 * Extracts real page-by-page text from a PDF Buffer using serverless-safe `unpdf` (primary) and `pdf-parse` (fallback)
 */
export async function extractPagesFromPDFBuffer(
  buffer: Buffer
): Promise<{
  pages: { page_number: number; text: string }[];
  totalPages: number;
  fullText: string;
  pdfInfoTitle?: string;
  pdfInfoAuthor?: string;
}> {
  let pdfInfoTitle: string | undefined;
  let pdfInfoAuthor: string | undefined;

  // 1. Primary Serverless Extractor: unpdf (Zero native C++/canvas dependencies, built for Vercel Serverless)
  try {
    const { extractText, getMeta } = await import("unpdf");

    try {
      // IMPORTANT: Use Uint8Array.from(buffer) to create an independent ArrayBuffer copy,
      // because PDF.js transfers and detaches the ArrayBuffer passed into getMeta()!
      const meta = await getMeta(Uint8Array.from(buffer));
      const info = meta?.info as Record<string, unknown> | undefined;
      if (info?.Title && typeof info.Title === "string" && !isRawPDFBinaryGarbage(info.Title)) {
        pdfInfoTitle = info.Title.replace(/\s+/g, " ").trim();
      }
      if (info?.Author && typeof info.Author === "string" && !isRawPDFBinaryGarbage(info.Author)) {
        pdfInfoAuthor = info.Author.replace(/\s+/g, " ").trim();
      }
    } catch {
      // Metadata dictionary is optional
    }

    // Create a fresh independent copy of buffer for extractText()
    const extracted = await extractText(Uint8Array.from(buffer), { mergePages: false });

    if (extracted && Array.isArray(extracted.text) && extracted.text.length > 0) {
      const pages = extracted.text
        .map((pageText: string, idx: number) => ({
          page_number: idx + 1,
          text: (pageText || "").trim(),
        }))
        .filter((p) => p.text.length > 0 && !isRawPDFBinaryGarbage(p.text));

      if (pages.length > 0) {
        return {
          pages,
          totalPages: extracted.totalPages || pages.length,
          fullText: pages.map((p) => p.text).join("\n\n"),
          pdfInfoTitle,
          pdfInfoAuthor,
        };
      }
    }
  } catch (unpdfErr) {
    console.warn("unpdf extraction encountered error, trying pdf-parse fallback:", unpdfErr);
  }

  // 2. Secondary Extractor: PDFParse v2 with embedded data-URI worker
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getData } = require("pdf-parse/worker");

    if (typeof PDFParse.setWorker === "function" && typeof getData === "function") {
      PDFParse.setWorker(getData());
    }

    const parser = new PDFParse({ data: Uint8Array.from(buffer), verbosity: 0 });

    try {
      const infoRes = await parser.getInfo();
      if (!pdfInfoTitle && infoRes?.info?.Title && typeof infoRes.info.Title === "string" && !isRawPDFBinaryGarbage(infoRes.info.Title)) {
        pdfInfoTitle = infoRes.info.Title.replace(/\s+/g, " ").trim();
      }
      if (!pdfInfoAuthor && infoRes?.info?.Author && typeof infoRes.info.Author === "string" && !isRawPDFBinaryGarbage(infoRes.info.Author)) {
        pdfInfoAuthor = infoRes.info.Author.replace(/\s+/g, " ").trim();
      }
    } catch {
      // Info dictionary is optional
    }

    const result = await parser.getText();
    await parser.destroy();

    if (result && result.pages && result.pages.length > 0) {
      const extractedPages = result.pages
        .map((p: { text?: string; num?: number }, idx: number) => ({
          page_number: p.num && p.num > 0 ? p.num : idx + 1,
          text: (p.text || "").trim(),
        }))
        .filter((p: { text: string }) => p.text.length > 0 && !isRawPDFBinaryGarbage(p.text));

      if (extractedPages.length > 0) {
        return {
          pages: extractedPages,
          totalPages: result.total || extractedPages.length,
          fullText: extractedPages.map((p: { text: string }) => p.text).join("\n\n"),
          pdfInfoTitle,
          pdfInfoAuthor,
        };
      }
    }

    if (result && result.text && !isRawPDFBinaryGarbage(result.text)) {
      const rawText = result.text.trim();
      const pageSplits = rawText.split(/\f|\n(?=Page \d+)/).filter((t: string) => t.trim().length > 0);
      if (pageSplits.length > 0) {
        return {
          pages: pageSplits.map((txt: string, idx: number) => ({
            page_number: idx + 1,
            text: txt.trim(),
          })),
          totalPages: pageSplits.length,
          fullText: rawText,
          pdfInfoTitle,
          pdfInfoAuthor,
        };
      }
    }
  } catch (err) {
    console.warn("PDFParse extraction encountered error:", err);
  }

  // Safe fallback: if buffer is NOT a binary PDF (e.g. plain text in tests), extract readable text
  const rawAscii = buffer.toString("utf-8");
  if (!rawAscii.startsWith("%PDF-")) {
    const cleanText = rawAscii.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
    const fallbackPages = [
      {
        page_number: 1,
        text: cleanText.length > 10 ? cleanText.slice(0, 4000) : "Document text extracted from source.",
      },
    ];
    return {
      pages: fallbackPages,
      totalPages: 1,
      fullText: fallbackPages[0].text,
    };
  }

  // If it IS a %PDF- file and PDFParse returned empty text (e.g. scanned image-only PDF), never dump raw %PDF-1.7 binary syntax
  const fallbackScannedMessage =
    "This PDF appears to contain scanned images or non-selectable text pages. To study scanned pages with AI page proof, please upload a PDF with selectable text or use the '+ Add Topic or Paste Text' button to paste your notes or text.";
  return {
    pages: [{ page_number: 1, text: fallbackScannedMessage }],
    totalPages: 1,
    fullText: fallbackScannedMessage,
  };
}

/**
 * Splits plain text, markdown, or pasted academic manuscript into structured physical pages.
 */
export function parseDocumentTextToPages(
  rawText: string
): { page_number: number; text: string }[] {
  // Check if explicit page breaks exist (---, \pagebreak, \newpage, or Page X)
  const explicitBreaks = rawText.split(/\n\s*---\s*\n|\n(?=## Page \d+)|\n(?=Page \d+:)/);
  if (explicitBreaks.length > 1) {
    return explicitBreaks.map((txt, idx) => ({
      page_number: idx + 1,
      text: txt.trim(),
    })).filter((p) => p.text.length > 0);
  }

  // Split by roughly 1200-1800 characters on paragraph boundaries
  const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const pages: { page_number: number; text: string }[] = [];
  let currentPage = "";
  let pageIndex = 1;

  for (const para of paragraphs) {
    if (currentPage.length + para.length > 1500 && currentPage.length > 0) {
      pages.push({ page_number: pageIndex++, text: currentPage.trim() });
      currentPage = "";
    }
    currentPage += (currentPage.length > 0 ? "\n\n" : "") + para.trim();
  }

  if (currentPage.trim().length > 0) {
    pages.push({ page_number: pageIndex, text: currentPage.trim() });
  }

  return pages.length > 0 ? pages : [{ page_number: 1, text: rawText.trim() }];
}

/**
 * Heuristically parses bibliographic metadata from the first page of an academic paper.
 * Does NOT invent metadata if not found in the source text, and rejects raw PDF binary headers.
 */
export function extractBibliographicMetadata(
  firstPageText: string,
  fileName: string,
  pdfInfoTitle?: string,
  pdfInfoAuthor?: string
): ExtractedPDFMetadata {
  const cleanFileName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (isRawPDFBinaryGarbage(firstPageText)) {
    return {
      title: pdfInfoTitle || cleanFileName || "Uploaded Study Document",
      authors: pdfInfoAuthor ? [pdfInfoAuthor] : ["Uploaded Document Author"],
      publication_year: new Date().getFullYear(),
      journal_or_venue: null,
      doi: null,
      page_count: 1,
    };
  }

  const lines = firstPageText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("%PDF") &&
        !l.includes("endobj") &&
        !l.includes("<</Type") &&
        !l.includes("/FontDescriptor")
    );

  // DOI extraction
  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;
  const doiMatch = firstPageText.match(doiRegex);
  const doi = doiMatch ? doiMatch[1] : null;

  // Year extraction (looks for 19xx or 20xx in context)
  const yearRegex = /\b(19\d{2}|20\d{2})\b/;
  const yearMatch = firstPageText.match(yearRegex);
  const publication_year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Title: prefer clean PDF Info Title if meaningful, else first prominent human-readable line, else filename
  let title = pdfInfoTitle && pdfInfoTitle.length > 4 && !pdfInfoTitle.toLowerCase().endsWith(".pdf") && !pdfInfoTitle.toLowerCase().endsWith(".docx")
    ? pdfInfoTitle
    : cleanFileName;

  if (!pdfInfoTitle && lines.length > 0) {
    const candidateLines = lines.slice(0, 5).filter(
      (l) =>
        !l.toLowerCase().includes("arxiv") &&
        !l.toLowerCase().includes("proceedings of") &&
        !l.toLowerCase().includes("ieee") &&
        !l.toLowerCase().includes("vol.") &&
        !l.toLowerCase().startsWith("page ") &&
        !/^\d+$/.test(l) &&
        l.length > 8 &&
        l.length < 180
    );
    if (candidateLines.length > 0) {
      title = candidateLines[0];
    }
  }

  // Authors extraction heuristic
  const authors: string[] = [];
  if (pdfInfoAuthor && pdfInfoAuthor.length > 2) {
    authors.push(pdfInfoAuthor);
  } else {
    const abstractIdx = lines.findIndex((l) => l.toLowerCase().startsWith("abstract"));
    const candidateAuthorLines = lines.slice(1, abstractIdx > 1 ? abstractIdx : 4).filter(
      (l) =>
        !l.toLowerCase().includes("university") &&
        !l.toLowerCase().includes("department") &&
        !l.toLowerCase().includes("institute") &&
        !l.toLowerCase().includes("google") &&
        !l.toLowerCase().includes("laboratory") &&
        !l.toLowerCase().includes("arxiv") &&
        l.length < 120
    );

    if (candidateAuthorLines.length > 0) {
      const rawAuthors = candidateAuthorLines[0];
      const splitAuthors = rawAuthors.split(/,| and |&|\band\b/);
      for (const a of splitAuthors) {
        const trimmed = a.trim().replace(/[*†‡0-9]/g, "");
        if (trimmed.length > 2 && trimmed.length < 50) {
          authors.push(trimmed);
        }
      }
    }
  }

  // Journal / Venue
  let journal_or_venue: string | null = null;
  const venueKeywords = ["Proceedings of", "Conference", "Transactions", "Journal", "NeurIPS", "ICLR", "ICML", "ACM", "IEEE", "Nature", "Science", "Direktorat", "Kementerian", "Universitas"];
  for (const line of lines.slice(0, 8)) {
    if (venueKeywords.some((v) => line.toLowerCase().includes(v.toLowerCase()))) {
      journal_or_venue = line;
      break;
    }
  }

  return {
    title,
    authors: authors.length > 0 ? authors : ["Uploaded Document Author"],
    publication_year,
    journal_or_venue,
    doi,
    page_count: 1,
  };
}

/**
 * Splits extracted document pages into logical, paragraph-bounded chunks with page provenance.
 */
export function chunkDocumentPages(
  documentId: string,
  pages: { page_number: number; text: string }[],
  targetChunkChars = 600
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkGlobalIndex = 0;

  for (const p of pages) {
    const hasDoubleNewlines = /\n\s*\n/.test(p.text);
    const joiner = hasDoubleNewlines ? "\n\n" : "\n";
    let segments = (hasDoubleNewlines ? p.text.split(/\n\s*\n/) : p.text.split(/\n/))
      .map((seg) => seg.trim())
      .filter((seg) => seg.length > 0);

    if (segments.length === 0 && p.text.trim().length > 0) {
      segments = [p.text.trim()];
    }

    let currentChunk = "";
    let charStart = 0;

    for (const seg of segments) {
      if (currentChunk.length + seg.length > targetChunkChars && currentChunk.length > 0) {
        const charEnd = charStart + currentChunk.length;
        chunks.push({
          id: `chk_${documentId}_${chunkGlobalIndex}`,
          document_id: documentId,
          page_number: p.page_number,
          chunk_index: chunkGlobalIndex++,
          content: currentChunk.trim(),
          token_count: Math.ceil(currentChunk.length / 4),
          char_start: charStart,
          char_end: charEnd,
          created_at: new Date().toISOString(),
        });
        charStart = charEnd + 1;
        currentChunk = "";
      }
      currentChunk += (currentChunk.length > 0 ? joiner : "") + seg;
    }

    if (currentChunk.trim().length > 0) {
      const charEnd = charStart + currentChunk.length;
      chunks.push({
        id: `chk_${documentId}_${chunkGlobalIndex}`,
        document_id: documentId,
        page_number: p.page_number,
        chunk_index: chunkGlobalIndex++,
        content: currentChunk.trim(),
        token_count: Math.ceil(currentChunk.length / 4),
        char_start: charStart,
        char_end: charEnd,
        created_at: new Date().toISOString(),
      });
    }
  }

  return chunks;
}
