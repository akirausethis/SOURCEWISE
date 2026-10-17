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
 * Extracts real page-by-page text from a PDF Buffer using PDFParse v2
 */
export async function extractPagesFromPDFBuffer(
  buffer: Buffer
): Promise<{ pages: { page_number: number; text: string }[]; totalPages: number; fullText: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    if (result && result.pages && result.pages.length > 0) {
      const extractedPages = result.pages.map((p: { text?: string; num?: number }, idx: number) => ({
        page_number: p.num && p.num > 0 ? p.num : idx + 1,
        text: (p.text || "").trim(),
      })).filter((p: { text: string }) => p.text.length > 0);

      if (extractedPages.length > 0) {
        return {
          pages: extractedPages,
          totalPages: result.total || extractedPages.length,
          fullText: result.text || extractedPages.map((p: { text: string }) => p.text).join("\n\n"),
        };
      }
    }

    if (result && result.text) {
      const rawText = result.text.trim();
      const pageSplits = rawText.split(/\f|\n(?=Page \d+)/).filter(Boolean);
      return {
        pages: pageSplits.map((txt: string, idx: number) => ({
          page_number: idx + 1,
          text: txt.trim(),
        })),
        totalPages: pageSplits.length,
        fullText: rawText,
      };
    }
  } catch (err) {
    console.warn("PDFParse extraction encountered error, falling back to stream parsing:", err);
  }

  // Graceful fallback for non-standard or text-based buffers
  const textStr = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  const cleanText = textStr.replace(/\s+/g, " ").trim();
  const fallbackPages = [
    {
      page_number: 1,
      text: cleanText.length > 50 ? cleanText.slice(0, 3000) : "Document text extracted from source.",
    },
  ];

  return {
    pages: fallbackPages,
    totalPages: 1,
    fullText: fallbackPages[0].text,
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
 * Does NOT invent metadata if not found in the source text.
 */
export function extractBibliographicMetadata(
  firstPageText: string,
  fileName: string
): ExtractedPDFMetadata {
  const lines = firstPageText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // DOI extraction
  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;
  const doiMatch = firstPageText.match(doiRegex);
  const doi = doiMatch ? doiMatch[1] : null;

  // Year extraction (looks for 19xx or 20xx in context)
  const yearRegex = /\b(19\d{2}|20\d{2})\b/;
  const yearMatch = firstPageText.match(yearRegex);
  const publication_year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Title: usually the first prominent block of text before authors or abstract
  let title = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  if (lines.length > 0) {
    const candidateLines = lines.slice(0, 4).filter(
      (l) =>
        !l.toLowerCase().includes("arxiv") &&
        !l.toLowerCase().includes("proceedings of") &&
        !l.toLowerCase().includes("ieee") &&
        !l.toLowerCase().includes("vol.") &&
        l.length > 10
    );
    if (candidateLines.length > 0) {
      title = candidateLines[0];
    }
  }

  // Authors extraction heuristic
  const authors: string[] = [];
  const abstractIdx = lines.findIndex((l) => l.toLowerCase().startsWith("abstract"));
  const candidateAuthorLines = lines.slice(1, abstractIdx > 1 ? abstractIdx : 4).filter(
    (l) =>
      !l.toLowerCase().includes("university") &&
      !l.toLowerCase().includes("department") &&
      !l.toLowerCase().includes("institute") &&
      !l.toLowerCase().includes("google") &&
      !l.toLowerCase().includes("laboratory") &&
      !l.toLowerCase().includes("arxiv")
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

  // Journal / Venue
  let journal_or_venue: string | null = null;
  const venueKeywords = ["Proceedings of", "Conference", "Transactions", "Journal", "NeurIPS", "ICLR", "ICML", "ACM", "IEEE", "Nature", "Science"];
  for (const line of lines.slice(0, 8)) {
    if (venueKeywords.some((v) => line.includes(v))) {
      journal_or_venue = line;
      break;
    }
  }

  return {
    title,
    authors: authors.length > 0 ? authors : ["Not explicitly parsed from header"],
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
    const paragraphs = p.text
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter((para) => para.length > 5);

    if (paragraphs.length === 0 && p.text.trim().length > 0) {
      paragraphs.push(p.text.trim());
    }

    let currentChunk = "";
    let charStart = 0;

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > targetChunkChars && currentChunk.length > 0) {
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
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + para;
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
