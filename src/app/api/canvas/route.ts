import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { ResearchCanvasData } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_pedagogy_ai";

    const existing = store.getCanvas(projectId);
    if (existing) {
      return NextResponse.json({ canvas: existing });
    }

    // Default seed canvas nodes & edges for the project
    const papers = store.getPapers(projectId);
    const initialNodes = [
      {
        id: "node_rq",
        type: "research_question" as const,
        label: "Research Question",
        description: "How does provenance tracking affect student critical analysis in AI synthesis?",
        x: 400,
        y: 80,
      },
      ...papers.map((p, idx) => ({
        id: `node_${p.id}`,
        type: "paper" as const,
        label: p.title,
        description: `${p.authors[0] || "Author"} et al. (${p.publication_year || 2024})`,
        x: 180 + idx * 300,
        y: 260,
        document_id: p.id,
      })),
      {
        id: "node_concept_attention",
        type: "concept" as const,
        label: "Self-Attention Mechanism",
        description: "Dispenses with recurrence and allows parallel sequence representation.",
        x: 200,
        y: 450,
      },
      {
        id: "node_finding_rag",
        type: "finding" as const,
        label: "Parametric + Non-Parametric Memory",
        description: "Combines pre-trained seq2seq generators with neural index retrieval.",
        x: 520,
        y: 450,
      },
      {
        id: "node_gap_epistemic",
        type: "potential_gap" as const,
        label: "Candidate Gap: Real-time Page Citation Verification",
        description: "Little empirical work on coordinate-level citation verification interfaces in student thesis writing.",
        x: 400,
        y: 620,
        is_ai_suggested: true,
      },
    ];

    const initialEdges = [
      {
        id: "edge_1",
        source: "node_rq",
        target: `node_${papers[0]?.id || "paper_vaswani_2017"}`,
        type: "related_concept" as const,
        label: "Theoretical Foundation",
      },
      {
        id: "edge_2",
        source: `node_${papers[0]?.id || "paper_vaswani_2017"}`,
        target: `node_${papers[1]?.id || "paper_lewis_2020"}`,
        type: "extends" as const,
        label: "Applied to RAG Generation",
      },
      {
        id: "edge_3",
        source: `node_${papers[1]?.id || "paper_lewis_2020"}`,
        target: "node_finding_rag",
        type: "supports" as const,
        label: "Core Methodology",
      },
      {
        id: "edge_4",
        source: "node_finding_rag",
        target: "node_gap_epistemic",
        type: "identifies_limitation" as const,
        label: "Unaddressed Student Workflow",
        is_ai_suggested: true,
      },
    ];

    const initialCanvas: ResearchCanvasData = {
      id: `canvas_${projectId}`,
      project_id: projectId,
      user_id: "usr_researcher_01",
      title: "Conceptual Synthesis Map",
      nodes: initialNodes,
      edges: initialEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.saveCanvas(initialCanvas);
    return NextResponse.json({ canvas: initialCanvas });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { canvas } = body;
    if (!canvas || !canvas.project_id) {
      return NextResponse.json({ error: "Invalid canvas data" }, { status: 400 });
    }

    store.saveCanvas(canvas);
    return NextResponse.json({ success: true, canvas });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
