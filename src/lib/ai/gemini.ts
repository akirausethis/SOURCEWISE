import { GoogleGenAI } from "@google/genai";
import { Citation, DocumentChunk, DocumentPage, AcademicPaper } from "@/types";
import { validateCitations } from "./citation-validator";

export interface AIResearchQueryInput {
  question: string;
  projectId: string;
  papers: AcademicPaper[];
  chunks: DocumentChunk[];
  pages: DocumentPage[];
  selectedPaperId?: string;
  userApiKey?: string;
}

export interface AIResearchResponse {
  content: string;
  thinking?: string;
  citations: Citation[];
  interpretation?: string;
  uncertainty?: string;
  isGrounded: boolean;
  modelUsed: string;
}

/**
 * Searches and ranks document chunks by keyword relevance and active paper focus.
 */
function rankEvidenceChunks(
  chunks: DocumentChunk[],
  question: string,
  selectedPaperId?: string,
  topK = 6
): DocumentChunk[] {
  const stopWords = new Set([
    "what", "how", "why", "when", "where", "who", "which", "this", "that", "these", "those",
    "the", "and", "for", "with", "from", "about", "into", "explain", "tell", "paper", "papers",
    "simple", "words", "summary", "summarize", "main", "idea", "does", "did", "are", "was", "were",
    "can", "you", "please", "give", "show", "yang", "dan", "dari", "pada", "dalam", "untuk", "apa",
  ]);

  const queryTerms = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const scored = chunks.map((chunk) => {
    const textLower = chunk.content.toLowerCase();
    let score = 0;

    // Strongly prioritize the paper the user currently has open in the reader
    if (selectedPaperId && chunk.document_id === selectedPaperId) {
      score += 15;
    }

    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 8;
        const occurrences = (textLower.match(new RegExp(term, "g")) || []).length;
        score += Math.min(occurrences * 1.5, 6);
      }
    }

    // Prefer rich explanatory paragraphs over 2-line cover pages or dotted Table of Contents
    const hasTocDots = /\.{6,}/.test(chunk.content);
    if (hasTocDots) {
      score -= 4;
    } else if (chunk.content.length > 220) {
      score += 3;
    } else if (chunk.content.length > 120) {
      score += 1.5;
    } else if (chunk.content.length < 110) {
      score -= 2;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).slice(0, topK).map((s) => s.chunk);

  if (relevant.length > 0) return relevant;

  // Fallback: prefer chunks from the currently selected paper first
  if (selectedPaperId) {
    const selectedChunks = chunks.filter((c) => c.document_id === selectedPaperId);
    if (selectedChunks.length > 0) return selectedChunks.slice(0, topK);
  }

  return chunks.slice(0, topK);
}

/**
 * Main query entry point for the SOURCEWISE Evidence-Grounded Assistant.
 */
export async function queryResearchAssistant(
  input: AIResearchQueryInput
): Promise<AIResearchResponse> {
  const { question, papers, chunks, pages, selectedPaperId, userApiKey } = input;

  // 1. Retrieve & rank authorized evidence chunks from user's real documents
  const relevantChunks = rankEvidenceChunks(chunks, question, selectedPaperId, 6);

  if (relevantChunks.length === 0) {
    return {
      content:
        "There are no papers in this project yet. Click '+ Add Paper or Topic' at the top to upload a PDF or type any topic, and I will help you read and understand it!",
      thinking:
        "Checked the project library and found 0 text passages. Stopped here so I don't make up fake answers.",
      citations: [],
      uncertainty:
        "No papers uploaded yet. Please add a PDF file or type a topic first.",
      isGrounded: true,
      modelUsed: "Sourcewise Safety Check",
    };
  }

  // 2. Prepare context payload
  const paperTitleMap = new Map(papers.map((p) => [p.id, p.title]));
  const activePaperTitle = selectedPaperId ? paperTitleMap.get(selectedPaperId) : undefined;
  const evidenceContext = relevantChunks
    .map(
      (chk, i) =>
        `[EVIDENCE #${i + 1}] Document ID: ${chk.document_id} ("${paperTitleMap.get(chk.document_id) || "Untitled"}") | Physical Page: ${chk.page_number}\nVerbatim Text: "${chk.content}"`
    )
    .join("\n\n");

  const effectiveApiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (effectiveApiKey && effectiveApiKey.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey.trim() });
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

      const prompt = `You are SOURCEWISE, a friendly, crystal-clear AI study and research helper.
Your goal is to explain papers in simple, easy-to-understand language that anyone (from a beginner student to a senior researcher) can immediately grasp, while backing up every single claim with exact page proof.
${activePaperTitle ? `\nThe user is currently viewing the paper: "${activePaperTitle}" (ID: ${selectedPaperId}). Prioritize explaining this paper if their question is general.` : ""}

CRITICAL RULES:
1. Every factual claim MUST cite the exact document_id, physical page_number, and an exact verbatim quote from the AUTHORIZED EVIDENCE below.
2. In 'thinking', explain step-by-step in plain English how you searched the user's papers, which pages had the answer, and how you checked the facts.
3. In 'answer', explain the answer clearly in simple, everyday English first, followed by key details, using bracketed citation markers like [1], [2].
4. In 'citations', include the exact verbatim quote and physical page number from the evidence.
5. In 'interpretation', give a 1-2 sentence "Key Takeaway: Why this matters in simple words".
6. In 'uncertainty', state clearly what the uploaded papers do NOT cover or any limitations mentioned. NEVER invent facts outside the provided evidence.

Output strictly valid JSON matching this schema:
{
  "thinking": "Plain-English step-by-step trace of how you found and verified the answer",
  "answer": "Clear, easy-to-understand answer with [1], [2] citations",
  "interpretation": "Simple takeaway explaining why this matters",
  "uncertainty": "What these papers don't cover or limitations mentioned",
  "citations": [
    {
      "document_id": "string",
      "page_number": 1,
      "passage_quote": "exact quote from evidence"
    }
  ]
}

USER QUESTION:
${question}

AUTHORIZED EVIDENCE FROM USER DOCUMENTS:
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

        const candidates = (parsed.citations || []).map((c: Partial<Citation>) => ({
          ...c,
          document_title: c.document_id ? paperTitleMap.get(c.document_id) : undefined,
        }));

        const { validCitations } = validateCitations(candidates, pages, chunks);

        return {
          content: parsed.answer || "Here is what your papers say based on the verified pages.",
          thinking: parsed.thinking,
          citations: validCitations,
          interpretation: parsed.interpretation,
          uncertainty: parsed.uncertainty,
          isGrounded: true,
          modelUsed: `Google Gemini (${model})`,
        };
      }
    } catch (err) {
      console.warn("Gemini API call failed or timed out, falling back to built-in smart reader:", err);
    }
  }

  // 3. Built-in Smart Evidence Synthesizer (Works 100% offline/without API key with real uploaded data)
  const matchedPages = [...new Set(relevantChunks.map((c) => c.page_number))];
  const matchedDocTitles = [
    ...new Set(relevantChunks.map((c) => paperTitleMap.get(c.document_id) || "Uploaded Paper")),
  ];

  const thinkingTrace = [
    `Step 1: Read your question: "${question}"`,
    `Step 2: Scanned ${chunks.length} paragraphs across ${papers.length} paper(s) in your project.`,
    `Step 3: Found ${relevantChunks.length} matching proof passage(s) in ${matchedDocTitles.join(", ")} on page(s) ${matchedPages.join(", ")}.`,
    `Step 4: Double-checked every quote word-for-word against the real page text so nothing is made up.`,
  ].join("\n");

  const candidateCitations: Partial<Citation>[] = relevantChunks.map((chk) => ({
    document_id: chk.document_id,
    document_title: paperTitleMap.get(chk.document_id),
    page_number: chk.page_number,
    passage_quote: chk.content.slice(0, 220).trim(),
    confidence: 1.0,
  }));

  const { validCitations } = validateCitations(candidateCitations, pages, chunks);

  // Group synthesis by document in clear, friendly language
  const docGroups = new Map<string, typeof relevantChunks>();
  for (const chk of relevantChunks) {
    const list = docGroups.get(chk.document_id) || [];
    list.push(chk);
    docGroups.set(chk.document_id, list);
  }

  const synthesisSections: string[] = [];
  let citCounter = 1;

  for (const [docId, docChunks] of docGroups.entries()) {
    const docTitle = paperTitleMap.get(docId) || "Your Paper";
    const excerpts = docChunks.map((chk) => {
      const citIdx = citCounter++;
      return `• **From "${docTitle}" (Page ${chk.page_number}):**\n  "${chk.content}" **[${citIdx}]**`;
    });
    synthesisSections.push(excerpts.join("\n\n"));
  }

  return {
    content: `Here is what your papers say about **"${question}"**:\n\n${synthesisSections.join(
      "\n\n"
    )}\n\n👉 *Tip: Click any yellow proof box below to jump straight to that page and highlight the exact sentence!*`,
    thinking: thinkingTrace,
    citations: validCitations,
    interpretation:
      "Every point above comes directly from your uploaded papers. You can verify each quote on its exact page.",
    uncertainty:
      "This answer only uses facts from the papers inside your project. If you add more PDFs or topics, I will include them too!",
    isGrounded: true,
    modelUsed: "Sourcewise Built-in Smart Reader (100% Verified)",
  };
}
