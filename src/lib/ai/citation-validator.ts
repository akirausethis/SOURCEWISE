import { Citation, DocumentChunk, DocumentPage } from "@/types";

export interface ValidationResult {
  validCitations: Citation[];
  rejectedCitations: {
    rawCitation: Partial<Citation>;
    reason: string;
  }[];
}

/**
 * Normalizes text for robust fuzzy comparison (lowercasing, collapsing whitespace, stripping punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validates candidate citations against real persisted document pages and chunks.
 * Enforces Part 9 requirements:
 * 1. Checks that document exists.
 * 2. Checks that page number exists for that document.
 * 3. Checks that the quoted passage actually appears in the text content of that page/chunk.
 */
export function validateCitations(
  candidateCitations: Partial<Citation>[],
  pages: DocumentPage[],
  chunks: DocumentChunk[]
): ValidationResult {
  const validCitations: Citation[] = [];
  const rejectedCitations: { rawCitation: Partial<Citation>; reason: string }[] = [];

  for (const c of candidateCitations) {
    if (!c.document_id || !c.page_number || !c.passage_quote) {
      rejectedCitations.push({
        rawCitation: c,
        reason: "Incomplete citation fields (missing document ID, page, or quote).",
      });
      continue;
    }

    // 1. Locate the physical page
    const page = pages.find(
      (p) => p.document_id === c.document_id && p.page_number === c.page_number
    );

    if (!page) {
      // Check if page exists anywhere in document
      const anyDocPage = pages.find((p) => p.document_id === c.document_id);
      if (!anyDocPage) {
        rejectedCitations.push({
          rawCitation: c,
          reason: `Document ID "${c.document_id}" not found in authorized collection.`,
        });
      } else {
        rejectedCitations.push({
          rawCitation: c,
          reason: `Page ${c.page_number} does not exist in document "${c.document_id}".`,
        });
      }
      continue;
    }

    // 2. Check if the quoted passage exists on this page
    const normQuote = normalizeText(c.passage_quote);
    const normPageText = normalizeText(page.text_content);

    // If quote is too short to be unique (e.g. fewer than 10 chars), reject
    if (normQuote.length < 10) {
      rejectedCitations.push({
        rawCitation: c,
        reason: "Quoted passage is too short to establish authentic provenance.",
      });
      continue;
    }

    const matchesPage = normPageText.includes(normQuote);

    // Also check chunks for partial overlap if page formatting differed slightly
    const matchingChunk = chunks.find(
      (chk) =>
        chk.document_id === c.document_id &&
        chk.page_number === c.page_number &&
        (normalizeText(chk.content).includes(normQuote) ||
          normQuote.includes(normalizeText(chk.content).slice(0, 40)))
    );

    if (matchesPage || matchingChunk) {
      validCitations.push({
        id: c.id || `cit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        document_id: c.document_id,
        document_title: c.document_title,
        page_number: c.page_number,
        passage_quote: c.passage_quote.trim(),
        confidence: c.confidence ?? 1.0,
        verified: true,
      });
    } else {
      rejectedCitations.push({
        rawCitation: c,
        reason: `Passage quote could not be verified in the actual text of page ${c.page_number}.`,
      });
    }
  }

  return { validCitations, rejectedCitations };
}
