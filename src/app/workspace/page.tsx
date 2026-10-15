"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  BookOpen,
  Plus,
  ArrowRight,
  FileText,
  Clock,
  Layers,
  Search,
  X,
  Compass,
} from "lucide-react";
import { ResearchProject, AcademicPaper, ResearchNote } from "@/types";

export default function WorkspaceDashboard() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Load projects
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      });

    // Load papers
    fetch("/api/papers")
      .then((res) => res.json())
      .then((data) => {
        if (data.papers) setPapers(data.papers);
      });

    // Load notes
    fetch("/api/notes?projectId=proj_pedagogy_ai")
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
      });
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          research_question: newQuestion,
          description: newDescription,
        }),
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setShowNewProjectModal(false);
        setNewTitle("");
        setNewQuestion("");
        setNewDescription("");
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.research_question && p.research_question.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--surface-paper)] text-[var(--ink-primary)]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Scholar Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-paper)] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-provenance text-[var(--accent-sage-dark)] mb-1">
              <Compass className="h-4 w-4 text-[var(--accent-sage)]" />
              <span>Personal Research Desk</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              Welcome back, Elena.
            </h1>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Oxford Institute of Cognitive Sciences • 2 active research projects • 5 verified papers
            </p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-2 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Research Project</span>
          </button>
        </div>

        {/* Continue Reading Desk: Primary Focus Object */}
        <section className="mt-8 rounded-xl border border-[var(--border-paper-strong)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--accent-amber)]" />
              <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                Continue Reading
              </h2>
            </div>
            <span className="font-mono-provenance text-xs text-[var(--ink-muted)]">
              Last accessed today at 14:30
            </span>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded bg-[var(--surface-subtle)] px-2 py-0.5 font-mono-provenance text-[11px] font-medium text-[var(--ink-secondary)] mb-1.5">
                NeurIPS 2017 • Physical Page 3
              </span>
              <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)]">
                Attention Is All You Need
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-2 italic">
                “An attention function can be described as mapping a query and a set of key-value pairs to an output...”
              </p>
            </div>

            <Link
              href="/workspace/projects/proj_pedagogy_ai"
              className="inline-flex items-center gap-2 rounded border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] px-4 py-2 text-xs font-semibold text-[var(--accent-sage-dark)] transition hover:bg-emerald-100 self-start md:self-auto"
            >
              <span>Resume Reading in Split-Pane</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Active Research Projects & Library Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Projects Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent-sage)]" />
                <h2 className="font-editorial text-xl font-bold text-[var(--ink-primary)]">
                  Active Projects
                </h2>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-[var(--border-paper)] bg-white pl-8 pr-3 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-sm transition hover:border-[var(--accent-sage-border)] hover:shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] uppercase font-semibold">
                          Active Thesis Workspace
                        </span>
                        <span className="text-[var(--border-paper-strong)]">•</span>
                        <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                          {project.papers_count || 3} Papers
                        </span>
                      </div>
                      <Link
                        href={`/workspace/projects/${project.id}`}
                        className="font-editorial text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--accent-sage-dark)] transition-colors"
                      >
                        {project.title}
                      </Link>
                      {project.research_question && (
                        <p className="mt-2 text-xs text-[var(--ink-secondary)] font-sans-ui">
                          <strong className="text-[var(--ink-primary)] font-semibold">
                            Research Question:
                          </strong>{" "}
                          {project.research_question}
                        </p>
                      )}
                      {project.description && (
                        <p className="mt-1 text-xs text-[var(--ink-muted)] line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/workspace/projects/${project.id}`}
                      className="rounded p-2 text-[var(--ink-muted)] group-hover:text-[var(--accent-sage-dark)] group-hover:bg-[var(--surface-subtle)] transition"
                      aria-label="Open project"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-paper)] pt-3 text-[11px] text-[var(--ink-muted)] font-mono-provenance">
                    <span>Last updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                    <Link
                      href={`/workspace/projects/${project.id}`}
                      className="text-[var(--accent-sage-dark)] font-semibold hover:underline"
                    >
                      Open Research Tabs →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Recent Notes & Evidence Highlights (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    Recent Notes
                  </h3>
                </div>
                <Link
                  href="/workspace/projects/proj_pedagogy_ai"
                  className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {notes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="rounded border border-[var(--border-paper)] bg-[var(--surface-paper)] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--ink-primary)] truncate">
                        {note.title}
                      </span>
                      {note.page_reference && (
                        <span className="font-mono-provenance text-[10px] text-[var(--accent-amber)] font-medium shrink-0">
                          p. {note.page_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--ink-secondary)] text-[11px] line-clamp-2">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-white px-1.5 py-0.5 font-mono-provenance text-[9px] text-[var(--ink-muted)] border border-[var(--border-paper)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Documents Quick List */}
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    Collected Papers
                  </h3>
                </div>
                <span className="font-mono-provenance text-xs text-[var(--ink-muted)]">
                  {papers.length} total
                </span>
              </div>

              <div className="divide-y divide-[var(--border-paper)]">
                {papers.slice(0, 3).map((paper) => (
                  <div key={paper.id} className="py-2.5 first:pt-0 last:pb-0">
                    <h4 className="text-xs font-semibold text-[var(--ink-primary)] line-clamp-1">
                      {paper.title}
                    </h4>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {paper.authors[0] || "Author"} • {paper.publication_year || 2024}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Create New Project */}
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border-paper-strong)] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3 mb-4">
                <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)]">
                  Create New Research Project
                </h3>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cognitive Load in Dual-Task Academic Reading"
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                    Research Question (Scope)
                  </label>
                  <textarea
                    rows={2}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. What are the key empirical contradictions between..."
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                    Description or Methodology Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Systematic literature review across 2020-2026 proceedings."
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="rounded border border-[var(--border-paper)] px-3.5 py-2 text-xs text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)] disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
