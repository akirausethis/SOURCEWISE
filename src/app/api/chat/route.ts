import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { queryResearchAssistant } from "@/lib/ai/gemini";
import { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, projectId, conversationId } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const pid = projectId || "proj_pedagogy_ai";
    const convId = conversationId || `conv_${pid}`;

    const papers = store.getPapers(pid);
    const paperIds = new Set(papers.map((p) => p.id));
    const allChunks = store.getChunks();
    const projectChunks = allChunks.filter((c) => paperIds.has(c.document_id));

    const pages = papers.flatMap((p) => store.getPages(p.id));

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversation_id: convId,
      sender: "user",
      content: question.trim(),
      created_at: new Date().toISOString(),
    };
    store.saveMessage(userMsg);

    // Call grounded research assistant
    const aiResponse = await queryResearchAssistant({
      question: question.trim(),
      projectId: pid,
      papers,
      chunks: projectChunks.length > 0 ? projectChunks : allChunks,
      pages,
    });

    const assistantMsg: ChatMessage = {
      id: `msg_a_${Date.now()}`,
      conversation_id: convId,
      sender: "assistant",
      content: aiResponse.content,
      citations: aiResponse.citations,
      interpretation: aiResponse.interpretation,
      uncertainty: aiResponse.uncertainty,
      created_at: new Date().toISOString(),
    };
    store.saveMessage(assistantMsg);

    return NextResponse.json({
      message: assistantMsg,
      modelUsed: aiResponse.modelUsed,
      citationsCount: aiResponse.citations.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
