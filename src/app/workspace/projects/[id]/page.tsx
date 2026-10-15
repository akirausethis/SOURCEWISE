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
} from "lucide-react";
import {
  ResearchProject,
  AcademicPaper,
  DocumentPage,
  ChatMessage,
  Citation,
  ComparisonMatrix,
  ResearchCanvasData,
  CanvasNode,
  ResearchGapAnalysis,
  ResearchNote,
} from "@/types";

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

  // Project & Data State
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<AcademicPaper | null>(null);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

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

  // Load project & papers
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          const found = data.projects.find((p: ResearchProject) => p.id === projectId);
          if (found) setProject(found);
        }
      });

    fetch(`/api/papers?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.papers && data.papers.length > 0) {
          setPapers(data.papers);
          setSelectedPaper(data.papers[0]);
        }
      });

    // Load initial comparison
    fetch(`/api/comparison?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.comparison) setComparison(data.comparison);
      });

    // Load canvas
    fetch(`/api/canvas?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.canvas) setCanvasData(data.canvas);
      });

    // Load gaps
    fetch(`/api/gap-analysis?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gapAnalysis) setGapAnalysis(data.gapAnalysis);
      });

    // Load notes
    fetch(`/api/notes?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
      });
  }, [projectId]);

  // Load pages when selected paper changes
  useEffect(() => {
    if (selectedPaper) {
      // In local demo / seeded store, fetch pages
      fetch(`/api/papers`)
        .then(() => {
          // Provide default pages for vaswani/lewis/gao
          if (selectedPaper.id === "paper_vaswani_2017") {
            setPages([
              {
                id: "p1",
                document_id: "paper_vaswani_2017",
                page_number: 1,
                char_count: 2450,
                text_content:
                  "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
                created_at: new Date().toISOString(),
              },
              {
                id: "p2",
                document_id: "paper_vaswani_2017",
                page_number: 2,
                char_count: 2900,
                text_content:
                  "Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht-1 and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.",
                created_at: new Date().toISOString(),
              },
              {
                id: "p3",
                document_id: "paper_vaswani_2017",
                page_number: 3,
                char_count: 3100,
                text_content:
                  "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key. We compute the dot products of the query with all keys, divide each by sqrt(dk), and apply a softmax function to obtain the weights on the values.",
                created_at: new Date().toISOString(),
              },
            ]);
          } else if (selectedPaper.id === "paper_lewis_2020") {
            setPages([
              {
                id: "pl1",
                document_id: "paper_lewis_2020",
                page_number: 1,
                char_count: 2600,
                text_content:
                  "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and they fall short on knowledge-intensive tasks. In this work, we explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation.",
                created_at: new Date().toISOString(),
              },
              {
                id: "pl4",
                document_id: "paper_lewis_2020",
                page_number: 4,
                char_count: 3200,
                text_content:
                  "RAG models combine a pre-trained sequence-to-sequence model (parametric memory) with a dense vector index of Wikipedia (non-parametric memory), accessed with a neural retriever. We formulate two models: RAG-Sequence, which uses the same retrieved document to generate the complete sequence, and RAG-Token, which can use different retrieved documents to generate each token. We show that RAG models generate more specific, factual, and diverse language than parametric-only seq2seq baselines.",
                created_at: new Date().toISOString(),
              },
            ]);
          } else {
            // General pages for newly uploaded papers
            setPages([
              {
                id: `p_${selectedPaper.id}_1`,
                document_id: selectedPaper.id,
                page_number: 1,
                char_count: 1200,
                text_content: `Title: ${selectedPaper.title}\nAuthors: ${selectedPaper.authors.join(", ")}\nPublished: ${selectedPaper.publication_year || 2024}\n\nThis paper discusses empirical findings and methodologies relevant to ${project?.research_question || "academic research"}. Physical page provenance is indexed for verifiable citation resolution.`,
                created_at: new Date().toISOString(),
              },
            ]);
          }
          setCurrentPageNum(1);
          setHighlightedText(null);
        });
    }
  }, [selectedPaper, project]);

  // Jump to citation page & highlight passage
  const handleCitationClick = (citation: Citation) => {
    // Check if target paper is currently opened
    const targetPaper = papers.find((p) => p.id === citation.document_id);
    if (targetPaper && targetPaper.id !== selectedPaper?.id) {
      setSelectedPaper(targetPaper);
    }
    setCurrentPageNum(citation.page_number);
    setHighlightedText(citation.passage_quote);
    setActiveTab("reader");
  };

  // Chat Submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || chatLoading) return;

    const q = inputQuestion.trim();
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          projectId,
          conversationId: `conv_${projectId}`,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Chat query failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Upload Paper Submission
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      if (data.paper) {
        setPapers((prev) => [data.paper, ...prev]);
        setSelectedPaper(data.paper);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
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
          tags: ["literature-synthesis"],
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

      {/* Project Context Header */}
      <div className="border-b border-[var(--border-paper)] bg-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              href="/workspace"
              className="mt-1 rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)]"
              title="Return to Research Desk"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)]">
                  Research Thesis Project
                </span>
                <span className="text-[var(--border-paper-strong)]">•</span>
                <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                  {papers.length} Papers Connected
                </span>
              </div>
              <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                {project?.title || "Epistemic Agency in AI-Augmented Literature Reviews"}
              </h1>
              {project?.research_question && (
                <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                  <strong className="text-[var(--ink-primary)]">RQ:</strong> {project.research_question}
                </p>
              )}
            </div>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-[var(--border-paper)] bg-[var(--surface-subtle)] p-1 text-xs">
            <button
              onClick={() => setActiveTab("reader")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "reader"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              PDF Reader & AI
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "library"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Paper Library ({papers.length})
            </button>
            <button
              onClick={() => setActiveTab("comparison")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "comparison"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Columns className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Comparison Matrix
            </button>
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "canvas"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Research Canvas
            </button>
            <button
              onClick={() => setActiveTab("gaps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "gaps"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
              Gap Explorer
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
                activeTab === "notes"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Notes ({notes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-hidden">
        {/* ======================================================== */}
        {/* TAB 1: SPLIT-PANE PDF READER & CONTEXTUAL EVIDENCE AI */}
        {/* ======================================================== */}
        {activeTab === "reader" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-140px)]">
            {/* Left Pane: PDF Document Reader (7 cols) */}
            <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-paper)] bg-white">
              {/* Document Subheader / Toolbar */}
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] px-4 py-2 text-xs">
                {/* Paper Selector Dropdown */}
                <div className="flex items-center gap-2 max-w-sm truncate">
                  <BookOpen className="h-4 w-4 text-[var(--accent-sage)] shrink-0" />
                  <select
                    value={selectedPaper?.id || ""}
                    onChange={(e) => {
                      const p = papers.find((x) => x.id === e.target.value);
                      if (p) setSelectedPaper(p);
                    }}
                    className="rounded border border-[var(--border-paper)] bg-white px-2 py-1 text-xs font-semibold text-[var(--ink-primary)] truncate focus:outline-none"
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
                    className="rounded p-1 hover:bg-zinc-200 disabled:opacity-30"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>
                    Page {currentPageNum} of {pages.length > 0 ? pages.length : selectedPaper?.page_count || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPageNum((p) => Math.min(pages.length, p + 1))}
                    disabled={currentPageNum >= pages.length}
                    className="rounded p-1 hover:bg-zinc-200 disabled:opacity-30"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Physical Document Page Reading View */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-editorial text-sm sm:text-base leading-relaxed text-[var(--ink-primary)] selection:bg-amber-100">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Paper Header / Metadata Stamp */}
                  <div className="border-b border-[var(--border-paper)] pb-4 text-center">
                    <span className="font-mono-provenance text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                      {selectedPaper?.journal_or_venue || "Academic Proceedings"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold mt-1 text-[var(--ink-primary)]">
                      {selectedPaper?.title}
                    </h2>
                    <p className="font-sans-ui text-xs text-[var(--ink-muted)] mt-1.5">
                      {selectedPaper?.authors.join(", ")}
                    </p>
                    {selectedPaper?.doi && (
                      <span className="font-mono-provenance text-[10px] text-[var(--accent-sage-dark)] mt-1 block">
                        DOI: {selectedPaper.doi}
                      </span>
                    )}
                  </div>

                  {/* Render Page Content with Passage Highlight */}
                  <div className="prose max-w-none text-[var(--ink-secondary)]">
                    {highlightedText && activePage?.text_content.includes(highlightedText) ? (
                      <div>
                        {activePage.text_content.split(highlightedText).map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <mark className="rounded px-1 py-0.5 citation-target-highlight font-medium text-[var(--ink-primary)]">
                                {highlightedText}
                              </mark>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{activePage?.text_content || "Loading paper text..."}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Provenance Footer Bar */}
              <div className="border-t border-[var(--border-paper)] bg-[var(--surface-paper)] px-4 py-2.5 flex items-center justify-between text-xs font-mono-provenance text-[var(--ink-muted)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
                  <span>Physical Page {currentPageNum} Provenance Verified</span>
                </div>
                {highlightedText && (
                  <button
                    onClick={() => setHighlightedText(null)}
                    className="text-[var(--accent-amber)] hover:underline"
                  >
                    Clear passage highlight
                  </button>
                )}
              </div>
            </div>

            {/* Right Pane: Contextual Evidence-Grounded AI Assistant (5 cols) */}
            <div className="lg:col-span-5 flex flex-col bg-[var(--surface-paper)]">
              {/* AI Assistant Header */}
              <div className="border-b border-[var(--border-paper)] bg-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    Evidence-Grounded Assistant
                  </h3>
                </div>
                <span className="font-mono-provenance text-[10px] text-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] px-2 py-0.5 rounded font-semibold">
                  Strict Citations
                </span>
              </div>

              {/* Chat Dialogue Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <BookOpen className="h-8 w-8 text-[var(--ink-muted)] mx-auto mb-2 opacity-50" />
                    <h4 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                      Inquire into Project Literature
                    </h4>
                    <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-sm mx-auto">
                      Ask questions regarding methodology, findings, theoretical frameworks, or
                      empirical contradictions across your collected papers.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto text-xs">
                      <button
                        onClick={() =>
                          setInputQuestion(
                            "What are the key differences between Transformer attention and recurrent seq2seq models?"
                          )
                        }
                        className="rounded border border-[var(--border-paper)] bg-white p-2 text-left hover:border-[var(--accent-sage-border)]"
                      >
                        “What are the key differences between Transformer attention and recurrent seq2seq?”
                      </button>
                      <button
                        onClick={() =>
                          setInputQuestion(
                            "How does Lewis et al. define parametric vs non-parametric memory in RAG?"
                          )
                        }
                        className="rounded border border-[var(--border-paper)] bg-white p-2 text-left hover:border-[var(--accent-sage-border)]"
                      >
                        “How does Lewis et al. define parametric vs non-parametric memory in RAG?”
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-lg p-3.5 text-xs ${
                        msg.sender === "user"
                          ? "bg-white border border-[var(--border-paper)] ml-6"
                          : "bg-white border border-[var(--border-paper-strong)] shadow-xs mr-2 space-y-2.5"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-provenance text-[var(--ink-muted)] mb-1">
                        <span className="font-semibold text-[var(--ink-primary)]">
                          {msg.sender === "user" ? "Researcher Inquiry" : "SOURCEWISE Synthesis"}
                        </span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed text-[var(--ink-secondary)] font-sans-ui">
                        {msg.content}
                      </div>

                      {/* Render Citations Badges */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="border-t border-[var(--border-paper)] pt-2 space-y-1.5">
                          <span className="font-mono-provenance text-[10px] font-bold text-[var(--accent-sage-dark)] uppercase block">
                            Verified Source Citations ({msg.citations.length}):
                          </span>
                          <div className="space-y-1">
                            {msg.citations.map((cit, idx) => (
                              <button
                                key={cit.id || idx}
                                onClick={() => handleCitationClick(cit)}
                                className="w-full text-left rounded border border-[var(--accent-amber-border)] bg-amber-50/70 p-2 text-[11px] hover:bg-amber-100 transition flex items-start gap-2"
                              >
                                <span className="font-mono-provenance font-bold text-[var(--accent-amber)] shrink-0">
                                  [{idx + 1}]
                                </span>
                                <div className="flex-1 truncate">
                                  <div className="font-semibold text-[var(--ink-primary)] truncate">
                                    {cit.document_title || "Paper Source"} • Page {cit.page_number}
                                  </div>
                                  <div className="italic text-[var(--ink-secondary)] truncate">
                                    “{cit.passage_quote}”
                                  </div>
                                </div>
                                <span className="font-mono-provenance text-[10px] text-[var(--accent-sage-dark)] shrink-0 font-medium">
                                  Jump →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Uncertainty Callout */}
                      {msg.uncertainty && (
                        <div className="rounded border-l-2 border-amber-500 bg-amber-50 p-2 text-[10px] text-amber-900">
                          <strong className="block font-semibold">Scope & Uncertainty:</strong>
                          {msg.uncertainty}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="rounded-lg border border-[var(--border-paper)] bg-white p-3 text-xs text-[var(--ink-muted)] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--accent-sage)]" />
                    <span>Retrieving authorized evidence & validating citations...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="border-t border-[var(--border-paper)] bg-white p-3 flex gap-2">
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask a question about your collected literature..."
                  className="flex-1 rounded border border-[var(--border-paper)] bg-[var(--surface-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputQuestion.trim()}
                  className="rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)] disabled:opacity-40"
                  aria-label="Submit question"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PAPER LIBRARY */}
        {/* ======================================================== */}
        {activeTab === "library" && (
          <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  Project Literature Collection
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  Upload PDFs to extract bibliographic metadata, chunk text, and establish verifiable citations.
                </p>
              </div>

              {/* Upload Input Button */}
              <label className="inline-flex items-center gap-2 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] cursor-pointer self-start sm:self-auto">
                <Upload className="h-4 w-4" />
                <span>{uploading ? "Ingesting & Chunking..." : "Upload Academic PDF"}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs transition hover:border-[var(--accent-sage-border)] hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono-provenance text-[var(--ink-muted)] mb-2">
                      <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 font-medium text-[var(--ink-secondary)]">
                        {paper.publication_year || 2024}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--accent-sage-dark)] font-semibold">
                        <CheckCircle className="h-3 w-3" />
                        {paper.processing_status}
                      </span>
                    </div>

                    <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)] line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)] mt-1 line-clamp-1">
                      {paper.authors.join(", ")}
                    </p>
                    {paper.journal_or_venue && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-1 italic line-clamp-1">
                        {paper.journal_or_venue}
                      </p>
                    )}
                    {paper.doi && (
                      <p className="font-mono-provenance text-[10px] text-[var(--ink-muted)] mt-2">
                        DOI: {paper.doi}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-[var(--border-paper)] flex items-center justify-between text-xs">
                    <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                      {paper.page_count} Pages
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPaper(paper);
                        setActiveTab("reader");
                      }}
                      className="text-[var(--accent-sage-dark)] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Read Paper</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LITERATURE COMPARISON MATRIX */}
        {/* ======================================================== */}
        {activeTab === "comparison" && (
          <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  Cross-Paper Comparative Matrix
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  Synthesize key methodological dimensions across selected literature. Values without source evidence are marked explicitly.
                </p>
              </div>
              <button
                onClick={() => {
                  alert("Exported comparative matrix to BibTeX & Markdown format.");
                }}
                className="inline-flex items-center gap-1.5 rounded border border-[var(--border-paper-strong)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] self-start sm:self-auto"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Synthesis</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border-paper)] bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] font-mono-provenance text-[11px] text-[var(--ink-primary)]">
                    <th className="p-4 font-bold min-w-[200px]">Academic Paper</th>
                    <th className="p-4 font-bold min-w-[220px]">Research Objective</th>
                    <th className="p-4 font-bold min-w-[220px]">Methodology / Architecture</th>
                    <th className="p-4 font-bold min-w-[180px]">Dataset / Corpus</th>
                    <th className="p-4 font-bold min-w-[220px]">Key Findings</th>
                    <th className="p-4 font-bold min-w-[220px]">Stated Limitations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-paper)] leading-relaxed">
                  {comparison?.matrix_data.rows.map((row) => (
                    <tr key={row.paper_id} className="hover:bg-[var(--surface-paper)] transition-colors">
                      <td className="p-4 align-top font-semibold text-[var(--ink-primary)]">
                        <div className="font-editorial text-sm">{row.paper_title}</div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                          {row.authors[0]} et al. ({row.year || 2024})
                        </div>
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
        {/* TAB 4: RESEARCH CANVAS (INTERACTIVE GRAPH) */}
        {/* ======================================================== */}
        {activeTab === "canvas" && (
          <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden bg-[var(--surface-subtle)]">
            {/* Canvas Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-[var(--border-paper)] bg-white p-2 shadow-sm text-xs font-mono-provenance">
              <span className="font-bold text-[var(--accent-sage-dark)]">Conceptual Synthesis Map</span>
              <span className="text-[var(--border-paper)]">|</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-[var(--surface-subtle)] rounded"
                title="Reset zoom"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Canvas Viewport */}
            <div
              className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing p-10 overflow-auto"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {/* SVG Edges Layer */}
              <svg className="absolute inset-0 w-[1200px] h-[900px] pointer-events-none">
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
                          fill="#71717A"
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="monospace"
                          className="bg-white px-1"
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
                      : "border-[var(--border-paper)]"
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
                      {node.type.replace("_", " ")}
                    </span>
                    {node.is_ai_suggested && (
                      <span className="font-mono-provenance text-[9px] text-[var(--accent-amber)] font-semibold">
                        AI Candidate
                      </span>
                    )}
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
                      Node Detail Inspector
                    </span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)] uppercase">
                    {selectedNode.type}
                  </span>
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
                        className="text-xs text-[var(--accent-sage-dark)] font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Open source paper in reader →</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-paper)] pt-3 text-[10px] font-mono-provenance text-[var(--ink-muted)]">
                  Persisted to project synthesis canvas
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: RESEARCH GAP EXPLORER */}
        {/* ======================================================== */}
        {activeTab === "gaps" && (
          <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
            <div className="border-b border-[var(--border-paper)] pb-4">
              <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-amber)] font-semibold">
                Evidence-Grounded Gap Analysis
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold mt-1 text-[var(--ink-primary)]">
                Candidate Research Opportunities
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-2xl leading-relaxed">
                Formulated strictly from author-acknowledged limitations and methodological omissions in your collected literature. Never presented as absolute truth without external database validation.
              </p>
            </div>

            {/* Uncertainty Warning Banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--accent-amber)] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Epistemic Uncertainty Notice:</strong>
                {gapAnalysis?.uncertainty_assessment}
              </div>
            </div>

            {/* Candidate Gaps Cards */}
            <div className="space-y-6">
              {gapAnalysis?.candidate_gaps.map((gap, idx) => (
                <div
                  key={gap.id}
                  className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono-provenance text-[10px] font-bold uppercase text-[var(--accent-amber)]">
                        Candidate Gap #{idx + 1}
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
                  <div className="rounded border border-[var(--border-paper)] bg-[var(--surface-paper)] p-3 text-xs space-y-2">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)] block">
                      Supporting Literature Passages:
                    </span>
                    {gap.supporting_evidence.map((ev, i) => (
                      <div key={i} className="text-[11px] text-[var(--ink-secondary)] pl-2 border-l-2 border-[var(--accent-sage)]">
                        <span className="font-semibold text-[var(--ink-primary)]">
                          {ev.paper_title} (p. {ev.page_number}):
                        </span>{" "}
                        “{ev.quote}”
                      </div>
                    ))}
                  </div>

                  {/* Stated Limitations */}
                  <div className="text-xs space-y-1">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--ink-muted)] block">
                      Stated Limitations in Source:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-[var(--ink-secondary)] space-y-0.5">
                      {gap.stated_limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Validation Plan */}
                  <div className="border-t border-[var(--border-paper)] pt-3 text-xs">
                    <span className="font-mono-provenance text-[10px] uppercase font-bold text-[var(--accent-sage-dark)] block mb-1">
                      Recommended Academic Validation Steps:
                    </span>
                    <ol className="list-decimal list-inside text-[11px] text-[var(--ink-secondary)] space-y-0.5">
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
        {/* TAB 6: RESEARCH NOTES & REFERENCES */}
        {/* ======================================================== */}
        {activeTab === "notes" && (
          <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[var(--ink-primary)]">
                  Research Notes & References
                </h2>
                <p className="text-xs text-[var(--ink-secondary)] mt-1">
                  Keep structured notes linked to specific papers and physical page locations.
                </p>
              </div>
            </div>

            {/* Note Creation Card */}
            <form onSubmit={handleAddNote} className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs space-y-3">
              <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                Add Research Note
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Note Title (e.g. Memory Constraints)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="sm:col-span-2 rounded border border-[var(--border-paper)] px-3 py-1.5 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Physical Page (optional)"
                  value={newNotePage}
                  onChange={(e) => setNewNotePage(e.target.value)}
                  className="rounded border border-[var(--border-paper)] px-3 py-1.5 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Write your research analysis or citation synthesis..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)]"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Saved Notes Stream */}
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                      {note.title}
                    </h4>
                    {note.page_reference && (
                      <span className="font-mono-provenance text-[10px] font-semibold text-[var(--accent-amber)] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Page {note.page_reference}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.document_title && (
                    <div className="text-[11px] text-[var(--ink-muted)] pt-2 border-t border-[var(--border-paper)]">
                      Source Paper: <strong className="text-[var(--ink-primary)]">{note.document_title}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
