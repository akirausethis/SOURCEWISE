import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { ComparisonMatrix, PaperComparisonRow, AcademicPaper, DocumentChunk } from "@/types";

function buildComparisonMatrix(
  projectId: string,
  papers: AcademicPaper[],
  chunks: DocumentChunk[]
): ComparisonMatrix {
  const dimensions = ["objective", "methodology", "dataset", "key_findings", "limitations"];

  const rows: PaperComparisonRow[] = papers.map((paper) => {
    const paperChunks = chunks.filter((c) => c.document_id === paper.id);

    const findRelevantExcerpt = (keywords: string[], fallbackIndex = 0): string => {
      for (const chk of paperChunks) {
        const lower = chk.content.toLowerCase();
        if (keywords.some((k) => lower.includes(k))) {
          return chk.content.slice(0, 260).trim() + (chk.content.length > 260 ? "..." : "");
        }
      }
      if (paperChunks.length > 0) {
        const chosen = paperChunks[Math.min(fallbackIndex, paperChunks.length - 1)];
        return chosen.content.slice(0, 220).trim() + (chosen.content.length > 220 ? "..." : "");
      }
      return "Not mentioned in this paper";
    };

    return {
      paper_id: paper.id,
      paper_title: paper.title,
      authors: paper.authors,
      year: paper.publication_year,
      values: {
        objective: {
          text: findRelevantExcerpt(["propose", "aim", "objective", "explore", "investigate", "framework", "study", "goal"], 0),
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
          text: findRelevantExcerpt(["architecture", "model", "network", "transformer", "experiment", "training", "evaluation", "design", "method"], 1),
          status: "reported",
          citations: [],
        },
        dataset: {
          text: findRelevantExcerpt(["dataset", "corpus", "wikipedia", "translation", "benchmark", "wmt", "cohort", "sample", "data"], 1),
          status: "reported",
          citations: [],
        },
        key_findings: {
          text: findRelevantExcerpt(["results", "superior", "state-of-the-art", "generate", "outperform", "finding", "accuracy", "demonstrate", "show"], 2),
          status: "reported",
          citations: [],
        },
        limitations: {
          text: findRelevantExcerpt(["limitation", "challenge", "fall short", "memory constraints", "hallucination", "boundary", "constraint", "problem", "weakness"], paperChunks.length - 1),
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
    title: "Side-by-Side Paper Comparison",
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
  return newMatrix;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_pedagogy_ai";

    const papers = store.getPapers(projectId);
    const chunks = store.getChunks();
    const existing = store.getComparison(projectId);

    if (existing && existing.paper_ids.length === papers.length && papers.length > 0) {
      return NextResponse.json({ comparison: existing });
    }

    const matrix = buildComparisonMatrix(projectId, papers, chunks);
    return NextResponse.json({ comparison: matrix });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comparison, projectId, customPapers, customChunks } = body;

    if (comparison && comparison.project_id) {
      store.saveComparison(comparison);
      return NextResponse.json({ success: true, comparison });
    }

    const pid = projectId || "proj_pedagogy_ai";
    if (Array.isArray(customPapers)) {
      for (const p of customPapers as AcademicPaper[]) {
        if (p && p.id) store.savePaper(p);
      }
    }
    if (Array.isArray(customChunks) && customChunks.length > 0) {
      store.saveChunks(customChunks as DocumentChunk[]);
    }

    const papers = store.getPapers(pid);
    const chunks = store.getChunks();
    const matrix = buildComparisonMatrix(pid, papers, chunks);
    return NextResponse.json({ comparison: matrix });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

