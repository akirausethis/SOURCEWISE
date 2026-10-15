import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { ResearchNote } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_pedagogy_ai";

    const notes = store.getNotes(projectId);
    if (notes.length > 0) {
      return NextResponse.json({ notes });
    }

    // Default starter notes
    const starterNotes: ResearchNote[] = [
      {
        id: "note_1",
        project_id: projectId,
        user_id: "usr_researcher_01",
        document_id: "paper_vaswani_2017",
        document_title: "Attention Is All You Need",
        title: "Self-Attention Parallelization Efficiency",
        content:
          "Vaswani et al. demonstrate that removing recurrence allows constant $O(1)$ sequential operations per layer. Crucial distinction for thesis Chapter 2 on computational bottlenecks in sequential literature processing.",
        page_reference: 2,
        tags: ["methodology", "transformers", "chapter-2"],
        created_at: "2026-09-16T10:00:00Z",
        updated_at: "2026-09-16T10:00:00Z",
      },
      {
        id: "note_2",
        project_id: projectId,
        user_id: "usr_researcher_01",
        document_id: "paper_lewis_2020",
        document_title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        title: "Parametric vs Non-Parametric Memory Dichotomy",
        content:
          "Key theoretical framing: Pre-trained weights act as parametric memory, while external document indices serve as dynamic non-parametric memory. This supports our thesis argument that student trust requires tangible non-parametric references.",
        page_reference: 1,
        tags: ["theory", "RAG", "provenance"],
        created_at: "2026-09-19T15:30:00Z",
        updated_at: "2026-09-19T15:30:00Z",
      },
    ];

    starterNotes.forEach((n) => store.saveNote(n));
    return NextResponse.json({ notes: starterNotes });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, document_id, document_title, title, content, page_reference, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const newNote: ResearchNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project_id: project_id || "proj_pedagogy_ai",
      user_id: "usr_researcher_01",
      document_id: document_id || null,
      document_title: document_title || null,
      title: title.trim(),
      content: content.trim(),
      page_reference: page_reference ? parseInt(page_reference, 10) : null,
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.saveNote(newNote);
    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Note ID required" }, { status: 400 });

    store.deleteNote(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
