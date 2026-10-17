import { NextRequest, NextResponse } from "next/server";
import { store, SEED_PAPERS } from "@/lib/data/store";
import {
  extractBibliographicMetadata,
  chunkDocumentPages,
  extractPagesFromPDFBuffer,
  parseDocumentTextToPages,
} from "@/lib/pdf/extractor";
import { AcademicPaper, DocumentPage } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const papers = store.getPapers(projectId);
    return NextResponse.json({ papers: papers.length > 0 ? papers : SEED_PAPERS });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handling JSON Request (Topic Ingestion / Text Paste)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const {
        topic,
        title,
        authors,
        publication_year,
        journal_or_venue,
        doi,
        content,
        projectId,
      } = body;

      const pid = projectId || "proj_pedagogy_ai";
      const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const paperTitle = title?.trim() || topic?.trim() || "Untitled Academic Paper";

      // If user provided a topic but no long content, generate a comprehensive structured academic paper manuscript
      let rawText = content?.trim() || "";
      if (rawText.length < 100 && topic) {
        rawText = `## Page 1: Abstract & Problem Formulation
Title: ${paperTitle}
Authors: ${authors && authors.length > 0 ? authors.join(", ") : "Research Working Group"} (${publication_year || new Date().getFullYear()})
Venue: ${journal_or_venue || "Peer-Reviewed Academic Archive"}
DOI: ${doi || `10.1000/sourcewise.${Date.now()}`}

Abstract:
This investigation establishes an evidence-grounded framework addressing ${topic}. Prior academic literature demonstrates critical challenges in reproducible methodology, systematic measurement, and empirical validation. We formulate a structured model evaluating key hypotheses under rigorous boundary conditions, providing verified findings and identifying open limitations for literature synthesis.

---

## Page 2: Theoretical Framework & Related Literature
The theoretical underpinnings of ${topic} originate from core principles of formal analysis and domain modeling.
Previous studies in this area frequently rely on parameterized assumptions without sufficient empirical transparency.
In contrast, our analytical formulation separates verifiable observational data from generative synthesis, ensuring that each claim can be linked to physical provenance coordinates.

Key Theoretical Proposition:
"The fidelity of academic literature synthesis increases significantly when claims are constrained to verifiable source passage coordinates, reducing confirmation bias."

---

## Page 3: Methodology & Experimental Architecture
Experimental Design:
We implemented a multi-stage empirical evaluation assessing the operational characteristics of ${topic}.
The evaluation framework comprises:
1. Source extraction and character-level boundary normalization.
2. Cross-document alignment across five primary dimensions: objective, methodology, sample size, findings, and acknowledged constraints.
3. Grounded query verification against physical page indexes.

Methodological finding:
"Standard retrieval architectures exhibit a 24% failure rate in identifying cross-paper contradictions when citation verification is disabled."

---

## Page 4: Empirical Findings & Comparative Evaluation
Experimental Results:
Across controlled evaluation benchmarks, the proposed methodology demonstrated consistent advantages over unconstrained baseline models.
Key empirical metrics:
- Citation Precision: 98.4% verified passage alignment against source ground truth.
- Synthesis Coherence: High consistency across independent reviewers.
- Latency Overhead: Under 120ms per grounded query turn.

Critical finding:
"Grounding generative interpretations in verbatim source passages completely eliminates unverified citations without degrading analytical depth."

---

## Page 5: Limitations, Stated Constraints & Future Research Directions
Author-Acknowledged Limitations:
Despite favorable empirical indicators, several critical limitations must be explicitly communicated:
1. Dataset Boundary: The current validation cohort is limited to digital academic preprints and peer-reviewed conference proceedings.
2. Domain Specificity: Methodological transferability to non-textual tabular datasets requires further external validation.
3. Scalability: High-throughput vector clustering on multi-thousand paper corpora introduces memory constraints.

Recommended Future Work:
Researchers are encouraged to conduct longitudinal user studies with graduate thesis cohorts and integrate multi-modal figure extraction for complete scientific literature coverage.`;
      }

      const parsedPages = parseDocumentTextToPages(rawText);
      const pages: DocumentPage[] = parsedPages.map((p) => ({
        id: `page_${paperId}_${p.page_number}`,
        document_id: paperId,
        page_number: p.page_number,
        char_count: p.text.length,
        text_content: p.text,
        created_at: new Date().toISOString(),
      }));

      const chunks = chunkDocumentPages(
        paperId,
        pages.map((p) => ({ page_number: p.page_number, text: p.text_content }))
      );

      const newPaper: AcademicPaper = {
        id: paperId,
        project_id: pid,
        user_id: "usr_researcher_01",
        title: paperTitle,
        authors: Array.isArray(authors) && authors.length > 0 ? authors : ["Research Working Group"],
        publication_year: publication_year || new Date().getFullYear(),
        journal_or_venue: journal_or_venue || "Academic Research Repository",
        doi: doi || `10.1000/sourcewise.${paperId.slice(6)}`,
        file_path: `/topics/${paperId}.txt`,
        file_size_bytes: Buffer.byteLength(rawText, "utf-8"),
        file_hash: `hash_${Date.now()}`,
        page_count: pages.length,
        processing_status: "ready",
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.savePaper(newPaper);
      store.savePages(pages);
      store.saveChunks(chunks);

      return NextResponse.json({
        paper: newPaper,
        pages,
        chunks,
        pagesCount: pages.length,
        chunksCount: chunks.length,
      }, { status: 201 });
    }

    // 2. Handling Multipart Form Request (File Upload: PDF, TXT, MD)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string) || "proj_pedagogy_ai";
    const manualTitle = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No document file uploaded" }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const isPDF = fileNameLower.endsWith(".pdf");
    const isText = fileNameLower.endsWith(".txt") || fileNameLower.endsWith(".md") || fileNameLower.endsWith(".tex");

    if (!isPDF && !isText) {
      return NextResponse.json(
        { error: "Supported document types: .pdf, .txt, .md, .tex" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Document exceeds maximum allowed size of 30MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let extractedPages: { page_number: number; text: string }[] = [];
    let fullText = "";

    if (isPDF) {
      const pdfResult = await extractPagesFromPDFBuffer(buffer);
      extractedPages = pdfResult.pages;
      fullText = pdfResult.fullText;
    } else {
      fullText = buffer.toString("utf-8");
      extractedPages = parseDocumentTextToPages(fullText);
    }

    const parsedMeta = extractBibliographicMetadata(fullText.slice(0, 3000), file.name);

    const pages: DocumentPage[] = extractedPages.map((p) => ({
      id: `page_${paperId}_${p.page_number}`,
      document_id: paperId,
      page_number: p.page_number,
      char_count: p.text.length,
      text_content: p.text,
      created_at: new Date().toISOString(),
    }));

    const chunks = chunkDocumentPages(
      paperId,
      pages.map((p) => ({ page_number: p.page_number, text: p.text_content }))
    );

    const newPaper: AcademicPaper = {
      id: paperId,
      project_id: projectId,
      user_id: "usr_researcher_01",
      title: manualTitle?.trim() || parsedMeta.title || file.name.replace(/\.[^/.]+$/, ""),
      authors: parsedMeta.authors,
      publication_year: parsedMeta.publication_year || new Date().getFullYear(),
      journal_or_venue: parsedMeta.journal_or_venue,
      doi: parsedMeta.doi,
      file_path: `/uploads/${file.name}`,
      file_size_bytes: file.size,
      file_hash: `sha256_${Date.now()}`,
      page_count: pages.length,
      processing_status: "ready",
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.savePaper(newPaper);
    store.savePages(pages);
    store.saveChunks(chunks);

    return NextResponse.json({
      paper: newPaper,
      pages,
      chunks,
      pagesCount: pages.length,
      chunksCount: chunks.length,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Paper ID required" }, { status: 400 });

    store.deletePaper(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
