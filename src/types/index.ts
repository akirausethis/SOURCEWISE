// ====================================================================
// SOURCEWISE DOMAIN TYPES & SCHEMAS
// Strict TypeScript types for Academic Research Workspace
// ====================================================================

export type ProcessingStatus =
  | "uploaded"
  | "queued"
  | "extracting"
  | "indexing"
  | "ready"
  | "failed";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  research_field: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchProject {
  id: string;
  user_id: string;
  title: string;
  research_question: string | null;
  description: string | null;
  status: "active" | "archived" | "completed";
  created_at: string;
  updated_at: string;
  papers_count?: number;
  notes_count?: number;
}

export interface AcademicPaper {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  authors: string[];
  publication_year: number | null;
  journal_or_venue: string | null;
  doi: string | null;
  file_path: string;
  file_size_bytes: number;
  file_hash: string | null;
  page_count: number;
  processing_status: ProcessingStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number; // 1-indexed physical page
  char_count: number;
  text_content: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  page_number: number;
  chunk_index: number;
  content: string;
  token_count: number;
  char_start?: number;
  char_end?: number;
  created_at: string;
}

export interface Citation {
  id: string;
  document_id: string;
  document_title?: string;
  page_number: number;
  passage_quote: string;
  confidence: number;
  verified: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "assistant" | "system";
  content: string;
  citations?: Citation[];
  interpretation?: string;
  uncertainty?: string;
  thinking?: string;
  modelUsed?: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  project_id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchNote {
  id: string;
  project_id: string;
  user_id: string;
  document_id: string | null;
  document_title?: string;
  title: string;
  content: string;
  page_reference: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ComparisonDimension {
  id: string;
  label: string;
  description: string;
}

export interface PaperComparisonRow {
  paper_id: string;
  paper_title: string;
  authors: string[];
  year: number | null;
  values: Record<
    string,
    {
      text: string;
      status: "reported" | "synthesized" | "not_reported";
      citations: Citation[];
    }
  >;
}

export interface ComparisonMatrix {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  dimensions: string[];
  paper_ids: string[];
  matrix_data: {
    rows: PaperComparisonRow[];
    last_updated: string;
  };
  created_at: string;
  updated_at: string;
}

export type CanvasNodeType =
  | "paper"
  | "concept"
  | "finding"
  | "methodology"
  | "research_question"
  | "limitation"
  | "potential_gap";

export type CanvasEdgeType =
  | "supports"
  | "contradicts"
  | "extends"
  | "similar_method"
  | "related_concept"
  | "identifies_limitation";

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  label: string;
  description?: string;
  x: number;
  y: number;
  document_id?: string;
  page_number?: number;
  is_ai_suggested?: boolean;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: CanvasEdgeType;
  label?: string;
  is_ai_suggested?: boolean;
  citation_quote?: string;
}

export interface ResearchCanvasData {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: { x: number; y: number; zoom: number };
  created_at: string;
  updated_at: string;
}

export interface ResearchGapCandidate {
  id: string;
  title: string;
  description: string;
  relevance: string;
  supporting_evidence: {
    paper_id: string;
    paper_title: string;
    page_number: number;
    quote: string;
  }[];
  contradictory_evidence: {
    paper_id: string;
    paper_title: string;
    page_number: number;
    quote: string;
  }[];
  stated_limitations: string[];
  uncertainty_assessment: string;
  suggested_validation_plan: string[];
}

export interface ResearchGapAnalysis {
  id: string;
  project_id: string;
  user_id: string;
  research_question: string;
  candidate_gaps: ResearchGapCandidate[];
  validation_steps: string[];
  uncertainty_assessment: string;
  created_at: string;
  updated_at: string;
}
