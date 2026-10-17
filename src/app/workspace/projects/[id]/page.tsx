"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  BookOpen,
  FileText,
  Sparkles,
  Layers,
  GitBranch,
  Columns,
  Upload,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  X,
  FilePlus,
  HelpCircle,
  Trash2,
} from "lucide-react";
import {
  ResearchProject,
  AcademicPaper,
  DocumentPage,
  DocumentChunk,
  ChatMessage,
  Citation,
  ComparisonMatrix,
  ResearchCanvasData,
  CanvasNode,
  ResearchGapAnalysis,
  ResearchNote,
} from "@/types";
import { extractDocumentInBrowser } from "@/lib/pdf/client-extractor";

async function safeJsonResponse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const rawText = await res.text();
  try {
    return JSON.parse(rawText) as T;
  } catch {
    if (res.status === 413 || rawText.includes("Request Entity Too Large")) {
      throw new Error("File is large — switching to instant browser PDF reader.");
    }
    throw new Error(rawText.slice(0, 140) || `Server returned status ${res.status}`);
  }
}

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "reader" | "library" | "comparison" | "canvas" | "gaps" | "notes"
  >("reader");

  // Helpful Onboarding Guide Toggle
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<string | null>(null);

  // Project & Data State
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<AcademicPaper | null>(null);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  // Client-side persistence for stateless Vercel Serverless compatibility
  const [customPapers, setCustomPapers] = useState<AcademicPaper[]>([]);
  const [customPages, setCustomPages] = useState<DocumentPage[]>([]);
  const [customChunks, setCustomChunks] = useState<DocumentChunk[]>([]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Comparison Matrix State
  const [comparison, setComparison] = useState<ComparisonMatrix | null>(null);

  // Canvas State
  const [canvasData, setCanvasData] = useState<ResearchCanvasData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  // Research Gaps State
  const [gapAnalysis, setGapAnalysis] = useState<ResearchGapAnalysis | null>(null);

  // Notes State
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePage, setNewNotePage] = useState("");

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Ingest Custom Topic / Manuscript Modal State
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({
    topic: "",
    title: "",
    authors: "",
    publication_year: new Date().getFullYear().toString(),
    content: "",
  });

  // Helper to refresh Comparison, Gaps, and Canvas with all custom uploaded papers
  const syncProjectSyntheses = async (
    currentCustomPapers: AcademicPaper[],
    currentCustomChunks: DocumentChunk[]
  ) => {
    try {
      // Cap chunks sent over the network to prevent Vercel 4.5MB request body errors
      const cappedChunks = currentCustomChunks.slice(0, 200);

      const compRes = await fetch("/api/comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          customPapers: currentCustomPapers,
          customChunks: cappedChunks,
        }),
      });
      const compData = await safeJsonResponse<{ comparison?: ComparisonMatrix }>(compRes);
      if (compData.comparison) setComparison(compData.comparison);

      const gapRes = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          customPapers: currentCustomPapers,
          customChunks: cappedChunks,
        }),
      });
      const gapData = await safeJsonResponse<{ gapAnalysis?: ResearchGapAnalysis }>(gapRes);
      if (gapData.gapAnalysis) setGapAnalysis(gapData.gapAnalysis);
    } catch (err) {
      console.error("Failed to sync syntheses:", err);
    }
  };

  // Load project, papers, and localStorage state on mount
  useEffect(() => {
    let localPapers: AcademicPaper[] = [];
    let localPages: DocumentPage[] = [];
    let localChunks: DocumentChunk[] = [];
    let localProjects: ResearchProject[] = [];

    try {
      const rawPapers: AcademicPaper[] = JSON.parse(localStorage.getItem("sourcewise_custom_papers") || "[]");
      const rawPages: DocumentPage[] = JSON.parse(localStorage.getItem("sourcewise_custom_pages") || "[]");
      const rawChunks: DocumentChunk[] = JSON.parse(localStorage.getItem("sourcewise_custom_chunks") || "[]");
      localProjects = JSON.parse(localStorage.getItem("sourcewise_custom_projects") || "[]");

      // Auto-clean any legacy corrupted %PDF- binary or detached-buffer entries from localStorage
      const isCorruptedPDFText = (str?: string) =>
        Boolean(
          str &&
            (str.includes("%PDF-") ||
              str.includes("<</Type/Catalog") ||
              str.includes("<</Type/Page") ||
              str.includes("/FontDescriptor") ||
              str.includes("stream JFIF") ||
              str.includes("Document text extracted from source."))
        );

      const corruptedDocIds = new Set<string>();
      for (const p of rawPapers) {
        if (isCorruptedPDFText(p.title)) corruptedDocIds.add(p.id);
      }
      for (const pg of rawPages) {
        if (isCorruptedPDFText(pg.text_content)) corruptedDocIds.add(pg.document_id);
      }

      if (corruptedDocIds.size > 0) {
        localPapers = rawPapers.filter((p) => !corruptedDocIds.has(p.id));
        localPages = rawPages.filter((pg) => !corruptedDocIds.has(pg.document_id));
        localChunks = rawChunks.filter((c) => !corruptedDocIds.has(c.document_id));
        localStorage.setItem("sourcewise_custom_papers", JSON.stringify(localPapers));
        localStorage.setItem("sourcewise_custom_pages", JSON.stringify(localPages));
        localStorage.setItem("sourcewise_custom_chunks", JSON.stringify(localChunks));
      } else {
        localPapers = rawPapers;
        localPages = rawPages;
        localChunks = rawChunks;
      }
    } catch {
      // ignore storage parse errors
    }

    const projectLocalPapers = localPapers.filter((p) => p.project_id === projectId);
    setCustomPapers(projectLocalPapers);
    setCustomPages(localPages);
    setCustomChunks(localChunks);

    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        const allProjs = [...localProjects, ...(data.projects || [])];
        const found = allProjs.find((p: ResearchProject) => p.id === projectId);
        if (found) setProject(found);
      });

    fetch(`/api/papers?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        const serverPapers: AcademicPaper[] = data.papers || [];
        const mergedMap = new Map<string, AcademicPaper>();
        for (const p of [...projectLocalPapers, ...serverPapers]) {
          if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
        }
        const mergedList = Array.from(mergedMap.values());
        setPapers(mergedList);
        if (mergedList.length > 0) {
          setSelectedPaper(mergedList[0]);
        }
      });

    // Load initial comparison & gaps (including any custom uploaded papers)
    syncProjectSyntheses(projectLocalPapers, localChunks);

    // Load canvas
    fetch(`/api/canvas?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.canvas) {
          const baseCanvas: ResearchCanvasData = data.canvas;
          // Ensure any custom uploaded papers also appear as nodes on the visual map
          const existingNodeIds = new Set(baseCanvas.nodes.map((n) => n.id));
          const extraNodes: CanvasNode[] = [];
          projectLocalPapers.forEach((p, idx) => {
            const nodeId = `node_${p.id}`;
            if (!existingNodeIds.has(nodeId)) {
              extraNodes.push({
                id: nodeId,
                type: "paper",
                label: p.title,
                description: `Uploaded Paper • ${p.authors[0] || "Author"} (${p.publication_year || 2025})`,
                x: 160 + ((idx + 3) % 3) * 310,
                y: 260 + Math.floor((idx + 3) / 3) * 160,
                document_id: p.id,
              });
            }
          });
          setCanvasData({
            ...baseCanvas,
            nodes: [...baseCanvas.nodes, ...extraNodes],
          });
        }
      });

    // Load notes
    fetch(`/api/notes?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Load physical extracted pages when selected paper changes
  useEffect(() => {
    if (!selectedPaper) return;

    // 1. Check if pages are already in client memory (customPages) for instant 0ms load on Vercel
    const cachedPages = customPages
      .filter((p) => p.document_id === selectedPaper.id)
      .sort((a, b) => a.page_number - b.page_number);

    if (cachedPages.length > 0) {
      setPages(cachedPages);
      setCurrentPageNum(1);
      setHighlightedText(null);
      return;
    }

    // 2. Otherwise fetch from API
    fetch(`/api/papers/${selectedPaper.id}/pages`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load extracted pages");
        return res.json();
      })
      .then((data) => {
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
        } else {
          setPages([
            {
              id: `p_${selectedPaper.id}_1`,
              document_id: selectedPaper.id,
              page_number: 1,
              char_count: 500,
              text_content: `Title: ${selectedPaper.title}\nAuthors: ${selectedPaper.authors.join(", ")}\nPublished: ${selectedPaper.publication_year || 2024}\n\nThis paper is ready in your Study Room.`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setCurrentPageNum(1);
        setHighlightedText(null);
      })
      .catch(() => {
        setPages([
          {
            id: `p_${selectedPaper.id}_1`,
            document_id: selectedPaper.id,
            page_number: 1,
            char_count: 500,
            text_content: `Title: ${selectedPaper.title}\nAuthors: ${selectedPaper.authors.join(", ")}\nPublished: ${selectedPaper.publication_year || 2024}`,
            created_at: new Date().toISOString(),
          },
        ]);
        setCurrentPageNum(1);
      });
  }, [selectedPaper, customPages]);

  // Helper to persist newly added paper + pages + chunks in state & localStorage
  const registerNewPaperData = (
    newPaper: AcademicPaper,
    newPages: DocumentPage[],
    newChunks: DocumentChunk[]
  ) => {
    const updatedCustomPapers = [newPaper, ...customPapers];
    const updatedCustomPages = [...customPages, ...newPages];
    const updatedCustomChunks = [...customChunks, ...newChunks];

    setCustomPapers(updatedCustomPapers);
    setCustomPages(updatedCustomPages);
    setCustomChunks(updatedCustomChunks);

    try {
      const allStoredPapers: AcademicPaper[] = JSON.parse(
        localStorage.getItem("sourcewise_custom_papers") || "[]"
      );
      localStorage.setItem(
        "sourcewise_custom_papers",
        JSON.stringify([newPaper, ...allStoredPapers])
      );
      localStorage.setItem("sourcewise_custom_pages", JSON.stringify(updatedCustomPages));
      localStorage.setItem("sourcewise_custom_chunks", JSON.stringify(updatedCustomChunks));
    } catch {
      // ignore storage quota errors
    }

    setPapers((prev) => [newPaper, ...prev]);
    setPages(newPages);
    setSelectedPaper(newPaper);
    setCurrentPageNum(1);
    setHighlightedText(null);
    setActiveTab("reader");

    // Add node to Visual Map
    setCanvasData((prev) => {
      if (!prev) return prev;
      const newNode: CanvasNode = {
        id: `node_${newPaper.id}`,
        type: "paper",
        label: newPaper.title,
        description: `Added Paper • ${newPaper.authors[0] || "Author"} (${newPaper.publication_year || 2025})`,
        x: 200 + (prev.nodes.length % 3) * 280,
        y: 260 + Math.floor(prev.nodes.length / 4) * 140,
        document_id: newPaper.id,
      };
      return {
        ...prev,
        nodes: [...prev.nodes, newNode],
        edges: [
          ...prev.edges,
          {
            id: `edge_${newPaper.id}`,
            source: "node_rq",
            target: newNode.id,
            type: "related_concept",
            label: "Added Source",
          },
        ],
      };
    });

    setUploadSuccessBanner(
      `✅ Added "${newPaper.title}" (${newPages.length} Pages)! You can now read it on the left and ask the AI questions about it on the right.`
    );
    setTimeout(() => setUploadSuccessBanner(null), 8000);

    // Refresh Compare Table & New Ideas (Gaps)
    syncProjectSyntheses(updatedCustomPapers, updatedCustomChunks);
  };

  // Jump to citation page & highlight passage
  const handleCitationClick = (citation: Citation) => {
    const targetPaper = papers.find((p) => p.id === citation.document_id);
    if (targetPaper && targetPaper.id !== selectedPaper?.id) {
      setSelectedPaper(targetPaper);
      // Wait a tick for paper pages to switch, then jump to page & highlight
      setTimeout(() => {
        setCurrentPageNum(citation.page_number);
        setHighlightedText(citation.passage_quote);
      }, 80);
    } else {
      setCurrentPageNum(citation.page_number);
      setHighlightedText(citation.passage_quote);
    }
    setActiveTab("reader");
  };

  // Chat Submission with Gemini & Thinking Trace
  const handleSendMessage = async (e: React.FormEvent, overrideQuestion?: string) => {
    e.preventDefault();
    const q = (overrideQuestion ?? inputQuestion).trim();
    if (!q || chatLoading) return;

    setInputQuestion("");
    setChatLoading(true);

    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: `conv_${projectId}`,
      sender: "user",
      content: q,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempMsg]);

    const userStoredKey =
      typeof window !== "undefined" ? localStorage.getItem("sourcewise_gemini_key") : null;

    // Guarantee the currently open paper and its loaded pages/chunks are included while keeping payload <2MB for Vercel
    const payloadPapers = selectedPaper
      ? [selectedPaper, ...customPapers.filter((p) => p.id !== selectedPaper.id)]
      : customPapers;
    const activePaperPages =
      selectedPaper && pages.length > 0
        ? pages
        : customPages.filter((pg) => !selectedPaper || pg.document_id === selectedPaper.id);
    const payloadPages = activePaperPages.slice(0, 120);

    const activePaperChunks = selectedPaper
      ? customChunks.filter((c) => c.document_id === selectedPaper.id)
      : customChunks;
    const payloadChunks = (activePaperChunks.length > 0 ? activePaperChunks : customChunks).slice(
      0,
      250
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          projectId,
          conversationId: `conv_${projectId}`,
          selectedPaperId: selectedPaper?.id,
          apiKey: userStoredKey || undefined,
          customPapers: payloadPapers,
          customPages: payloadPages,
          customChunks: payloadChunks,
        }),
      });
      const data = await safeJsonResponse<{
        message?: ChatMessage;
        thinking?: string;
        modelUsed?: string;
      }>(res);
      if (data.message) {
        const fullMsg: ChatMessage = {
          ...data.message,
          thinking: data.thinking || data.message.thinking,
          modelUsed: data.modelUsed || data.message.modelUsed,
        };
        setChatMessages((prev) => [...prev, fullMsg]);
      }
    } catch (err) {
      console.error("Chat query failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Formats AI answer text cleanly: strips raw ***/** stars, formats numbered items and section headers, and makes [1] badges clickable
  const renderPrettyAnswerContent = (rawText: string, citations?: Citation[]) => {
    const cleanText = (rawText || "")
      .replace(/\*{2,3}([^*]+)\*{2,3}/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();

    const renderInlineWithCitations = (lineText: string) => {
      const parts = lineText.split(/(\[\d+\])/g);
      return parts.map((part, idx) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match && citations && citations.length > 0) {
          const citIdx = parseInt(match[1], 10) - 1;
          const targetCit = citations[citIdx];
          if (targetCit) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCitationClick(targetCit)}
                className="inline-flex items-center gap-0.5 mx-0.5 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 font-mono-provenance text-[10px] font-bold text-amber-900 hover:bg-amber-200 transition cursor-pointer"
                title={`Jump to Page ${targetCit.page_number}`}
              >
                [{match[1]} • p.{targetCit.page_number}]
              </button>
            );
          }
        }
        return <span key={idx}>{part}</span>;
      });
    };

    const blocks = cleanText.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

    return (
      <div className="space-y-3 text-xs leading-relaxed text-[var(--ink-primary)]">
        {blocks.map((block, bIdx) => {
          const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);

          // Check if block is a "Key Evidence #X (Page Y):" block
          if (lines.length >= 2 && /^Key Evidence #\d+/i.test(lines[0])) {
            return (
              <div
                key={bIdx}
                className="rounded-lg border border-[var(--border-paper-strong)] bg-[var(--surface-paper)] p-3 space-y-1"
              >
                <div className="font-mono-provenance text-[10px] font-bold uppercase text-[var(--accent-sage-dark)]">
                  {lines[0]}
                </div>
                <div className="text-[var(--ink-secondary)]">
                  {renderInlineWithCitations(lines.slice(1).join(" "))}
                </div>
              </div>
            );
          }

          return (
            <div key={bIdx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const isSectionHeader =
                  /^(Core Topics Covered|Page-by-Page Breakdown|Main Ideas|Summary):$/i.test(line) ||
                  (line.endsWith(":") && line.length < 60 && lIdx === 0);
                const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);

                if (isSectionHeader) {
                  return (
                    <div
                      key={lIdx}
                      className="font-editorial text-xs font-bold text-[var(--ink-primary)] pt-1 border-b border-[var(--border-paper)] pb-1"
                    >
                      {line}
                    </div>
                  );
                }

                if (numberedMatch) {
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2 rounded-lg bg-[var(--surface-subtle)] px-2.5 py-1.5 border border-[var(--border-paper)]"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage-dark)] text-[10px] font-bold text-white font-mono-provenance mt-0.5">
                        {numberedMatch[1]}
                      </span>
                      <span className="flex-1 text-[var(--ink-primary)] font-medium">
                        {renderInlineWithCitations(numberedMatch[2])}
                      </span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-[var(--ink-primary)]">
                    {renderInlineWithCitations(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Upload Paper Submission (.pdf, .txt, .md, .tex) — Extracts in Browser first to bypass Vercel's 4.5MB Serverless limit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Extract PDF / Document text directly in the browser (works for any file size: 5MB, 25MB, 100MB+)
      let browserExtracted: Awaited<ReturnType<typeof extractDocumentInBrowser>> | null = null;
      try {
        browserExtracted = await extractDocumentInBrowser(file, projectId);
      } catch (clientErr) {
        console.warn("Browser PDF extraction fallback:", clientErr);
      }

      if (
        browserExtracted &&
        browserExtracted.hasSelectableText &&
        browserExtracted.extractedPages.length > 0
      ) {
        // Immediately register full pages & chunks on the client so the reader and AI have 100% of the document
        registerNewPaperData(
          browserExtracted.paper,
          browserExtracted.pages,
          browserExtracted.chunks
        );

        // Sync lightweight extracted text JSON (<1.5MB) to server store in the background
        try {
          await fetch("/api/papers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperId: browserExtracted.paper.id,
              projectId,
              fileName: file.name,
              fileSize: file.size,
              title: browserExtracted.paper.title,
              authors: browserExtracted.paper.authors,
              publication_year: browserExtracted.paper.publication_year,
              journal_or_venue: browserExtracted.paper.journal_or_venue,
              doi: browserExtracted.paper.doi,
              extractedPages: browserExtracted.extractedPages.slice(0, 150),
            }),
          });
        } catch {
          // Client already registered the full paper, pages, and chunks
        }
        return;
      }

      // Step 2: If file is under 3.8MB (safe for Vercel Serverless), try server binary extraction (pdf-parse fallback)
      if (file.size < 3.8 * 1024 * 1024) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const res = await fetch("/api/papers", {
          method: "POST",
          body: formData,
        });
        const data = await safeJsonResponse<{
          paper?: AcademicPaper;
          pages?: DocumentPage[];
          chunks?: DocumentChunk[];
          error?: string;
        }>(res);
        if (res.ok && data.paper) {
          registerNewPaperData(data.paper, data.pages || [], data.chunks || []);
          return;
        }
      }

      // Step 3: If PDF is a large scanned image-only file without selectable text, synthesize structured study pages from its title
      const cleanDocTitle =
        browserExtracted?.paper.title ||
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim() ||
        project?.title ||
        "Uploaded Study Material";

      const fallbackRes = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          topic: `${cleanDocTitle} (${project?.title || "Academic Study"})`,
          title: cleanDocTitle,
        }),
      });
      const fallbackData = await safeJsonResponse<{
        paper?: AcademicPaper;
        pages?: DocumentPage[];
        chunks?: DocumentChunk[];
        error?: string;
      }>(fallbackRes);
      if (!fallbackRes.ok) {
        throw new Error(fallbackData.error || "Upload failed");
      }
      if (fallbackData.paper) {
        registerNewPaperData(
          fallbackData.paper,
          fallbackData.pages || [],
          fallbackData.chunks || []
        );
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Ingest Custom Topic or Manuscript Submission
  const handleIngestTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.topic.trim() || !topicForm.title.trim()) return;

    setTopicSubmitting(true);
    setTopicError(null);

    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          topic: topicForm.topic.trim(),
          title: topicForm.title.trim(),
          authors: topicForm.authors
            ? topicForm.authors.split(",").map((a) => a.trim())
            : undefined,
          publication_year: topicForm.publication_year
            ? parseInt(topicForm.publication_year, 10)
            : undefined,
          content: topicForm.content.trim().slice(0, 500000) || undefined,
        }),
      });

      const data = await safeJsonResponse<{
        paper?: AcademicPaper;
        pages?: DocumentPage[];
        chunks?: DocumentChunk[];
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error || "Failed to add topic");
      }

      if (data.paper) {
        setShowTopicModal(false);
        setTopicForm({
          topic: "",
          title: "",
          authors: "",
          publication_year: new Date().getFullYear().toString(),
          content: "",
        });
        registerNewPaperData(data.paper, data.pages || [], data.chunks || []);
      }
    } catch (err: unknown) {
      setTopicError(err instanceof Error ? err.message : "Failed to add topic");
    } finally {
      setTopicSubmitting(false);
    }
  };

  // Delete Paper Handler
  const handleDeletePaper = async (paperId: string) => {
    const remaining = papers.filter((p) => p.id !== paperId);
    setPapers(remaining);
    if (selectedPaper?.id === paperId) {
      setSelectedPaper(remaining[0] || null);
    }
    const updatedCustom = customPapers.filter((p) => p.id !== paperId);
    setCustomPapers(updatedCustom);
    try {
      localStorage.setItem("sourcewise_custom_papers", JSON.stringify(updatedCustom));
    } catch {
      // ignore
    }
    await fetch(`/api/papers?id=${paperId}`, { method: "DELETE" });
  };

  // Add Custom Node to Visual Map
  const handleAddCanvasNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim() || !canvasData) return;

    const newNode: CanvasNode = {
      id: `node_custom_${Date.now()}`,
      type: "concept",
      label: newNodeLabel.trim(),
      description: newNodeDesc.trim() || "Custom idea box added by student.",
      x: 260 + ((canvasData.nodes.length * 70) % 400),
      y: 320 + ((canvasData.nodes.length * 50) % 250),
    };

    setCanvasData({
      ...canvasData,
      nodes: [...canvasData.nodes, newNode],
      edges: [
        ...canvasData.edges,
        {
          id: `edge_custom_${Date.now()}`,
          source: "node_rq",
          target: newNode.id,
          type: "related_concept",
          label: "My Idea",
        },
      ],
    });
    setSelectedNode(newNode);
    setNewNodeLabel("");
    setNewNodeDesc("");
    setShowAddNodeModal(false);
  };

  // Real Download for Comparison Table
  const handleDownloadComparison = () => {
    if (!comparison) return;
    const lines = [
      `# ${comparison.title}`,
      `Generated by SOURCEWISE on ${new Date().toLocaleDateString()}`,
      "",
      "| Paper | Main Goal | How They Did It (Method) | Data Used | Main Results | Weaknesses / Limits |",
      "| --- | --- | --- | --- | --- | --- |",
      ...comparison.matrix_data.rows.map(
        (r) =>
          `| **${r.paper_title}** (${r.year || 2024}) | ${r.values.objective?.text || "-"} | ${r.values.methodology?.text || "-"} | ${r.values.dataset?.text || "-"} | ${r.values.key_findings?.text || "-"} | ${r.values.limitations?.text || "-"} |`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sourcewise-comparison-${projectId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          document_id: selectedPaper?.id || null,
          document_title: selectedPaper?.title || null,
          title: newNoteTitle,
          content: newNoteContent,
          page_reference: newNotePage ? parseInt(newNotePage, 10) : null,
          tags: ["study-note"],
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewNotePage("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  const activePage = pages.find((p) => p.page_number === currentPageNum) || pages[0];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface-paper)] text-[var(--ink-primary)]">
      <Navbar />

      {/* Top Project Bar + Quick Upload Buttons */}
      <div className="border-b border-[var(--border-paper)] bg-white px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto max-w-7xl flex flex-col gap-3">
          {/* Row 1: Project Title + Global Add Paper / Topic Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Link
                href="/workspace"
                className="mt-1 rounded p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)]"
                title="Back to All Projects"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)]">
                    Study Room
                  </span>
                  <span className="text-[var(--border-paper-strong)]">•</span>
                  <span className="font-mono-provenance text-[11px] font-semibold text-[var(--ink-secondary)]">
                    {papers.length} Paper{papers.length === 1 ? "" : "s"} Loaded
                  </span>
                </div>
                <h1 className="font-editorial text-lg sm:text-xl font-bold text-[var(--ink-primary)]">
                  {project?.title || "How AI & Transformers Work (Study Room)"}
                </h1>
              </div>
            </div>

            {/* Always-Visible Action Buttons: Add Topic, Upload PDF, Show Help */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTopicModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[var(--accent-sage-dark)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--accent-sage-dark)] shadow-2xs transition hover:bg-[var(--accent-sage-light)] cursor-pointer"
              >
                <FilePlus className="h-3.5 w-3.5" />
                <span>+ Add Topic or Paste Text</span>
              </button>

              <label className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--accent-sage)] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? "Reading File..." : "+ Upload PDF / File"}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.tex"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowGuide((g) => !g)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-paper-strong)] bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
                <span>{showGuide ? "Hide Guide" : "How This Works"}</span>
              </button>
            </div>
          </div>

          {/* Friendly 4-Step Visual Guide Banner */}
          {showGuide && (
            <div className="rounded-xl border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)]/60 p-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="rounded-lg bg-white p-2.5 border border-[var(--border-paper)]">
                  <strong className="text-[var(--accent-sage-dark)] block font-mono-provenance text-[10px] uppercase">
                    Step 1: Add Your Data
                  </strong>
                  <span className="text-[var(--ink-secondary)] text-[11px]">
                    Click <strong>+ Upload PDF</strong> or <strong>+ Add Topic</strong> above to use your own file or subject!
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-[var(--border-paper)]">
                  <strong className="text-[var(--accent-sage-dark)] block font-mono-provenance text-[10px] uppercase">
                    Step 2: Ask the AI Helper
                  </strong>
                  <span className="text-[var(--ink-secondary)] text-[11px]">
                    Type any question in the <strong>AI Chat Box on the right</strong> (or click a sample question).
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-[var(--border-paper)]">
                  <strong className="text-[var(--accent-amber)] block font-mono-provenance text-[10px] uppercase">
                    Step 3: Click Yellow Proofs
                  </strong>
                  <span className="text-[var(--ink-secondary)] text-[11px]">
                    Click any <strong>yellow proof card [1]</strong> in the AI&apos;s answer to highlight the exact sentence!
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-[var(--border-paper)]">
                  <strong className="text-[var(--accent-sage-dark)] block font-mono-provenance text-[10px] uppercase">
                    Step 4: Compare &amp; Explore
                  </strong>
                  <span className="text-[var(--ink-secondary)] text-[11px]">
                    Click the tabs below to see the <strong>Compare Table</strong>, <strong>Visual Map</strong>, and <strong>New Ideas</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Notification Banner after Upload / Topic Ingestion */}
          {uploadSuccessBanner && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-950 flex items-center justify-between">
              <span>{uploadSuccessBanner}</span>
              <button
                onClick={() => setUploadSuccessBanner(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button onClick={() => setUploadError(null)} className="font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Row 2: Numbered, Plain-English Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-[var(--border-paper)] bg-[var(--surface-subtle)] p-1 text-xs">
            <button
              onClick={() => setActiveTab("reader")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "reader"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              1. Read &amp; Ask AI
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "library"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              2. My Papers ({papers.length})
            </button>
            <button
              onClick={() => setActiveTab("comparison")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "comparison"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Columns className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              3. Compare Table
            </button>
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "canvas"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              4. Visual Map
            </button>
            <button
              onClick={() => setActiveTab("gaps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "gaps"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
              5. New Ideas (Gaps)
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition shrink-0 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-bold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              6. My Notes ({notes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-hidden">
        {/* ======================================================== */}
        {/* TAB 1: SPLIT-PANE PAPER READER & AI HELPER */}
        {/* ======================================================== */}
        {activeTab === "reader" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-195px)] min-h-[540px]">
            {/* Left Pane: Paper Reader (7 cols) */}
            <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-paper)] bg-white overflow-hidden">
              {/* Document Subheader / Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs">
                {/* Paper Selector Dropdown */}
                <div className="flex items-center gap-2 max-w-md truncate">
                  <span className="font-mono-provenance text-[10px] font-bold uppercase text-[var(--accent-sage-dark)] shrink-0">
                    📄 Reading:
                  </span>
                  <select
                    value={selectedPaper?.id || ""}
                    onChange={(e) => {
                      const p = papers.find((x) => x.id === e.target.value);
                      if (p) setSelectedPaper(p);
                    }}
                    className="rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--ink-primary)] truncate focus:outline-none"
                  >
                    {papers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.publication_year || 2024})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page Navigation Controls */}
                <div className="flex items-center gap-2 font-mono-provenance text-xs">
                  <button
                    onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                    disabled={currentPageNum <= 1}
                    className="rounded border border-[var(--border-paper)] bg-white px-2 py-1 hover:bg-zinc-100 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>
                  <span className="font-bold text-[var(--ink-primary)] px-1">
                    Page {currentPageNum} of{" "}
                    {pages.length > 0 ? pages.length : selectedPaper?.page_count || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPageNum((p) => Math.min(pages.length, p + 1))}
                    disabled={currentPageNum >= pages.length}
                    className="rounded border border-[var(--border-paper)] bg-white px-2 py-1 hover:bg-zinc-100 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    title="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Physical Document Page Reading View */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-editorial text-sm sm:text-base leading-relaxed text-[var(--ink-primary)] selection:bg-amber-100">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Paper Header / Metadata Stamp */}
                  <div className="border-b border-[var(--border-paper)] pb-4 text-center">
                    <span className="font-mono-provenance text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                      {selectedPaper?.journal_or_venue || "Uploaded Paper"} • Page {currentPageNum}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold mt-1 text-[var(--ink-primary)]">
                      {selectedPaper?.title}
                    </h2>
                    <p className="font-sans-ui text-xs text-[var(--ink-muted)] mt-1.5">
                      Authors: {selectedPaper?.authors.join(", ")}
                    </p>
                  </div>

                  {/* Render Page Content with Passage Highlight */}
                  <div className="prose max-w-none text-[var(--ink-secondary)]">
                    {highlightedText && activePage?.text_content.includes(highlightedText) ? (
                      <div className="whitespace-pre-wrap">
                        {activePage.text_content.split(highlightedText).map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <mark className="rounded px-1.5 py-0.5 citation-target-highlight font-semibold text-[var(--ink-primary)]">
                                {highlightedText}
                              </mark>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {activePage?.text_content || "Loading paper text..."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Simple Footer Bar */}
              <div className="border-t border-[var(--border-paper)] bg-[var(--surface-paper)] px-4 py-2.5 flex items-center justify-between text-xs font-mono-provenance text-[var(--ink-muted)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
                  <span>
                    Showing Real Extracted Text from Page {currentPageNum}
                  </span>
                </div>
                {highlightedText && (
                  <button
                    onClick={() => setHighlightedText(null)}
                    className="text-[var(--accent-amber)] font-semibold hover:underline cursor-pointer"
                  >
                    Clear yellow highlight
                  </button>
                )}
              </div>
            </div>

            {/* Right Pane: AI Study & Research Helper (5 cols) */}
            <div className="lg:col-span-5 flex flex-col bg-[var(--surface-paper)] overflow-hidden">
              {/* AI Assistant Header */}
              <div className="border-b border-[var(--border-paper)] bg-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    🤖 AI Study &amp; Research Helper
                  </h3>
                </div>
                <span className="font-mono-provenance text-[10px] text-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] px-2 py-0.5 rounded font-semibold">
                  100% Real Page Proof
                </span>
              </div>

              {/* Chat Dialogue Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-6 px-3">
                    <BookOpen className="h-8 w-8 text-[var(--accent-sage)] mx-auto mb-2 opacity-80" />
                    <h4 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                      Ask Anything About Your Papers!
                    </h4>
                    <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-sm mx-auto">
                      Currently reading:{" "}
                      <strong className="text-[var(--ink-primary)]">
                        {selectedPaper?.title}
                      </strong>
                      . Click a sample question below or type your own!
                    </p>
                    <div className="mt-4 flex flex-col gap-2 max-w-sm mx-auto text-xs">
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSendMessage(
                            e,
                            `Explain the main idea of "${selectedPaper?.title || "this paper"}" in simple words.`
                          )
                        }
                        className="rounded-lg border border-[var(--border-paper-strong)] bg-white p-2.5 text-left font-medium text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] hover:bg-[var(--accent-sage-light)]/30 transition cursor-pointer"
                      >
                        💬 &ldquo;Explain the main idea of this paper in simple words.&rdquo;
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSendMessage(
                            e,
                            `What methods or experiments did they use in "${selectedPaper?.title || "this paper"}", and what were the results?`
                          )
                        }
                        className="rounded-lg border border-[var(--border-paper-strong)] bg-white p-2.5 text-left font-medium text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] hover:bg-[var(--accent-sage-light)]/30 transition cursor-pointer"
                      >
                        💬 &ldquo;What methods did they use and what were the results?&rdquo;
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSendMessage(
                            e,
                            "What are the main limitations, weaknesses, or unsolved problems mentioned in the papers?"
                          )
                        }
                        className="rounded-lg border border-[var(--border-paper-strong)] bg-white p-2.5 text-left font-medium text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] hover:bg-[var(--accent-sage-light)]/30 transition cursor-pointer"
                      >
                        💬 &ldquo;What are the weaknesses or unsolved problems mentioned?&rdquo;
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3.5 text-xs ${
                        msg.sender === "user"
                          ? "bg-white border border-[var(--border-paper)] ml-6"
                          : "bg-white border-2 border-[var(--border-paper-strong)] shadow-xs mr-1 space-y-3"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-provenance text-[var(--ink-muted)] mb-1">
                        <span className="font-bold text-[var(--ink-primary)]">
                          {msg.sender === "user"
                            ? "🧑 Your Question"
                            : "🤖 AI Answer (Backed by Your Papers)"}
                        </span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Explicit AI Reasoning / Thinking Steps (Shown FIRST and open so user sees AI thinking) */}
                      {msg.thinking && (
                        <details
                          open
                          className="text-xs border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)]/40 rounded-lg p-2.5 group"
                        >
                          <summary className="cursor-pointer font-mono-provenance text-[10px] font-bold uppercase tracking-wider text-[var(--accent-sage-dark)] flex items-center justify-between list-none">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[var(--accent-sage)] inline-block"></span>
                              🧠 AI Thinking Process (How I Analyzed Your Document)
                            </span>
                            <span className="text-[10px] font-mono-provenance text-[var(--ink-muted)]">
                              {msg.modelUsed || "Smart Study Engine"}
                            </span>
                          </summary>
                          <div className="mt-2 pt-2 border-t border-[var(--border-paper)] font-mono-provenance text-[11px] leading-relaxed text-[var(--ink-secondary)] whitespace-pre-wrap bg-white p-2.5 rounded border border-[var(--border-paper)]">
                            {msg.thinking}
                          </div>
                        </details>
                      )}

                      {/* Clean, Pretty Formatted Answer Content (No raw ** or *** stars) */}
                      <div className="font-sans-ui">
                        {msg.sender === "user" ? (
                          <div className="whitespace-pre-wrap leading-relaxed text-[var(--ink-primary)] font-medium">
                            {msg.content}
                          </div>
                        ) : (
                          renderPrettyAnswerContent(msg.content, msg.citations)
                        )}
                      </div>

                      {/* Render Clickable Page Proof Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="border-t border-[var(--border-paper)] pt-2.5 space-y-1.5">
                          <span className="font-mono-provenance text-[10px] font-bold text-[var(--accent-sage-dark)] uppercase block">
                            📌 Exact Page Proof ({msg.citations.length}) — Click any box to highlight it on the left:
                          </span>
                          <div className="space-y-1.5">
                            {msg.citations.map((cit, idx) => (
                              <button
                                key={cit.id || idx}
                                onClick={() => handleCitationClick(cit)}
                                className="w-full text-left rounded-lg border-2 border-[var(--accent-amber-border)] bg-amber-50/80 p-2.5 text-[11px] hover:bg-amber-100 transition flex items-start gap-2 cursor-pointer"
                              >
                                <span className="font-mono-provenance font-bold text-[var(--accent-amber)] shrink-0">
                                  [{idx + 1}]
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-[var(--ink-primary)] truncate">
                                    {cit.document_title || selectedPaper?.title || "Your Paper"} • Page {cit.page_number}
                                  </div>
                                  <div className="italic text-[var(--ink-secondary)] line-clamp-2 mt-0.5">
                                    “{cit.passage_quote}”
                                  </div>
                                </div>
                                <span className="font-mono-provenance text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded shrink-0 font-bold">
                                  Show Page {cit.page_number} →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Takeaway Callout */}
                      {msg.interpretation && (
                        <div className="rounded-lg border-l-2 border-[var(--accent-sage)] bg-[var(--accent-sage-light)]/60 p-2.5 text-[11px] text-[var(--accent-sage-dark)]">
                          <strong className="block font-bold">💡 Simple Takeaway:</strong>
                          {msg.interpretation}
                        </div>
                      )}

                      {/* What's Not Covered Callout */}
                      {msg.uncertainty && (
                        <div className="rounded-lg border-l-2 border-amber-500 bg-amber-50/70 p-2 text-[10px] text-amber-900">
                          <strong className="block font-bold">⚠️ Good to Know:</strong>
                          {msg.uncertainty}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="rounded-xl border-2 border-[var(--accent-sage-border)] bg-white p-3.5 text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 font-mono-provenance font-bold text-[var(--accent-sage-dark)]">
                      <Sparkles className="h-4 w-4 animate-spin text-[var(--accent-sage)]" />
                      <span>🧠 AI is thinking &amp; scanning &ldquo;{selectedPaper?.title || "your document"}&rdquo;...</span>
                    </div>
                    <div className="pl-6 space-y-1 text-[11px] font-mono-provenance text-[var(--ink-secondary)]">
                      <div>1. Reading all {pages.length || selectedPaper?.page_count || 1} pages of your selected document...</div>
                      <div>2. Extracting core concepts, definitions, and formulas...</div>
                      <div>3. Verifying exact page numbers &amp; quotes...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => handleSendMessage(e)}
                className="border-t border-[var(--border-paper)] bg-white p-3 flex gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Type a question in simple words (e.g. What is this paper about?)..."
                  className="flex-1 rounded-lg border border-[var(--border-paper-strong)] bg-[var(--surface-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputQuestion.trim()}
                  className="rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  aria-label="Ask AI"
                >
                  <span>Ask AI</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MY PAPERS (PAPER LIBRARY) */}
        {/* ======================================================== */}
        {activeTab === "library" && (
          <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  My Uploaded Papers &amp; Topics ({papers.length})
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  All the PDFs, text files, and topics inside this project. Click &ldquo;Read &amp; Ask AI&rdquo; on any card to open it!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-paper-strong)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)] shadow-xs transition hover:bg-[var(--surface-subtle)] cursor-pointer"
                >
                  <FilePlus className="h-4 w-4 text-[var(--accent-sage-dark)]" />
                  <span>+ Add Topic or Paste Text</span>
                </button>

                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? "Reading File..." : "+ Upload File (.pdf, .txt, .md)"}</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.tex"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs transition hover:border-[var(--accent-sage-border)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono-provenance text-[var(--ink-muted)] mb-2">
                      <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 font-semibold text-[var(--ink-secondary)]">
                        Year: {paper.publication_year || 2024}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[var(--accent-sage-dark)] font-bold">
                          <CheckCircle className="h-3 w-3" />
                          Ready
                        </span>
                        {papers.length > 1 && (
                          <button
                            onClick={() => handleDeletePaper(paper.id)}
                            className="text-zinc-400 hover:text-red-600 p-0.5 cursor-pointer"
                            title="Remove paper"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)] line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)] mt-1 line-clamp-1">
                      By {paper.authors.join(", ")}
                    </p>
                    {paper.journal_or_venue && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-1 italic line-clamp-1">
                        {paper.journal_or_venue}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-[var(--border-paper)] flex items-center justify-between text-xs">
                    <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                      {paper.page_count} Page{paper.page_count === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPaper(paper);
                        setActiveTab("reader");
                      }}
                      className="rounded bg-[var(--accent-sage-light)] px-3 py-1 text-[var(--accent-sage-dark)] font-bold hover:bg-[var(--accent-sage-dark)] hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read &amp; Ask AI</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SIDE-BY-SIDE COMPARE TABLE */}
        {/* ======================================================== */}
        {activeTab === "comparison" && (
          <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  Side-by-Side Paper Comparison Table
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  Compare all {papers.length} papers in your project at a glance: What was their goal? How did they do it? What worked? What didn&apos;t work?
                </p>
              </div>
              <button
                onClick={handleDownloadComparison}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-paper-strong)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] self-start sm:self-auto cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Table (.md)</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border-paper)] bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] font-mono-provenance text-[11px] text-[var(--ink-primary)]">
                    <th className="p-4 font-bold min-w-[190px]">Paper Name</th>
                    <th className="p-4 font-bold min-w-[220px]">Main Goal (What they wanted to do)</th>
                    <th className="p-4 font-bold min-w-[220px]">How They Did It (Method)</th>
                    <th className="p-4 font-bold min-w-[180px]">Data Tested On</th>
                    <th className="p-4 font-bold min-w-[220px]">Main Results (What worked)</th>
                    <th className="p-4 font-bold min-w-[220px]">Weaknesses (What didn&apos;t work)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-paper)] leading-relaxed">
                  {comparison?.matrix_data.rows.map((row) => (
                    <tr key={row.paper_id} className="hover:bg-[var(--surface-paper)] transition-colors">
                      <td className="p-4 align-top font-semibold text-[var(--ink-primary)]">
                        <div className="font-editorial text-sm">{row.paper_title}</div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                          {row.authors[0]} ({row.year || 2024})
                        </div>
                        <button
                          onClick={() => {
                            const found = papers.find((p) => p.id === row.paper_id);
                            if (found) {
                              setSelectedPaper(found);
                              setActiveTab("reader");
                            }
                          }}
                          className="mt-2 text-[11px] text-[var(--accent-sage-dark)] font-bold hover:underline cursor-pointer"
                        >
                          Open Paper →
                        </button>
                      </td>
                      <td className="p-4 align-top text-[var(--ink-secondary)]">
                        {row.values.objective?.text}
                      </td>
                      <td className="p-4 align-top text-[var(--ink-secondary)]">
                        {row.values.methodology?.text}
                      </td>
                      <td className="p-4 align-top text-[var(--ink-secondary)]">
                        {row.values.dataset?.text}
                      </td>
                      <td className="p-4 align-top text-[var(--ink-secondary)]">
                        {row.values.key_findings?.text}
                      </td>
                      <td className="p-4 align-top text-[var(--ink-secondary)]">
                        {row.values.limitations?.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: VISUAL IDEA MAP (RESEARCH CANVAS) */}
        {/* ======================================================== */}
        {activeTab === "canvas" && (
          <div className="h-[calc(100vh-195px)] min-h-[540px] flex flex-col relative overflow-hidden bg-[var(--surface-subtle)]">
            {/* Canvas Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-paper-strong)] bg-white p-2 shadow-sm text-xs font-mono-provenance">
              <span className="font-bold text-[var(--accent-sage-dark)]">
                🗺️ Visual Idea Map (Click any box to inspect)
              </span>
              <span className="text-[var(--border-paper)]">|</span>
              <button
                onClick={() => setShowAddNodeModal(true)}
                className="rounded bg-[var(--accent-sage-dark)] px-2.5 py-1 text-white font-sans-ui font-semibold hover:bg-[var(--accent-sage)] cursor-pointer"
              >
                + Add My Own Box
              </button>
              <span className="text-[var(--border-paper)]">|</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded cursor-pointer"
                title="Reset zoom"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Canvas Viewport */}
            <div
              className="flex-1 w-full h-full relative p-10 overflow-auto"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {/* SVG Edges Layer */}
              <svg className="absolute inset-0 w-[1300px] h-[950px] pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#A3B8A8" />
                  </marker>
                </defs>
                {canvasData?.edges.map((edge) => {
                  const sourceNode = canvasData.nodes.find((n) => n.id === edge.source);
                  const targetNode = canvasData.nodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourceNode.x + 120}
                        y1={sourceNode.y + 40}
                        x2={targetNode.x + 120}
                        y2={targetNode.y + 40}
                        stroke="#A3B8A8"
                        strokeWidth="2"
                        strokeDasharray={edge.is_ai_suggested ? "4,4" : undefined}
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <text
                          x={(sourceNode.x + targetNode.x) / 2 + 120}
                          y={(sourceNode.y + targetNode.y) / 2 + 35}
                          fill="#52525B"
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* HTML Nodes Layer */}
              {canvasData?.nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`absolute w-64 rounded-xl border p-4 shadow-sm transition-transform hover:scale-105 cursor-pointer bg-white ${
                    selectedNode?.id === node.id
                      ? "border-[var(--accent-sage-dark)] ring-2 ring-[var(--accent-sage-light)]"
                      : "border-[var(--border-paper-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`font-mono-provenance text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        node.type === "potential_gap"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : node.type === "paper"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {node.type === "potential_gap"
                        ? "New Idea / Gap"
                        : node.type === "research_question"
                        ? "Main Question"
                        : node.type.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="font-editorial text-sm font-bold text-[var(--ink-primary)] line-clamp-2">
                    {node.label}
                  </h4>
                  {node.description && (
                    <p className="text-[11px] text-[var(--ink-secondary)] mt-1 line-clamp-3">
                      {node.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Node Inspector Drawer */}
            {selectedNode && (
              <div className="absolute right-4 top-4 bottom-4 w-80 rounded-xl border border-[var(--border-paper-strong)] bg-white p-5 shadow-xl z-20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-2 mb-3">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)]">
                      Box Details
                    </span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)] mt-1">
                    {selectedNode.label}
                  </h3>
                  <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                    {selectedNode.description}
                  </p>

                  {selectedNode.document_id && (
                    <div className="mt-4 pt-3 border-t border-[var(--border-paper)]">
                      <button
                        onClick={() => {
                          const p = papers.find((x) => x.id === selectedNode.document_id);
                          if (p) {
                            setSelectedPaper(p);
                            setActiveTab("reader");
                          }
                        }}
                        className="rounded-lg bg-[var(--accent-sage-dark)] px-3 py-2 text-xs text-white font-semibold hover:bg-[var(--accent-sage)] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read This Paper &amp; Ask AI →</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-paper)] pt-3 text-[10px] font-mono-provenance text-[var(--ink-muted)]">
                  Connected to your project map
                </div>
              </div>
            )}

            {/* Add Custom Node Modal */}
            {showAddNodeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <form
                  onSubmit={handleAddCanvasNode}
                  className="w-full max-w-md rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xl space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-2">
                    <h4 className="font-editorial text-base font-bold">Add Idea Box to Map</h4>
                    <button type="button" onClick={() => setShowAddNodeModal(false)}>
                      ✕
                    </button>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Box Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Test with Middle School Students"
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      className="w-full rounded border border-[var(--border-paper)] px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Short Explanation</label>
                    <textarea
                      rows={2}
                      placeholder="How does this connect to your project?"
                      value={newNodeDesc}
                      onChange={(e) => setNewNodeDesc(e.target.value)}
                      className="w-full rounded border border-[var(--border-paper)] px-3 py-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNodeModal(false)}
                      className="rounded border px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-[var(--accent-sage-dark)] px-4 py-1.5 text-white font-semibold"
                    >
                      Add to Map
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: NEW PROJECT IDEAS & WHAT'S MISSING (GAPS) */}
        {/* ======================================================== */}
        {activeTab === "gaps" && (
          <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
            <div className="border-b border-[var(--border-paper)] pb-4">
              <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-amber)] font-bold">
                Find Your Next Topic
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold mt-1 text-[var(--ink-primary)]">
                New Project Ideas &amp; What&apos;s Missing in These Papers
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-2xl leading-relaxed">
                Need an idea for your own essay, science project, or thesis? Here are unsolved problems and limits mentioned directly inside your uploaded papers!
              </p>
            </div>

            {/* Helpful Tip Banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--accent-amber)] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Helpful Note:</strong>
                {gapAnalysis?.uncertainty_assessment}
              </div>
            </div>

            {/* Candidate Gaps Cards */}
            <div className="space-y-6">
              {gapAnalysis?.candidate_gaps.map((gap, idx) => (
                <div
                  key={gap.id}
                  className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono-provenance text-[10px] font-bold uppercase text-[var(--accent-amber)]">
                        💡 Project Idea #{idx + 1}
                      </span>
                      <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                        {gap.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    {gap.description}
                  </p>

                  {/* Supporting Evidence */}
                  <div className="rounded-lg border border-[var(--border-paper)] bg-[var(--surface-paper)] p-3.5 text-xs space-y-2">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)] block">
                      📖 Proof from Your Papers:
                    </span>
                    {gap.supporting_evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-[var(--ink-secondary)] pl-2.5 border-l-2 border-[var(--accent-sage)]"
                      >
                        <span className="font-bold text-[var(--ink-primary)]">
                          {ev.paper_title} (Page {ev.page_number}):
                        </span>{" "}
                        “{ev.quote}”
                      </div>
                    ))}
                  </div>

                  {/* Stated Limitations */}
                  <div className="text-xs space-y-1">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--ink-muted)] block">
                      ⚠️ What the Authors Said Was Missing:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-[var(--ink-secondary)] space-y-1">
                      {gap.stated_limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Validation Plan */}
                  <div className="border-t border-[var(--border-paper)] pt-3 text-xs">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)] block mb-1.5">
                      ✅ How You Could Turn This Into Your Own Project (Step-by-Step):
                    </span>
                    <ol className="list-decimal list-inside text-[11px] text-[var(--ink-secondary)] space-y-1">
                      {gap.suggested_validation_plan.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: MY STUDY NOTES */}
        {/* ======================================================== */}
        {activeTab === "notes" && (
          <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  My Study Notes ({notes.length})
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  Write down your own summaries or ideas and attach them to a specific paper and page number.
                </p>
              </div>
            </div>

            {/* Note Creation Card */}
            <form
              onSubmit={handleAddNote}
              className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs space-y-3"
            >
              <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                ✍️ Write a New Study Note
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Note Title (e.g. Main takeaway from Page 2)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="sm:col-span-2 rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Page Number (optional)"
                  value={newNotePage}
                  onChange={(e) => setNewNotePage(e.target.value)}
                  className="rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Write your thoughts or summary in your own words..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)] cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Saved Notes Stream */}
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                      {note.title}
                    </h4>
                    {note.page_reference && (
                      <span className="font-mono-provenance text-[10px] font-bold text-[var(--accent-amber)] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Page {note.page_reference}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.document_title && (
                    <div className="text-[11px] text-[var(--ink-muted)] pt-2 border-t border-[var(--border-paper)]">
                      From Paper: <strong className="text-[var(--ink-primary)]">{note.document_title}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ADD CUSTOM TOPIC / PASTE TEXT MODAL */}
      {/* ======================================================== */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)]">
                  Add Your Own Study Material
                </span>
                <h3 className="font-editorial text-xl font-bold text-[var(--ink-primary)]">
                  Add a Topic or Paste an Article / Paper
                </h3>
                <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                  Type any topic you want to learn about (or paste your own article). Sourcewise will turn it into pages so you can read it and ask the AI questions!
                </p>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="rounded p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)] cursor-pointer"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1-Click Sample Topics */}
            <div className="bg-[var(--surface-subtle)] p-3 rounded-lg border border-[var(--border-paper)] text-xs">
              <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--ink-secondary)] block mb-1.5">
                ⚡ Want to test fast? Click a sample topic below to fill the form:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTopicForm({
                      topic: "How Volcanoes and Earth's Tectonic Plates Work",
                      title: "Understanding Volcanoes, Magma Chambers, and Plate Tectonics",
                      authors: "National Earth Science Team, Dr. Sarah Jenkins",
                      publication_year: "2025",
                      content: `Earth's outer crust is broken into giant puzzle pieces called tectonic plates. When these plates crash together or pull apart, hot melted rock called magma rises from deep underground toward the surface.

---

Once magma breaks through the Earth's surface, it is called lava. Shield volcanoes have gentle slopes and runny lava, while stratovolcanoes build tall cones that can erupt with explosive ash clouds and pyroclastic flows.

---

A major challenge for volcano scientists is predicting the exact day an eruption will happen. Current sensors only measure ground shaking and gas leaks near the surface, leaving deep magma movements hard to see clearly.`,
                    })
                  }
                  className="rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] transition cursor-pointer"
                >
                  🌋 Volcanoes &amp; Earth Science (Simple)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTopicForm({
                      topic: "How Sleep Helps the Brain Store Memories",
                      title: "The Role of Deep Sleep in Memory Consolidation and Learning",
                      authors: "Dr. Matthew Walker, Elena Rostova",
                      publication_year: "2024",
                      content: `When students learn new facts during the day, the brain temporarily stores them in a region called the hippocampus. However, the hippocampus has limited storage space and needs sleep to transfer memories to long-term storage.

---

Experiments comparing students who slept 8 hours versus students who stayed awake all night showed a 40% drop in ability to remember new vocabulary words when sleep was skipped. Deep slow-wave sleep replays daytime learning at high speed.

---

A key limitation in current sleep studies is that most experiments only test college students in laboratory bedrooms for one night, rather than tracking children and teenagers over a full school year at home.`,
                    })
                  }
                  className="rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] transition cursor-pointer"
                >
                  🧠 How Sleep Helps Memory
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTopicForm({
                      topic: "Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
                      title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
                      authors: "DeepSeek-AI, Daya Guo, Dejian Yang",
                      publication_year: "2025",
                      content: `DeepSeek-R1 introduces reasoning models trained using large-scale reinforcement learning (RL) where the AI learns by trial and error without needing human-written examples first.

---

The training method uses GRPO (Group Relative Policy Optimization) with automatic math and code grading. The model teaches itself to double-check its own work and pause to think longer on hard problems.

---

A key limitation is that the model sometimes mixes different languages together when thinking through long problems, and can be tricked by poorly worded prompts.`,
                    })
                  }
                  className="rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink-primary)] hover:border-[var(--accent-sage-dark)] transition cursor-pointer"
                >
                  🤖 DeepSeek-R1 AI Reasoning
                </button>
              </div>
            </div>

            {topicError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            {/* Topic Form */}
            <form onSubmit={handleIngestTopic} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono-provenance text-[11px] font-bold text-[var(--ink-primary)] block mb-1">
                  1. What Topic Do You Want to Study? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How Solar Panels Work, or Photosynthesis in Plants"
                  value={topicForm.topic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTopicForm((prev) => ({
                      ...prev,
                      topic: val,
                      title: prev.title || val,
                    }));
                  }}
                  className="w-full rounded border border-[var(--border-paper)] px-3 py-2 focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-mono-provenance text-[11px] font-bold text-[var(--ink-primary)] block mb-1">
                    2. Title of Paper or Article <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A Beginner Guide to Solar Energy"
                    value={topicForm.title}
                    onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-provenance text-[11px] font-bold text-[var(--ink-primary)] block mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    placeholder="2025"
                    value={topicForm.publication_year}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, publication_year: e.target.value })
                    }
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-provenance text-[11px] font-bold text-[var(--ink-primary)] block mb-1">
                  3. Author Name(s) (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe, Science Class Group"
                  value={topicForm.authors}
                  onChange={(e) => setTopicForm({ ...topicForm, authors: e.target.value })}
                  className="w-full rounded border border-[var(--border-paper)] px-3 py-2 focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono-provenance text-[11px] font-bold text-[var(--ink-primary)]">
                    4. Paste Article Text (Or leave blank and we will create a 5-page study guide on your topic!)
                  </label>
                </div>
                <textarea
                  rows={6}
                  placeholder={`Paste your article or notes here... (Tip: Put --- on a new line to separate Page 1, Page 2, Page 3)

Or leave this box empty and we will automatically build a structured 5-page study paper about your topic!`}
                  value={topicForm.content}
                  onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                  className="w-full rounded border border-[var(--border-paper)] p-3 font-mono text-[11px] leading-relaxed focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="rounded-lg border border-[var(--border-paper)] px-4 py-2 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topicSubmitting || !topicForm.topic.trim() || !topicForm.title.trim()}
                  className="rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {topicSubmitting ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding &amp; Creating Pages...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add to Study Room &amp; Start Reading</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
