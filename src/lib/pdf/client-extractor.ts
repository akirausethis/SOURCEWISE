import { AcademicPaper, DocumentPage, DocumentChunk } from "@/types";
import { cleanChunkForDisplay } from "@/lib/ai/gemini";

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
): { page_number: number; text: string; image_url?: string }[] {
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
    !pdfInfoTitle.toLowerCase().endsWith(".docx") &&
    !pdfInfoTitle.toLowerCase().startsWith("microsoft word") &&
    !pdfInfoTitle.toLowerCase().startsWith("powerpoint")
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
    // 1. Check for parenthesized or labeled academic author on the first page, e.g. "(Prof. Imam Sudiyat, S.H.)" or "Penyusun: ..."
    const parenAuthorMatch = firstPageText.match(
      /\(((?:Prof\.|Dr\.|Ir\.|H\.|Hj\.| Drs\.|Dra\.)[^)\n]{3,65})\)/i
    );
    const labeledAuthorMatch = firstPageText.match(
      /(?:Oleh|Penyusun|Penulis|Author)\s*[:\-]\s*([^\n]{3,65})/i
    );
    if (parenAuthorMatch && parenAuthorMatch[1]) {
      authors.push(parenAuthorMatch[1].trim());
    } else if (labeledAuthorMatch && labeledAuthorMatch[1]) {
      authors.push(labeledAuthorMatch[1].trim());
    } else {
      const abstractIdx = lines.findIndex((l) => l.toLowerCase().startsWith("abstract"));
      const candidateAuthorLines = lines
        .slice(1, abstractIdx > 1 ? abstractIdx : 4)
        .filter(
          (l) =>
            !/^\d+[.)]/.test(l) &&
            !/^[a-z][.)]\s/i.test(l) &&
            !/^(bab|pendahuluan|daftar isi|kegiatan pembelajaran|masa kompeni|sejarah)/i.test(l) &&
            !l.toLowerCase().includes("university") &&
            !l.toLowerCase().includes("department") &&
            !l.toLowerCase().includes("institute") &&
            !l.toLowerCase().includes("laboratory") &&
            !l.toLowerCase().includes("arxiv") &&
            l.length < 90
        );

      if (candidateAuthorLines.length > 0) {
        const rawAuthors = candidateAuthorLines[0];
        const splitAuthors = rawAuthors.split(/,| and |&|\band\b/);
        for (const a of splitAuthors) {
          const trimmed = a.trim().replace(/[*†‡0-9()]/g, "").replace(/^[.\-\s]+|[.\-\s]+$/g, "");
          if (trimmed.length > 2 && trimmed.length < 50) {
            authors.push(trimmed);
          }
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

  const cleanTitle = (title || cleanFileName || "Uploaded Document")
    .replace(/^[|¦\s•\-–—]+/, "")
    .replace(/[|¦\s]+$/, "")
    .replace(/\s*\([^)]*S\.H\.[^)]*\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const cleanAuthors = (authors.length > 0 ? authors : ["Document Author"]).map(
    (a) =>
      a
        .replace(/^[|¦(\s]+/, "")
        .replace(/[|¦)\s]+$/, "")
        .trim() || "Document Author"
  );

  return {
    title: cleanTitle || cleanFileName || "Uploaded Document",
    authors: cleanAuthors,
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
 * Extracts text pages, visual page images, metadata, and chunks from a File (.pdf, .txt, .md, .tex) directly in the browser.
 * Supports BOTH digital text PDFs and scanned image-only PDFs (via Gemini Vision OCR + Tesseract.js browser OCR fallback).
 */
export async function extractDocumentInBrowser(
  file: File,
  projectId: string,
  onProgress?: (status: string) => void
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

  let rawPages: { page_number: number; text: string; image_url?: string }[] = [];
  let pdfInfoTitle: string | undefined;
  let pdfInfoAuthor: string | undefined;

  if (isPDF) {
    onProgress?.("📄 Opening PDF in browser...");
    const arrayBuffer = await file.arrayBuffer();
    const { getDocumentProxy, getMeta } = await import("unpdf");

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

    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer.slice(0)));
    const totalPages = pdf.numPages || 1;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(`📄 Reading PDF page ${pageNum} of ${totalPages}...`);
      const page = await pdf.getPage(pageNum);

      // 1. Extract embedded text layer if present
      let pageText = "";
      try {
        const textContent = await page.getTextContent();
        pageText = (textContent.items || [])
          .map((item) => {
            if ("str" in item && typeof item.str === "string") {
              const eol = "hasEOL" in item && item.hasEOL ? "\n" : " ";
              return item.str + eol;
            }
            return "";
          })
          .join("")
          .replace(/[ \t]+/g, " ")
          .replace(/ ?\n ?/g, "\n")
          .trim();
        if (isRawPDFBinaryGarbageClient(pageText)) {
          pageText = "";
        }
      } catch {
        pageText = "";
      }

      // 2. Render visual PDF page onto canvas in browser (up to 60 pages) so the user always sees their REAL PDF on every page
      let pageImageUrl: string | undefined;
      if (typeof document !== "undefined" && pageNum <= 60) {
        try {
          const viewport = page.getViewport({ scale: 1.15 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({
              canvas,
              canvasContext: ctx,
              viewport,
            }).promise;
            pageImageUrl = canvas.toDataURL("image/jpeg", 0.65);
          }
        } catch (renderErr) {
          console.warn(`Canvas render skipped for page ${pageNum}:`, renderErr);
        }
      }

      rawPages.push({
        page_number: pageNum,
        text: pageText,
        image_url: pageImageUrl,
      });
    }

    // 3. If ANY pages in the PDF are scanned images with little or no selectable text, run OCR on ALL of them!
    const pagesMissingText = rawPages.filter((p) => p.text.length < 25 && Boolean(p.image_url));
    if (pagesMissingText.length > 0) {
      // 3A. First try fast Gemini Vision OCR via /api/papers in batches of 6 pages if an API key is configured
      try {
        const userStoredKey =
          typeof window !== "undefined" ? localStorage.getItem("sourcewise_gemini_key") : null;
        for (let bStart = 0; bStart < pagesMissingText.length; bStart += 6) {
          const batch = pagesMissingText.slice(bStart, bStart + 6);
          onProgress?.(
            `🔍 Scanned PDF detected — running AI Vision OCR (pages ${batch[0].page_number}–${batch[batch.length - 1].page_number} of ${totalPages})...`
          );
          const ocrRes = await fetch("/api/papers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ocr_pages",
              apiKey: userStoredKey || undefined,
              scannedPages: batch.map((p) => ({
                page_number: p.page_number,
                dataUrl: p.image_url,
              })),
            }),
          });
          if (ocrRes.ok) {
            const ocrData = await ocrRes.json();
            if (Array.isArray(ocrData.ocrPages) && ocrData.ocrPages.length > 0) {
              for (const item of ocrData.ocrPages) {
                const target = rawPages.find((rp) => rp.page_number === item.page_number);
                if (target && item.text && item.text.trim().length > 10) {
                  target.text = item.text.trim();
                }
              }
            } else {
              // No server/user Gemini key active; switch immediately to browser Tesseract OCR for all pages
              break;
            }
          } else {
            break;
          }
        }
      } catch {
        // Proceed to browser Tesseract OCR fallback
      }

      // 3B. Browser Tesseract.js OCR fallback for ALL remaining scanned pages (no 10-page cap!)
      const stillEmptyPages = rawPages.filter((p) => p.text.length < 25 && Boolean(p.image_url));

      if (stillEmptyPages.length > 0 && typeof window !== "undefined") {
        try {
          const Tesseract = await import("tesseract.js");
          const createWorker =
            Tesseract.createWorker ||
            (Tesseract as unknown as { default?: { createWorker?: typeof Tesseract.createWorker } })
              .default?.createWorker;
          if (createWorker) {
            onProgress?.("🔍 Loading OCR engine to read all scanned pages...");
            const worker = await createWorker("ind+eng");
            for (let idx = 0; idx < stillEmptyPages.length; idx++) {
              const targetPage = stillEmptyPages[idx];
              onProgress?.(
                `🔍 Reading text from scanned page ${targetPage.page_number} of ${totalPages} (${idx + 1}/${stillEmptyPages.length})...`
              );
              if (targetPage.image_url) {
                const {
                  data: { text },
                } = await worker.recognize(targetPage.image_url);
                const cleanedOcr = (text || "")
                  .replace(/[ \t]+/g, " ")
                  .replace(/\n{3,}/g, "\n\n")
                  .trim();
                if (cleanedOcr.length > 10) {
                  targetPage.text = cleanedOcr;
                }
              }
            }
            await worker.terminate();
          }
        } catch (tessErr) {
          console.warn("Browser Tesseract OCR fallback encountered error:", tessErr);
        }
      }

      hasSelectableText = rawPages.some((p) => p.text.trim().length > 15);
    }

    // Ensure every physical page of the PDF is preserved in the reader and clean any OCR artifacts / outline structure
    rawPages = rawPages.map((p) => {
      const cleaned = cleanChunkForDisplay(p.text);
      return {
        ...p,
        text:
          cleaned.length > 0
            ? cleaned
            : p.text.trim().length > 0
              ? p.text.trim()
              : `[Visual Page ${p.page_number} from "${file.name.replace(/\.[^/.]+$/, "")}"]`,
      };
    });
  } else {
    const rawText = await file.text();
    rawPages = splitTextToPagesClient(rawText);
  }

  const fullTextSample = rawPages
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

  const pages: DocumentPage[] = rawPages.map((p) => ({
    id: `page_${paperId}_${p.page_number}`,
    document_id: paperId,
    page_number: p.page_number,
    char_count: p.text.length,
    text_content: p.text,
    image_url: p.image_url,
    created_at: new Date().toISOString(),
  }));

  const extractedPages = pages.map((p) => ({
    page_number: p.page_number,
    text: p.text_content,
  }));

  const chunks = chunkPagesClient(paperId, extractedPages);

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
    hasSelectableText: pages.length > 0,
  };
}

/**
 * Runs on-demand OCR on a single rendered PDF page dataUrl (via Gemini Vision API if available, or Tesseract.js in browser).
 */
export async function ocrSinglePageImageInBrowser(
  pageNumber: number,
  imageUrl: string
): Promise<string> {
  if (!imageUrl || typeof window === "undefined") return "";

  try {
    const userStoredKey = localStorage.getItem("sourcewise_gemini_key");
    const ocrRes = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ocr_pages",
        apiKey: userStoredKey || undefined,
        scannedPages: [{ page_number: pageNumber, dataUrl: imageUrl }],
      }),
    });
    if (ocrRes.ok) {
      const ocrData = await ocrRes.json();
      if (Array.isArray(ocrData.ocrPages) && ocrData.ocrPages[0]?.text) {
        const cleaned = cleanChunkForDisplay(ocrData.ocrPages[0].text);
        if (cleaned.length > 15) return cleaned;
      }
    }
  } catch {
    // Fallback to Tesseract
  }

  try {
    const Tesseract = await import("tesseract.js");
    const createWorker =
      Tesseract.createWorker ||
      (Tesseract as unknown as { default?: { createWorker?: typeof Tesseract.createWorker } })
        .default?.createWorker;
    if (createWorker) {
      const worker = await createWorker("ind+eng");
      const {
        data: { text },
      } = await worker.recognize(imageUrl);
      await worker.terminate();
      const cleaned = cleanChunkForDisplay(text || "");
      if (cleaned.length > 10) return cleaned;
    }
  } catch (err) {
    console.warn("Single-page OCR error:", err);
  }

  return "";
}

