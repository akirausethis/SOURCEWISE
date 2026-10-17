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
  Upload,
  MessageSquare,
  Columns,
  UserCheck,
  UserPlus,
  LogIn,
} from "lucide-react";
import { ResearchProject, AcademicPaper, ResearchNote } from "@/types";
import {
  ActiveSessionUser,
  getActiveSessionUser,
  loadWorkspaceBundle,
  saveWorkspaceBundle,
  deduplicatePapers,
  deduplicateProjects,
} from "@/lib/storage/account-storage";

export default function WorkspaceDashboard() {
  const [activeUser, setActiveUser] = useState<ActiveSessionUser | null>(null);
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
    let isMounted = true;

    const loadAllData = async () => {
      const currentUser = getActiveSessionUser();
      if (isMounted) setActiveUser(currentUser);

      const bundle = await loadWorkspaceBundle();

      // Load projects from API + merge bundle projects
      try {
        const projRes = await fetch("/api/projects");
        const projData = await projRes.json();
        const apiProjects: ResearchProject[] = projData.projects || [];
        const mergedProjects = deduplicateProjects([...bundle.projects, ...apiProjects]);
        if (isMounted) setProjects(mergedProjects);
      } catch {
        if (isMounted) setProjects(bundle.projects);
      }

      // Load papers from API + merge bundle papers
      try {
        const papRes = await fetch("/api/papers");
        const papData = await papRes.json();
        const apiPapers: AcademicPaper[] = papData.papers || [];
        const mergedPapers = deduplicatePapers([...bundle.papers, ...apiPapers]);
        if (isMounted) setPapers(mergedPapers);
      } catch {
        if (isMounted) setPapers(bundle.papers);
      }

      // Load notes
      try {
        const noteRes = await fetch("/api/notes?projectId=proj_pedagogy_ai");
        const noteData = await noteRes.json();
        const apiNotes: ResearchNote[] = noteData.notes || [];
        if (isMounted) setNotes([...bundle.notes, ...apiNotes]);
      } catch {
        if (isMounted) setNotes(bundle.notes);
      }
    };

    loadAllData();
    window.addEventListener("sourcewise-auth-changed", loadAllData);
    return () => {
      isMounted = false;
      window.removeEventListener("sourcewise-auth-changed", loadAllData);
    };
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
        const bundle = await loadWorkspaceBundle();
        const updatedCustomProjects = deduplicateProjects([data.project, ...bundle.projects]);
        await saveWorkspaceBundle({
          ...bundle,
          projects: updatedCustomProjects,
        });
        setProjects((prev) => deduplicateProjects([data.project, ...prev]));
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Account Persistence Status Banner */}
        {activeUser ? (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)]/60 px-4 py-3 text-xs text-[var(--accent-sage-dark)]">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>
                <strong>Logged in as {activeUser.full_name} ({activeUser.email}):</strong> All your uploaded PDFs, all extracted pages, AI chats, and project folders are permanently saved to your account!
              </span>
            </div>
            <span className="font-mono-provenance text-[10px] font-bold uppercase bg-white/80 px-2.5 py-1 rounded border border-[var(--accent-sage-border)] shrink-0">
              ✓ Auto-Save Active
            </span>
          </div>
        ) : (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
            <div>
              <strong>🧪 Guest Demo Mode (Temporary Session):</strong> Any PDFs or folders you add right now will reset when you close the browser tab. Want to keep your work permanently? Create a free account!
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-sage)] transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Create Account (Save My Data)</span>
              </Link>
            </div>
          </div>
        )}

        {/* Friendly Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-paper)] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-provenance text-[var(--accent-sage-dark)] font-bold mb-1">
              <Compass className="h-4 w-4 text-[var(--accent-sage)]" />
              <span>STEP 1: PICK A PROJECT FOLDER</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--ink-primary)]">
              My Study &amp; Research Projects
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-secondary)]">
              Open a project below to upload your own PDFs/topics, chat with the AI helper, and see exact page proof.
            </p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create New Project Folder</span>
          </button>
        </div>

        {/* 3-Step Visual Guide Banner */}
        <section className="mt-6 rounded-xl border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)]/50 p-4 sm:p-5">
          <div className="text-xs font-mono-provenance font-bold uppercase tracking-wider text-[var(--accent-sage-dark)] mb-3">
            ✨ How Sourcewise Works (In 3 Simple Steps):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-3 rounded-lg bg-white p-3.5 border border-[var(--border-paper)]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage-dark)] text-white font-bold">
                1
              </div>
              <div>
                <strong className="text-[var(--ink-primary)] block text-sm">Open a Project</strong>
                <span className="text-[var(--ink-secondary)]">
                  Click any project below (or create a new one for your homework or essay).
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-white p-3.5 border border-[var(--border-paper)]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage-dark)] text-white font-bold">
                2
              </div>
              <div>
                <strong className="text-[var(--ink-primary)] block text-sm">Upload PDF or Topic</strong>
                <span className="text-[var(--ink-secondary)]">
                  Upload your own PDF/text file, or type any topic you want the AI to read.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-white p-3.5 border border-[var(--border-paper)]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage-dark)] text-white font-bold">
                3
              </div>
              <div>
                <strong className="text-[var(--ink-primary)] block text-sm">Ask AI &amp; See Page Proof</strong>
                <span className="text-[var(--ink-secondary)]">
                  Ask questions, click yellow proof boxes to highlight the exact sentence, and compare papers!
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Jump Card: Most Popular Demo Project */}
        <section className="mt-6 rounded-xl border-2 border-[var(--accent-sage-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--accent-amber)]" />
              <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                🚀 Ready to Try? Start Here!
              </h2>
            </div>
            <span className="font-mono-provenance text-xs text-emerald-700 font-semibold">
              Pre-loaded with 3 Famous AI Papers + Ready for Your Uploads
            </span>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-editorial text-xl font-bold text-[var(--ink-primary)]">
                How AI &amp; Transformers Work (Sample Study Room)
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-2xl">
                Jump straight into the Study Room! You can test the pre-loaded papers (like <em>Attention Is All You Need</em>) OR click <strong>&ldquo;+ Upload PDF&rdquo;</strong> / <strong>&ldquo;+ Add Topic&rdquo;</strong> at the top to use your own data right away.
              </p>
            </div>

            <Link
              href="/workspace/projects/proj_pedagogy_ai"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] self-start md:self-auto shrink-0"
            >
              <span>Open Study Room Now</span>
              <ArrowRight className="h-4 w-4" />
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
                  Your Project Folders ({filteredProjects.length})
                </h2>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search projects..."
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
                  className="group rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs transition hover:border-[var(--accent-sage-border)] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] uppercase font-bold">
                          Project Folder
                        </span>
                        <span className="text-[var(--border-paper-strong)]">•</span>
                        <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                          {project.papers_count || 3} Papers Inside
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
                            Main Question:
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
                      className="rounded-lg bg-[var(--accent-sage-light)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-sage-dark)] group-hover:bg-[var(--accent-sage-dark)] group-hover:text-white transition flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-paper)] pt-3 text-[11px] text-[var(--ink-muted)]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Upload className="h-3 w-3 text-[var(--accent-sage)]" /> Upload PDFs
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-[var(--accent-amber)]" /> Ask AI with Proof
                      </span>
                      <span className="flex items-center gap-1">
                        <Columns className="h-3 w-3 text-[var(--accent-sage)]" /> Compare Table
                      </span>
                    </div>
                    <Link
                      href={`/workspace/projects/${project.id}`}
                      className="text-[var(--accent-sage-dark)] font-bold hover:underline"
                    >
                      Open Study Room →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Recent Notes & Papers (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    Papers Ready to Read ({papers.length})
                  </h3>
                </div>
                <Link
                  href="/workspace/projects/proj_pedagogy_ai"
                  className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] font-semibold hover:underline"
                >
                  + Add More
                </Link>
              </div>

              <div className="divide-y divide-[var(--border-paper)]">
                {papers.slice(0, 5).map((paper) => (
                  <div key={paper.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/workspace/projects/${paper.project_id || "proj_pedagogy_ai"}`}
                      className="text-xs font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-sage-dark)] line-clamp-1"
                    >
                      📄 {paper.title}
                    </Link>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {paper.authors[0] || "Author"} • {paper.publication_year || 2024} • {paper.page_count} Pages
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--accent-sage)]" />
                  <h3 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                    Saved Study Notes
                  </h3>
                </div>
                <Link
                  href="/workspace/projects/proj_pedagogy_ai"
                  className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] hover:underline"
                >
                  Open Notes
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
                        <span className="font-mono-provenance text-[10px] text-[var(--accent-amber)] font-bold shrink-0">
                          Page {note.page_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--ink-secondary)] text-[11px] line-clamp-2">
                      {note.content}
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
                  Create New Project Folder
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
                  <label className="block font-mono-provenance text-xs font-bold text-[var(--ink-primary)] mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Climate Change & Renewable Energy Essay"
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono-provenance text-xs font-bold text-[var(--ink-primary)] mb-1">
                    Main Question You Want to Answer
                  </label>
                  <textarea
                    rows={2}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. How do solar panels and wind turbines compare in cost and reliability?"
                    className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono-provenance text-xs font-bold text-[var(--ink-primary)] mb-1">
                    Short Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Collecting papers and notes for my class project."
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

