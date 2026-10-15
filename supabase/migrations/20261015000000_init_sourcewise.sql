-- ====================================================================
-- SOURCEWISE SCHEMA DEFINITION & MIGRATION
-- Production-grade schema for Academic Research Workspace
-- Includes: RLS policies, indexes, provenance tracking, and citations
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    institution TEXT,
    research_field TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Research Projects Table
CREATE TABLE IF NOT EXISTS public.research_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    research_question TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Documents / Academic Papers Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT '{}',
    publication_year INT,
    journal_or_venue TEXT,
    doi TEXT,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash TEXT,
    page_count INT DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'queued', 'extracting', 'indexing', 'ready', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Document Pages (Page provenance preservation)
CREATE TABLE IF NOT EXISTS public.document_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    char_count INT DEFAULT 0,
    text_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_document_page UNIQUE (document_id, page_number)
);

-- 5. Document Chunks (Granular search and grounding)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    char_start INT,
    char_end INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_document_chunk UNIQUE (document_id, chunk_index)
);

-- 6. Chat Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New Research Inquiry',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Message Citations (Strict provenance resolution)
CREATE TABLE IF NOT EXISTS public.message_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    passage_quote TEXT NOT NULL,
    confidence NUMERIC(4, 3) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Research Notes
CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    page_reference INT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Literature Comparison Matrices
CREATE TABLE IF NOT EXISTS public.comparison_matrices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    dimensions TEXT[] NOT NULL DEFAULT ARRAY['objective', 'methodology', 'dataset', 'key_findings', 'limitations', 'future_work'],
    paper_ids UUID[] NOT NULL DEFAULT '{}',
    matrix_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Research Canvas (Graph visualization of concepts and papers)
CREATE TABLE IF NOT EXISTS public.research_canvases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Conceptual Synthesis Map',
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    viewport JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_project_canvas UNIQUE (project_id)
);

-- 12. Research Gap Analyses
CREATE TABLE IF NOT EXISTS public.research_gap_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    research_question TEXT NOT NULL,
    candidate_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    uncertainty_assessment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_research_projects_user ON public.research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_document_pages_doc ON public.document_pages(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON public.chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_citations_msg ON public.message_citations(message_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_project ON public.research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_doc ON public.research_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_comparison_matrices_project ON public.comparison_matrices(project_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation on all data entities
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gap_analyses ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit only their own profile
CREATE POLICY "Users can manage their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- Research Projects: Users can manage only their own projects
CREATE POLICY "Users can manage their own projects"
    ON public.research_projects FOR ALL
    USING (auth.uid() = user_id);

-- Documents: Users can manage only their own documents
CREATE POLICY "Users can manage their own documents"
    ON public.documents FOR ALL
    USING (auth.uid() = user_id);

-- Document Pages: Accessible only if user owns the parent document
CREATE POLICY "Users can access pages of their own documents"
    ON public.document_pages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.documents
        WHERE documents.id = document_pages.document_id
        AND documents.user_id = auth.uid()
    ));

-- Document Chunks: Accessible only if user owns the parent document
CREATE POLICY "Users can access chunks of their own documents"
    ON public.document_chunks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.documents
        WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    ));

-- Chat Conversations: User owns conversation
CREATE POLICY "Users can manage their own conversations"
    ON public.chat_conversations FOR ALL
    USING (auth.uid() = user_id);

-- Chat Messages: User owns parent conversation
CREATE POLICY "Users can manage messages of their own conversations"
    ON public.chat_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND chat_conversations.user_id = auth.uid()
    ));

-- Citations: User owns parent message conversation
CREATE POLICY "Users can access citations of their own messages"
    ON public.message_citations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_conversations ON chat_messages.conversation_id = chat_conversations.id
        WHERE chat_messages.id = message_citations.message_id
        AND chat_conversations.user_id = auth.uid()
    ));

-- Notes: User owns notes
CREATE POLICY "Users can manage their own research notes"
    ON public.research_notes FOR ALL
    USING (auth.uid() = user_id);

-- Comparison Matrices: User owns matrices
CREATE POLICY "Users can manage their own comparison matrices"
    ON public.comparison_matrices FOR ALL
    USING (auth.uid() = user_id);

-- Canvases: User owns canvas
CREATE POLICY "Users can manage their own research canvases"
    ON public.research_canvases FOR ALL
    USING (auth.uid() = user_id);

-- Gap Analyses: User owns gap analyses
CREATE POLICY "Users can manage their own research gap analyses"
    ON public.research_gap_analyses FOR ALL
    USING (auth.uid() = user_id);

-- ====================================================================
-- STORAGE BUCKET POLICIES (Private document storage)
-- ====================================================================

-- Storage bucket creation (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sourcewise_papers', 'sourcewise_papers', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage object policies: folder structured as {user_id}/{filename}
CREATE POLICY "Users can upload their own research papers"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'sourcewise_papers' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view and download their own research papers"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'sourcewise_papers' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own research papers"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'sourcewise_papers' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
