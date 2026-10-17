import {
  ResearchProject,
  AcademicPaper,
  DocumentPage,
  DocumentChunk,
  ChatMessage,
  ResearchNote,
  ComparisonMatrix,
  ResearchCanvasData,
  ResearchGapAnalysis,
  UserProfile,
} from "@/types";

const STORAGE_KEYS = {
  CURRENT_USER: "sourcewise_user",
  PROJECTS: "sourcewise_projects",
  PAPERS: "sourcewise_papers",
  PAGES: "sourcewise_pages",
  CHUNKS: "sourcewise_chunks",
  MESSAGES: "sourcewise_messages",
  NOTES: "sourcewise_notes",
  COMPARISONS: "sourcewise_comparisons",
  CANVASES: "sourcewise_canvases",
  GAP_ANALYSES: "sourcewise_gap_analyses",
};

// Default starter seed for immediate exploration
export const DEFAULT_USER: UserProfile = {
  id: "usr_researcher_01",
  email: "student@university.edu",
  full_name: "Elena Rostova",
  institution: "Oxford Institute of Cognitive Sciences",
  research_field: "Human-AI Alignment & Pedagogical Synthesis",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const SEED_PROJECTS: ResearchProject[] = [
  {
    id: "proj_pedagogy_ai",
    user_id: "usr_researcher_01",
    title: "Epistemic Agency in AI-Augmented Literature Reviews",
    research_question:
      "How do verifiable citation interfaces affect student critical evaluation during academic literature synthesis?",
    description:
      "Investigating whether grounding AI claims directly to PDF page coordinates reduces automated confirmation bias in university thesis writers.",
    status: "active",
    created_at: "2026-09-12T10:00:00Z",
    updated_at: "2026-10-15T14:30:00Z",
    papers_count: 3,
    notes_count: 5,
  },
  {
    id: "proj_rag_provenance",
    user_id: "usr_researcher_01",
    title: "Provenance Tracking in Neural Retrieval for Scientific Discovery",
    research_question:
      "What are the failure modes of dense vector retrieval when differentiating between established consensus and contested hypotheses?",
    description:
      "Evaluating coordinate-level provenance markers across multi-disciplinary open-access datasets.",
    status: "active",
    created_at: "2026-10-01T08:15:00Z",
    updated_at: "2026-10-14T18:20:00Z",
    papers_count: 2,
    notes_count: 2,
  },
];

export const SEED_PAPERS: AcademicPaper[] = [
  {
    id: "paper_vaswani_2017",
    project_id: "proj_pedagogy_ai",
    user_id: "usr_researcher_01",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
    publication_year: 2017,
    journal_or_venue: "Advances in Neural Information Processing Systems (NeurIPS)",
    doi: "10.48550/arXiv.1706.03762",
    file_path: "/papers/vaswani_2017.pdf",
    file_size_bytes: 2211840,
    file_hash: "hash_vaswani_2017",
    page_count: 11,
    processing_status: "ready",
    error_message: null,
    created_at: "2026-09-15T11:00:00Z",
    updated_at: "2026-09-15T11:05:00Z",
  },
  {
    id: "paper_lewis_2020",
    project_id: "proj_pedagogy_ai",
    user_id: "usr_researcher_01",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    authors: ["Patrick Lewis", "Ethan Perez", "Aleksandra Piktus", "Fabio Petroni"],
    publication_year: 2020,
    journal_or_venue: "NeurIPS 2020 Proceedings",
    doi: "10.48550/arXiv.2005.11401",
    file_path: "/papers/lewis_2020.pdf",
    file_size_bytes: 1845200,
    file_hash: "hash_lewis_2020",
    page_count: 12,
    processing_status: "ready",
    error_message: null,
    created_at: "2026-09-18T14:20:00Z",
    updated_at: "2026-09-18T14:25:00Z",
  },
  {
    id: "paper_gao_2024",
    project_id: "proj_pedagogy_ai",
    user_id: "usr_researcher_01",
    title: "Retrieval-Augmented Generation for Large Language Models: A Survey",
    authors: ["Yunfan Gao", "Yun Xiong", "Xinyu Gao", "Kangxiang Jia"],
    publication_year: 2024,
    journal_or_venue: "IEEE Transactions on Knowledge and Data Engineering",
    doi: "10.1109/TKDE.2024.3364921",
    file_path: "/papers/gao_2024.pdf",
    file_size_bytes: 3120000,
    file_hash: "hash_gao_2024",
    page_count: 18,
    processing_status: "ready",
    error_message: null,
    created_at: "2026-09-22T09:40:00Z",
    updated_at: "2026-09-22T09:46:00Z",
  },
];

export const SEED_PAGES: DocumentPage[] = [
  {
    id: "page_v1",
    document_id: "paper_vaswani_2017",
    page_number: 1,
    char_count: 2450,
    text_content:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
    created_at: "2026-09-15T11:02:00Z",
  },
  {
    id: "page_v2",
    document_id: "paper_vaswani_2017",
    page_number: 2,
    char_count: 2900,
    text_content:
      "Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht-1 and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.",
    created_at: "2026-09-15T11:02:00Z",
  },
  {
    id: "page_v3",
    document_id: "paper_vaswani_2017",
    page_number: 3,
    char_count: 3100,
    text_content:
      "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key. We compute the dot products of the query with all keys, divide each by sqrt(dk), and apply a softmax function to obtain the weights on the values.",
    created_at: "2026-09-15T11:02:00Z",
  },
  {
    id: "page_l1",
    document_id: "paper_lewis_2020",
    page_number: 1,
    char_count: 2600,
    text_content:
      "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and they fall short on knowledge-intensive tasks. In this work, we explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation.",
    created_at: "2026-09-18T14:22:00Z",
  },
  {
    id: "page_l4",
    document_id: "paper_lewis_2020",
    page_number: 4,
    char_count: 3200,
    text_content:
      "RAG models combine a pre-trained sequence-to-sequence model (parametric memory) with a dense vector index of Wikipedia (non-parametric memory), accessed with a neural retriever. We formulate two models: RAG-Sequence, which uses the same retrieved document to generate the complete sequence, and RAG-Token, which can use different retrieved documents to generate each token. We show that RAG models generate more specific, factual, and diverse language than parametric-only seq2seq baselines.",
    created_at: "2026-09-18T14:22:00Z",
  },
  {
    id: "page_g1",
    document_id: "paper_gao_2024",
    page_number: 1,
    char_count: 2800,
    text_content:
      "Large Language Models (LLMs) exhibit impressive capabilities across diverse domains, yet they encounter significant challenges including hallucination, obsolete domain-specific knowledge, and non-transparent reasoning processes. Retrieval-Augmented Generation (RAG) has emerged as an indispensable paradigm to mitigate these shortcomings by dynamically retrieving relevant authoritative documents from external knowledge bases.",
    created_at: "2026-09-22T09:42:00Z",
  },
  {
    id: "page_g5",
    document_id: "paper_gao_2024",
    page_number: 5,
    char_count: 3400,
    text_content:
      "The evolution of RAG spans three technical paradigms: Naive RAG, Advanced RAG, and Modular RAG. Naive RAG follows a traditional 'Retrieve-Read' pipeline, which often suffers from low precision and recall. Advanced RAG incorporates pre-retrieval query rewriting and post-retrieval reranking. Modular RAG enables flexible multi-path retrieval, dynamic memory routing, and iterative generation-retrieval feedback loops.",
    created_at: "2026-09-22T09:42:00Z",
  },
];

export const SEED_CHUNKS: DocumentChunk[] = [
  {
    id: "chk_v1_1",
    document_id: "paper_vaswani_2017",
    page_number: 1,
    chunk_index: 0,
    content:
      "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
    token_count: 55,
    char_start: 350,
    char_end: 640,
    created_at: "2026-09-15T11:03:00Z",
  },
  {
    id: "chk_v3_1",
    document_id: "paper_vaswani_2017",
    page_number: 3,
    chunk_index: 1,
    content:
      "An attention function can be described as mapping a query and a set of key-value pairs to an output. We compute the dot products of the query with all keys, divide each by sqrt(dk), and apply a softmax function to obtain the weights on the values.",
    token_count: 52,
    char_start: 120,
    char_end: 375,
    created_at: "2026-09-15T11:03:00Z",
  },
  {
    id: "chk_l1_1",
    document_id: "paper_lewis_2020",
    page_number: 1,
    chunk_index: 0,
    content:
      "In this work, we explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation.",
    token_count: 36,
    char_start: 380,
    char_end: 560,
    created_at: "2026-09-18T14:23:00Z",
  },
  {
    id: "chk_l4_1",
    document_id: "paper_lewis_2020",
    page_number: 4,
    chunk_index: 1,
    content:
      "We formulate two models: RAG-Sequence, which uses the same retrieved document to generate the complete sequence, and RAG-Token, which can use different retrieved documents to generate each token. RAG models generate more specific, factual, and diverse language than parametric-only seq2seq baselines.",
    token_count: 58,
    char_start: 220,
    char_end: 510,
    created_at: "2026-09-18T14:23:00Z",
  },
  {
    id: "chk_g1_1",
    document_id: "paper_gao_2024",
    page_number: 1,
    chunk_index: 0,
    content:
      "Large Language Models (LLMs) encounter significant challenges including hallucination, obsolete domain-specific knowledge, and non-transparent reasoning processes. Retrieval-Augmented Generation (RAG) has emerged as an indispensable paradigm to mitigate these shortcomings.",
    token_count: 48,
    char_start: 110,
    char_end: 365,
    created_at: "2026-09-22T09:43:00Z",
  },
  {
    id: "chk_g5_1",
    document_id: "paper_gao_2024",
    page_number: 5,
    chunk_index: 1,
    content:
      "The evolution of RAG spans three technical paradigms: Naive RAG, Advanced RAG, and Modular RAG. Naive RAG suffers from low precision and recall. Advanced RAG incorporates pre-retrieval query rewriting and post-retrieval reranking. Modular RAG enables flexible multi-path retrieval and iterative feedback loops.",
    token_count: 62,
    char_start: 80,
    char_end: 410,
    created_at: "2026-09-22T09:43:00Z",
  },
];

// In-browser local storage + Server-side in-memory store for Next.js API routes & Vercel Serverless
class LocalDataStore {
  private isBrowser = typeof window !== "undefined";
  private serverMemory = new Map<string, unknown>();

  private get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) {
      if (this.serverMemory.has(key)) {
        return this.serverMemory.get(key) as T;
      }
      return Array.isArray(fallback) ? ([...fallback] as unknown as T) : fallback;
    }
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      this.serverMemory.set(key, value);
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("Storage quota or write failed:", err);
    }
  }

  // --- Auth / User ---
  getUser(): UserProfile {
    return this.get<UserProfile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
  }

  setUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // --- Projects ---
  getProjects(): ResearchProject[] {
    const list = this.get<ResearchProject[]>(STORAGE_KEYS.PROJECTS, []);
    if (list.length === 0) {
      this.set(STORAGE_KEYS.PROJECTS, [...SEED_PROJECTS]);
      return [...SEED_PROJECTS];
    }
    return list;
  }

  getProject(id: string): ResearchProject | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  saveProject(project: ResearchProject): void {
    const list = [...this.getProjects()];
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project, updated_at: new Date().toISOString() };
    } else {
      list.unshift(project);
    }
    this.set(STORAGE_KEYS.PROJECTS, list);
  }

  deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROJECTS, list);
  }

  // --- Papers ---
  getPapers(projectId?: string): AcademicPaper[] {
    const list = this.get<AcademicPaper[]>(STORAGE_KEYS.PAPERS, []);
    if (list.length === 0) {
      this.set(STORAGE_KEYS.PAPERS, [...SEED_PAPERS]);
      return projectId ? SEED_PAPERS.filter((p) => p.project_id === projectId) : [...SEED_PAPERS];
    }
    return projectId ? list.filter((p) => p.project_id === projectId) : list;
  }

  getPaper(id: string): AcademicPaper | undefined {
    return this.getPapers().find((p) => p.id === id);
  }

  savePaper(paper: AcademicPaper): void {
    const list = [...this.getPapers()];
    const idx = list.findIndex((p) => p.id === paper.id);
    if (idx >= 0) {
      list[idx] = { ...paper, updated_at: new Date().toISOString() };
    } else {
      list.unshift(paper);
    }
    this.set(STORAGE_KEYS.PAPERS, list);
  }

  deletePaper(id: string): void {
    const list = this.getPapers().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PAPERS, list);
  }

  // --- Document Pages & Chunks ---
  getPages(documentId: string): DocumentPage[] {
    const pages = this.get<DocumentPage[]>(STORAGE_KEYS.PAGES, SEED_PAGES);
    return pages.filter((p) => p.document_id === documentId);
  }

  savePages(newPages: DocumentPage[]): void {
    const existing = this.get<DocumentPage[]>(STORAGE_KEYS.PAGES, SEED_PAGES);
    const filtered = existing.filter(
      (p) => !newPages.some((np) => np.document_id === p.document_id && np.page_number === p.page_number)
    );
    this.set(STORAGE_KEYS.PAGES, [...filtered, ...newPages]);
  }

  getChunks(documentId?: string): DocumentChunk[] {
    const chunks = this.get<DocumentChunk[]>(STORAGE_KEYS.CHUNKS, SEED_CHUNKS);
    return documentId ? chunks.filter((c) => c.document_id === documentId) : chunks;
  }

  saveChunks(newChunks: DocumentChunk[]): void {
    const existing = this.get<DocumentChunk[]>(STORAGE_KEYS.CHUNKS, SEED_CHUNKS);
    const filtered = existing.filter(
      (c) => !newChunks.some((nc) => nc.id === c.id)
    );
    this.set(STORAGE_KEYS.CHUNKS, [...filtered, ...newChunks]);
  }

  // --- Notes ---
  getNotes(projectId: string): ResearchNote[] {
    const notes = this.get<ResearchNote[]>(STORAGE_KEYS.NOTES, []);
    return notes.filter((n) => n.project_id === projectId);
  }

  saveNote(note: ResearchNote): void {
    const notes = this.get<ResearchNote[]>(STORAGE_KEYS.NOTES, []);
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = { ...note, updated_at: new Date().toISOString() };
    } else {
      notes.unshift(note);
    }
    this.set(STORAGE_KEYS.NOTES, notes);
  }

  deleteNote(id: string): void {
    const notes = this.get<ResearchNote[]>(STORAGE_KEYS.NOTES, []).filter((n) => n.id !== id);
    this.set(STORAGE_KEYS.NOTES, notes);
  }

  // --- Chat Messages ---
  getMessages(conversationId: string): ChatMessage[] {
    const messages = this.get<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    return messages.filter((m) => m.conversation_id === conversationId);
  }

  saveMessage(message: ChatMessage): void {
    const messages = this.get<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    messages.push(message);
    this.set(STORAGE_KEYS.MESSAGES, messages);
  }

  // --- Comparison Matrices ---
  getComparison(projectId: string): ComparisonMatrix | undefined {
    const comparisons = this.get<ComparisonMatrix[]>(STORAGE_KEYS.COMPARISONS, []);
    return comparisons.find((c) => c.project_id === projectId);
  }

  saveComparison(comparison: ComparisonMatrix): void {
    const comparisons = this.get<ComparisonMatrix[]>(STORAGE_KEYS.COMPARISONS, []);
    const idx = comparisons.findIndex((c) => c.project_id === comparison.project_id);
    if (idx >= 0) {
      comparisons[idx] = { ...comparison, updated_at: new Date().toISOString() };
    } else {
      comparisons.push(comparison);
    }
    this.set(STORAGE_KEYS.COMPARISONS, comparisons);
  }

  // --- Research Canvas ---
  getCanvas(projectId: string): ResearchCanvasData | undefined {
    const canvases = this.get<ResearchCanvasData[]>(STORAGE_KEYS.CANVASES, []);
    return canvases.find((c) => c.project_id === projectId);
  }

  saveCanvas(canvas: ResearchCanvasData): void {
    const canvases = this.get<ResearchCanvasData[]>(STORAGE_KEYS.CANVASES, []);
    const idx = canvases.findIndex((c) => c.project_id === canvas.project_id);
    if (idx >= 0) {
      canvases[idx] = { ...canvas, updated_at: new Date().toISOString() };
    } else {
      canvases.push(canvas);
    }
    this.set(STORAGE_KEYS.CANVASES, canvases);
  }

  // --- Research Gap Analysis ---
  getGapAnalysis(projectId: string): ResearchGapAnalysis | undefined {
    const analyses = this.get<ResearchGapAnalysis[]>(STORAGE_KEYS.GAP_ANALYSES, []);
    return analyses.find((a) => a.project_id === projectId);
  }

  saveGapAnalysis(analysis: ResearchGapAnalysis): void {
    const analyses = this.get<ResearchGapAnalysis[]>(STORAGE_KEYS.GAP_ANALYSES, []);
    const idx = analyses.findIndex((a) => a.project_id === analysis.project_id);
    if (idx >= 0) {
      analyses[idx] = { ...analysis, updated_at: new Date().toISOString() };
    } else {
      analyses.push(analysis);
    }
    this.set(STORAGE_KEYS.GAP_ANALYSES, analyses);
  }
}

export const store = new LocalDataStore();
