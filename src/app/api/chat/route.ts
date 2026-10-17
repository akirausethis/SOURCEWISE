import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { queryResearchAssistant } from "@/lib/ai/gemini";
import { chunkDocumentPages } from "@/lib/pdf/extractor";
import { ChatMessage, AcademicPaper, DocumentPage, DocumentChunk } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      projectId,
      conversationId,
      selectedPaperId,
      apiKey,
      customPapers,
      customPages,
      customChunks,
    } = body;
    const headerApiKey = req.headers.get("x-gemini-key") || undefined;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const pid = projectId || "proj_pedagogy_ai";
    const convId = conversationId || `conv_${pid}`;

    // Hydrate serverless store with any client-uploaded papers/pages/chunks (ensures 100% reliability on Vercel)
    const incomingPapers: AcademicPaper[] = Array.isArray(customPapers) ? customPapers : [];
    const incomingPages: DocumentPage[] = Array.isArray(customPages) ? customPages : [];
    const incomingChunks: DocumentChunk[] = Array.isArray(customChunks) ? customChunks : [];

    for (const p of incomingPapers) {
      if (p && p.id) store.savePaper(p);
    }
    if (incomingPages.length > 0) {
      store.savePages(incomingPages);
    }
    if (incomingChunks.length > 0) {
      store.saveChunks(incomingChunks);
    }

    // Merge incoming papers with store papers so nothing is ever lost across stateless calls
    const paperMap = new Map<string, AcademicPaper>();
    for (const p of [...incomingPapers, ...store.getPapers(pid), ...store.getPapers()]) {
      if (p && p.id && !paperMap.has(p.id)) {
        paperMap.set(p.id, p);
      }
    }
    const papers = Array.from(paperMap.values());

    // Merge incoming pages with store pages
    const pageMap = new Map<string, DocumentPage>();
    for (const pg of [...incomingPages, ...papers.flatMap((p) => store.getPages(p.id))]) {
      if (pg && pg.id && !pageMap.has(pg.id)) {
        pageMap.set(pg.id, pg);
      }
    }
    const pages = Array.from(pageMap.values());

    // Merge incoming chunks with store chunks
    const chunkMap = new Map<string, DocumentChunk>();
    for (const chk of [...incomingChunks, ...store.getChunks()]) {
      if (chk && chk.id && !chunkMap.has(chk.id)) {
        chunkMap.set(chk.id, chk);
      }
    }
    let allChunks = Array.from(chunkMap.values());

    // Safety net: if the currently selected paper has pages in the reader but 0 chunks, chunk its pages on the fly!
    if (selectedPaperId) {
      const hasChunksForSelected = allChunks.some((c) => c.document_id === selectedPaperId);
      if (!hasChunksForSelected) {
        const selectedPages = pages.filter((p) => p.document_id === selectedPaperId);
        if (selectedPages.length > 0) {
          const generatedChunks = chunkDocumentPages(
            selectedPaperId,
            selectedPages.map((p) => ({ page_number: p.page_number, text: p.text_content }))
          );
          store.saveChunks(generatedChunks);
          allChunks = [...generatedChunks, ...allChunks];
        }
      }
    }

    // If the user has a specific paper selected in the Reader (e.g. their uploaded Physics PDF),
    // and they aren't asking to compare across all papers, scope to that paper's chunks first!
    const isMultiPaperQuery = /\b(compare|comparison|both|all papers|across papers|difference between|bandingkan)\b/i.test(
      question
    );
    const selectedPaperChunks = selectedPaperId
      ? allChunks.filter((c) => c.document_id === selectedPaperId)
      : [];

    const projectPaperIds = new Set(
      papers.filter((p) => p.project_id === pid || incomingPapers.some((ip) => ip.id === p.id)).map((p) => p.id)
    );
    const projectChunks = allChunks.filter((c) => projectPaperIds.has(c.document_id));

    const effectiveChunks =
      selectedPaperChunks.length > 0 && !isMultiPaperQuery
        ? selectedPaperChunks
        : projectChunks.length > 0
          ? projectChunks
          : allChunks;

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversation_id: convId,
      sender: "user",
      content: question.trim(),
      created_at: new Date().toISOString(),
    };
    store.saveMessage(userMsg);

    // Call grounded research assistant with real document chunks and optional user API key
    const aiResponse = await queryResearchAssistant({
      question: question.trim(),
      projectId: pid,
      papers,
      chunks: effectiveChunks,
      pages,
      selectedPaperId,
      userApiKey: apiKey || headerApiKey,
    });

    const assistantMsg: ChatMessage = {
      id: `msg_a_${Date.now()}`,
      conversation_id: convId,
      sender: "assistant",
      content: aiResponse.content,
      citations: aiResponse.citations,
      interpretation: aiResponse.interpretation,
      uncertainty: aiResponse.uncertainty,
      thinking: aiResponse.thinking,
      modelUsed: aiResponse.modelUsed,
      created_at: new Date().toISOString(),
    };
    store.saveMessage(assistantMsg);

    return NextResponse.json({
      message: assistantMsg,
      thinking: aiResponse.thinking,
      modelUsed: aiResponse.modelUsed,
      citationsCount: aiResponse.citations.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

