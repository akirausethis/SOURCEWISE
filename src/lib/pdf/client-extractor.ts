import { AcademicPaper, DocumentPage, DocumentChunk } from "@/types";

/**
 * Checks if a string looks like raw PDF binary/dictionary syntax rather than human-readable text.
 */
export function isRawPDFBinaryGarbageClient(str: string): boolean {
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
 * Splits plain text or markdown into structured pages (~1500 chars per page).
 */
export function splitTextToPagesClient(
  rawText: string
): { page_number: number; text: string }[] {
  const explicitBreaks = rawText.split(
    /\n\s*---\s*\n|\n(?=## Page \d+)|\n(?=Page \d+:)/
  );
  if (explicitBreaks.length > 1) {
    return explicitBreaks
      .map((txt, idx) => ({
        page_number: idx + 1,
        text: txt.trim(),
      }))
      .filter((p) => p.text.length > 0);
  }

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
 * Extracts bibliographic metadata from the first page text and filename.
 */
export function extractMetadataClient(
  firstPageText: string,
  fileName: string,
  pdfInfoTitle?: string,
  pdfInfoAuthor?: string
) {
  const cleanFileName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (isRawPDFBinaryGarbageClient(firstPageText)) {
    return {
      title: pdfInfoTitle || cleanFileName || "Uploaded Study Document",
      authors: pdfInfoAuthor ? [pdfInfoAuthor] : ["Uploaded Document Author"],
      publication_year: new Date().getFullYear(),
      journal_or_venue: null as string | null,
      doi: null as string | null,
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

  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;
  const doiMatch = firstPageText.match(doiRegex);
  const doi = doiMatch ? doiMatch[1] : null;

  const yearRegex = /\b(19\d{2}|20\d{2})\b/;
  const yearMatch = firstPageText.match(yearRegex);
  const publication_year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  let title =
    pdfInfoTitle &&
    pdfInfoTitle.length > 4 &&
    !pdfInfoTitle.toLowerCase().endsWith(".pdf") &&
    !pdfInfoTitle.toLowerCase().endsWith(".docx")
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

  const authors: string[] = [];
  if (pdfInfoAuthor && pdfInfoAuthor.length > 2) {
    authors.push(pdfInfoAuthor);
  } else {
    const abstractIdx = lines.findIndex((l) => l.toLowerCase().startsWith("abstract"));
    const candidateAuthorLines = lines
      .slice(1, abstractIdx > 1 ? abstractIdx : 4)
      .filter(
        (l) =>
          !l.toLowerCase().includes("university") &&
          !l.toLowerCase().includes("department") &&
          !l.toLowerCase().includes("institute") &&
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

  let journal_or_venue: string | null = null;
  const venueKeywords = [
    "Proceedings of",
    "Conference",
    "Transactions",
    "Journal",
    "Jurnal",
    "NeurIPS",
    "ICLR",
    "ICML",
    "ACM",
    "IEEE",
    "Nature",
    "Science",
    "Direktorat",
    "Kementerian",
    "Universitas",
    "Fakultas",
  ];
  for (const line of lines.slice(0, 8)) {
    if (venueKeywords.some((v) => line.toLowerCase().includes(v.toLowerCase()))) {
      journal_or_venue = line;
      break;
    }
  }

  return {
    title: title || cleanFileName || "Uploaded Document",
    authors: authors.length > 0 ? authors : ["Document Author"],
    publication_year,
    journal_or_venue,
    doi,
  };
}

/**
 * Splits extracted document pages into paragraph-bounded chunks with page numbers.
 */
export function chunkPagesClient(
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

/**
 * Extracts text pages, metadata, and chunks from a File (.pdf, .txt, .md, .tex) directly in the browser.
 * This completely bypasses Vercel's 4.5 MB Serverless request body limit for large PDFs.
 */
export async function extractDocumentInBrowser(
  file: File,
  projectId: string
): Promise<{
  paper: AcademicPaper;
  pages: DocumentPage[];
  chunks: DocumentChunk[];
  extractedPages: { page_number: number; text: string }[];
  pdfInfoTitle?: string;
  pdfInfoAuthor?: string;
  hasSelectableText: boolean;
}> {
  const fileNameLower = file.name.toLowerCase();
  const isPDF = fileNameLower.endsWith(".pdf");
  const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let extractedPages: { page_number: number; text: string }[] = [];
  let pdfInfoTitle: string | undefined;
  let pdfInfoAuthor: string | undefined;
  let hasSelectableText = false;

  if (isPDF) {
    const arrayBuffer = await file.arrayBuffer();
    const { extractText, getMeta } = await import("unpdf");

    try {
      const meta = await getMeta(new Uint8Array(arrayBuffer.slice(0)));
      const info = meta?.info as Record<string, unknown> | undefined;
      if (info?.Title && typeof info.Title === "string" && !isRawPDFBinaryGarbageClient(info.Title)) {
        pdfInfoTitle = info.Title.replace(/\s+/g, " ").trim();
      }
      if (info?.Author && typeof info.Author === "string" && !isRawPDFBinaryGarbageClient(info.Author)) {
        pdfInfoAuthor = info.Author.replace(/\s+/g, " ").trim();
      }
    } catch {
      // Metadata dictionary is optional
    }

    const extracted = await extractText(new Uint8Array(arrayBuffer.slice(0)), {
      mergePages: false,
    });

    if (extracted && Array.isArray(extracted.text) && extracted.text.length > 0) {
      extractedPages = extracted.text
        .map((pageText: string, idx: number) => ({
          page_number: idx + 1,
          text: (pageText || "").trim(),
        }))
        .filter((p) => p.text.length > 0 && !isRawPDFBinaryGarbageClient(p.text));
    }

    hasSelectableText = extractedPages.length > 0;
  } else {
    const rawText = await file.text();
    extractedPages = splitTextToPagesClient(rawText);
    hasSelectableText = extractedPages.length > 0;
  }

  const fullTextSample = extractedPages
    .slice(0, 3)
    .map((p) => p.text)
    .join("\n\n")
    .slice(0, 3000);

  const meta = extractMetadataClient(
    fullTextSample,
    file.name,
    pdfInfoTitle,
    pdfInfoAuthor
  );

  const pages: DocumentPage[] = extractedPages.map((p) => ({
    id: `page_${paperId}_${p.page_number}`,
    document_id: paperId,
    page_number: p.page_number,
    char_count: p.text.length,
    text_content: p.text,
    created_at: new Date().toISOString(),
  }));

  const chunks = chunkPagesClient(
    paperId,
    pages.map((p) => ({ page_number: p.page_number, text: p.text_content }))
  );

  const paper: AcademicPaper = {
    id: paperId,
    project_id: projectId || "proj_pedagogy_ai",
    user_id: "usr_researcher_01",
    title: meta.title,
    authors: meta.authors,
    publication_year: meta.publication_year,
    journal_or_venue: meta.journal_or_venue,
    doi: meta.doi,
    file_path: `/uploads/${file.name}`,
    file_size_bytes: file.size,
    file_hash: `sha256_${Date.now()}`,
    page_count: pages.length,
    processing_status: "ready",
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    paper,
    pages,
    chunks,
    extractedPages,
    pdfInfoTitle,
    pdfInfoAuthor,
    hasSelectableText,
  };
}
