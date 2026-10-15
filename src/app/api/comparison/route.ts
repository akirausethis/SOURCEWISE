import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { ComparisonMatrix, PaperComparisonRow } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_pedagogy_ai";

    const existing = store.getComparison(projectId);
    if (existing) {
      return NextResponse.json({ comparison: existing });
    }

    // Auto-generate initial comparison from available papers
    const papers = store.getPapers(projectId);
    const chunks = store.getChunks();

    const dimensions = ["objective", "methodology", "dataset", "key_findings", "limitations"];

    const rows: PaperComparisonRow[] = papers.map((paper) => {
      const paperChunks = chunks.filter((c) => c.document_id === paper.id);

      const findRelevantExcerpt = (keywords: string[]): string => {
        for (const chk of paperChunks) {
          const lower = chk.content.toLowerCase();
          if (keywords.some((k) => lower.includes(k))) {
            return chk.content.slice(0, 220).trim() + "...";
          }
        }
        return "Not reported in source text";
      };

      return {
        paper_id: paper.id,
        paper_title: paper.title,
        authors: paper.authors,
        year: paper.publication_year,
        values: {
          objective: {
            text: findRelevantExcerpt(["propose", "aim", "objective", "explore", "investigate"]),
            status: "reported",
            citations: [
              {
                id: `cit_comp_${paper.id}_obj`,
                document_id: paper.id,
                document_title: paper.title,
                page_number: 1,
                passage_quote: paperChunks[0]?.content.slice(0, 100) || paper.title,
                confidence: 0.95,
                verified: true,
              },
            ],
          },
          methodology: {
            text: findRelevantExcerpt(["architecture", "model", "network", "transformer", "experiment", "training"]),
            status: "reported",
            citations: [],
          },
          dataset: {
            text: findRelevantExcerpt(["dataset", "corpus", "wikipedia", "translation", "benchmark", "wmt"]),
            status: "reported",
            citations: [],
          },
          key_findings: {
            text: findRelevantExcerpt(["results", "superior", "state-of-the-art", "generate", "outperform"]),
            status: "reported",
            citations: [],
          },
          limitations: {
            text: findRelevantExcerpt(["limitation", "challenge", "fall short", "memory constraints", "hallucination"]),
            status: "reported",
            citations: [],
          },
        },
      };
    });

    const newMatrix: ComparisonMatrix = {
      id: `comp_${projectId}`,
      project_id: projectId,
      user_id: "usr_researcher_01",
      title: "Cross-Paper Comparative Synthesis Matrix",
      dimensions,
      paper_ids: papers.map((p) => p.id),
      matrix_data: {
        rows,
        last_updated: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.saveComparison(newMatrix);
    return NextResponse.json({ comparison: newMatrix });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comparison } = body;
    if (!comparison || !comparison.project_id) {
      return NextResponse.json({ error: "Invalid comparison matrix payload" }, { status: 400 });
    }

    store.saveComparison(comparison);
    return NextResponse.json({ success: true, comparison });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
