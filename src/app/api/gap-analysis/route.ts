import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { ResearchGapAnalysis, ResearchGapCandidate, AcademicPaper, DocumentChunk } from "@/types";

function buildGapAnalysis(
  projectId: string,
  papers: AcademicPaper[],
  chunks: DocumentChunk[]
): ResearchGapAnalysis {
  const project = store.getProject(projectId);
  const researchQuestion =
    project?.research_question ||
    "How does showing exact page proof help students check AI answers when reading papers?";

  const candidateGaps: ResearchGapCandidate[] = [
    {
      id: "gap_1",
      title: "Showing Exact Page Proof When Students Read Papers with AI",
      description:
        "Most AI tools only test how fast or fluent the AI writes, instead of testing whether showing clickable page numbers helps real students spot mistakes and learn better.",
      relevance:
        "Helps us understand if clickable page highlights make students more careful and confident than normal chat bots.",
      supporting_evidence: [
        {
          paper_id: "paper_lewis_2020",
          paper_title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
          page_number: 1,
          quote:
            "Large pre-trained language models have been shown to store factual knowledge in their parameters... However, their ability to access and precisely manipulate knowledge is still limited.",
        },
        {
          paper_id: "paper_gao_2024",
          paper_title: "Retrieval-Augmented Generation for Large Language Models: A Survey",
          page_number: 1,
          quote:
            "Large Language Models (LLMs) encounter significant challenges including hallucination, obsolete domain-specific knowledge, and non-transparent reasoning processes.",
        },
      ],
      contradictory_evidence: [
        {
          paper_id: "paper_vaswani_2017",
          paper_title: "Attention Is All You Need",
          page_number: 1,
          quote:
            "Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable.",
        },
      ],
      stated_limitations: [
        "Lewis et al. (2020) only tested AI on Wikipedia trivia questions, not with real students writing essays.",
        "Gao et al. (2024) reviewed AI algorithms but noted that we still lack simple ways for everyday users to double-check AI sources.",
      ],
      uncertainty_assessment:
        "These ideas come from the papers currently inside your project. Always check Google Scholar to see if another team has studied this recently.",
      suggested_validation_plan: [
        "Compare two groups of students: one group using normal AI chat, and one group using clickable page highlights.",
        "See how fast each group finds a mistake and how well they understand the paper.",
        "Search Google Scholar for 'clickable citations for students' to see related studies.",
      ],
    },
  ];

  const nonSeededPapers = papers.filter(
    (p) => !["paper_vaswani_2017", "paper_lewis_2020", "paper_gao_2024"].includes(p.id)
  );

  for (const paper of nonSeededPapers) {
    const paperChunks = chunks.filter((c) => c.document_id === paper.id);
    const limitationChunk =
      paperChunks.find((c) => {
        const l = c.content.toLowerCase();
        return (
          l.includes("limitation") ||
          l.includes("constraint") ||
          l.includes("future work") ||
          l.includes("challenge") ||
          l.includes("boundary") ||
          l.includes("problem") ||
          l.includes("weakness")
        );
      }) || paperChunks[paperChunks.length - 1];

    const findingChunk =
      paperChunks.find((c) => {
        const l = c.content.toLowerCase();
        return l.includes("finding") || l.includes("result") || l.includes("method") || l.includes("propose");
      }) || paperChunks[0];

    if (limitationChunk && findingChunk) {
      candidateGaps.push({
        id: `gap_${paper.id}`,
        title: `Next Step Idea Based on "${paper.title.slice(0, 55)}"`,
        description: `While reading "${paper.title}", we found unsolved problems and limits mentioned by the authors that you could explore as your own research topic or project!`,
        relevance: `Builds directly on what ${paper.authors[0] || "the authors"} said still needs to be solved.`,
        supporting_evidence: [
          {
            paper_id: paper.id,
            paper_title: paper.title,
            page_number: findingChunk.page_number,
            quote: findingChunk.content.slice(0, 220),
          },
        ],
        contradictory_evidence: [],
        stated_limitations: [
          `From Page ${limitationChunk.page_number}: "${limitationChunk.content.slice(0, 180)}..."`,
        ],
        uncertainty_assessment: `Found directly inside "${paper.title}". Check Google Scholar to see if newer papers have solved this.`,
        suggested_validation_plan: [
          `Look up "${paper.title}" on Google Scholar to see who cited it recently.`,
          `Test a solution for the weakness mentioned on Page ${limitationChunk.page_number}.`,
          `Compare your results with the other papers in the Compare Table tab.`,
        ],
      });
    }
  }

  const newAnalysis: ResearchGapAnalysis = {
    id: `gap_analysis_${projectId}`,
    project_id: projectId,
    user_id: "usr_researcher_01",
    research_question: researchQuestion,
    candidate_gaps: candidateGaps,
    validation_steps: [
      "1. Search Google Scholar to make sure no one else has already answered this exact question.",
      "2. Write down a clear, simple question you want to test.",
      "3. Test your idea with real examples or data and compare it to these papers.",
    ],
    uncertainty_assessment:
      "These project ideas are based on the weaknesses and open questions inside your uploaded papers. They are a helpful starting point for your own essay or research!",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.saveGapAnalysis(newAnalysis);
  return newAnalysis;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_pedagogy_ai";

    const papers = store.getPapers(projectId);
    const chunks = store.getChunks();
    const existing = store.getGapAnalysis(projectId);

    if (existing && existing.candidate_gaps.length >= Math.max(1, papers.length - 2)) {
      return NextResponse.json({ gapAnalysis: existing });
    }

    const analysis = buildGapAnalysis(projectId, papers, chunks);
    return NextResponse.json({ gapAnalysis: analysis });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gapAnalysis, projectId, customPapers, customChunks } = body;

    if (gapAnalysis && gapAnalysis.project_id) {
      store.saveGapAnalysis(gapAnalysis);
      return NextResponse.json({ success: true, gapAnalysis });
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
    const analysis = buildGapAnalysis(pid, papers, chunks);
    return NextResponse.json({ gapAnalysis: analysis });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

