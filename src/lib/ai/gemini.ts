import { GoogleGenAI } from "@google/genai";
import { Citation, DocumentChunk, DocumentPage, AcademicPaper } from "@/types";
import { validateCitations } from "./citation-validator";

export interface AIResearchQueryInput {
  question: string;
  projectId: string;
  papers: AcademicPaper[];
  chunks: DocumentChunk[];
  pages: DocumentPage[];
}

export interface AIResearchResponse {
  content: string;
  citations: Citation[];
  interpretation?: string;
  uncertainty?: string;
  isGrounded: boolean;
  modelUsed: string;
}

/**
 * Searches and ranks document chunks by keyword relevance to the question.
 */
function rankEvidenceChunks(chunks: DocumentChunk[], question: string, topK = 6): DocumentChunk[] {
  const queryTerms = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map((chunk) => {
    const textLower = chunk.content.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 2;
        // Boost if term appears multiple times
        const occurrences = (textLower.match(new RegExp(term, "g")) || []).length;
        score += Math.min(occurrences, 3);
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, topK).map((s) => s.chunk);
}

/**
 * Main query entry point for the SOURCEWISE Evidence-Grounded Assistant.
 */
export async function queryResearchAssistant(
  input: AIResearchQueryInput
): Promise<AIResearchResponse> {
  const { question, papers, chunks, pages } = input;

  // 1. Retrieve & rank authorized evidence chunks
  const relevantChunks = rankEvidenceChunks(chunks, question, 6);

  if (relevantChunks.length === 0) {
    return {
      content:
        "No directly relevant evidence passages were found in your current project paper collection for this inquiry. Please upload relevant literature or broaden your search terms.",
      citations: [],
      uncertainty:
        "The current paper collection does not contain keywords matching this inquiry. External literature validation is recommended.",
      isGrounded: true,
      modelUsed: "Sourcewise Evidence Gate (Deterministic)",
    };
  }

  // 2. Prepare context payload
  const paperTitleMap = new Map(papers.map((p) => [p.id, p.title]));
  const evidenceContext = relevantChunks
    .map(
      (chk, i) =>
        `[EVIDENCE #${i + 1}] Document ID: ${chk.document_id} ("${paperTitleMap.get(chk.document_id) || "Untitled"}") | Page: ${chk.page_number}\nText: "${chk.content}"`
    )
    .join("\n\n");

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

      const prompt = `You are SOURCEWISE, a rigorous academic research workspace assistant.
Answer the user's research inquiry strictly using the provided EVIDENCE chunks below.

CRITICAL RULES:
1. Every factual claim must be backed by a verbatim quote and citation from the provided evidence.
2. In the 'citations' array, include:
   - document_id: exact Document ID string from evidence
   - page_number: exact page integer from evidence
   - passage_quote: exact verbatim text quotation from that page
3. If the evidence does not fully address the question, explicitly state the limitation in 'uncertainty' and DO NOT guess or hallucinate.
4. Output strictly valid JSON matching this schema:
{
  "answer": "Clear academic synthesis with bracketed references like [1], [2]",
  "interpretation": "Explanation of methodology, implications, or theoretical significance",
  "uncertainty": "Known limitations or gaps in the provided text",
  "citations": [
    {
      "document_id": "string",
      "page_number": 1,
      "passage_quote": "exact quote from evidence"
    }
  ]
}

USER INQUIRY:
${question}

AUTHORIZED EVIDENCE:
${evidenceContext}
`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || "";
      if (responseText) {
        const parsed = JSON.parse(responseText);

        // Map paper titles onto candidate citations
        const candidates = (parsed.citations || []).map((c: Partial<Citation>) => ({
          ...c,
          document_title: c.document_id ? paperTitleMap.get(c.document_id) : undefined,
        }));

        // Validate all citations against actual stored pages and chunks
        const { validCitations } = validateCitations(candidates, pages, chunks);

        return {
          content: parsed.answer || "Synthesis complete based on authorized evidence.",
          citations: validCitations,
          interpretation: parsed.interpretation,
          uncertainty: parsed.uncertainty,
          isGrounded: true,
          modelUsed: `Gemini (${model})`,
        };
      }
    } catch (err) {
      console.warn("Live Gemini API call failed or timed out, falling back to deterministic synthesizer:", err);
    }
  }

  // 3. Fallback: Deterministic Evidence-Grounded Synthesizer
  // Guarantees zero downtime, 100% verified citations, and absolute evidence grounding!
  const candidateCitations: Partial<Citation>[] = relevantChunks.map((chk) => ({
    document_id: chk.document_id,
    document_title: paperTitleMap.get(chk.document_id),
    page_number: chk.page_number,
    passage_quote: chk.content.slice(0, 200).trim(),
    confidence: 1.0,
  }));

  const { validCitations } = validateCitations(candidateCitations, pages, chunks);

  const synthesisPoints = relevantChunks.map((chk, i) => {
    const docTitle = paperTitleMap.get(chk.document_id) || "Source Document";
    return `• According to **${docTitle}** (Page ${chk.page_number}):\n  "${chk.content}" [${i + 1}]`;
  });

  return {
    content: `Based on verified passages extracted from your project literature:\n\n${synthesisPoints.join(
      "\n\n"
    )}`,
    citations: validCitations,
    interpretation:
      "Direct cross-paper evidence synthesis extracted from your uploaded literature collection.",
    uncertainty:
      "This analysis reflects only the explicit statements in your current project collection. Broader literature review is recommended for consensus verification.",
    isGrounded: true,
    modelUsed: "Sourcewise Grounded Synthesizer (Rule-Based)",
  };
}
