import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { InteractiveReaderDemo } from "@/components/home/InteractiveReaderDemo";
import {
  BookOpen,
  CheckCircle,
  FileSearch,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-paper)] text-[var(--ink-primary)]">
      <Navbar />

      {/* Hero Section: Editorial & Rigorous Academic Tone */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[var(--border-paper)]">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Provenance Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] px-3.5 py-1 text-xs font-medium text-[var(--accent-sage-dark)] mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Trace Every Claim • Physical Page Provenance</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.15]">
            Where academic literature meets{" "}
            <span className="italic font-normal text-[var(--accent-sage-dark)]">
              verifiable intelligence.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed font-sans-ui">
            SOURCEWISE is an evidence-grounded AI research workspace for university students, thesis
            writers, and literature reviewers. Read papers, extract citations, synthesize comparative
            matrices, and explore real research gaps without hallucinations.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[var(--accent-sage)]"
            >
              <span>Open Research Desk</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workspace/projects/proj_pedagogy_ai"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded border border-[var(--border-paper-strong)] bg-white px-6 py-3 text-sm font-medium text-[var(--ink-primary)] shadow-sm hover:bg-[var(--surface-subtle)]"
            >
              <FileSearch className="h-4 w-4 text-[var(--accent-amber)]" />
              <span>Explore Sample Thesis Project</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--ink-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Zero fabricated papers or DOIs
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Verbatim passage coordinate mapping
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Private client & server document storage
            </span>
          </div>
        </div>

        {/* Live Interactive Product Composition Demo */}
        <div id="signature-reader" className="mt-14 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-sage)] font-semibold">
              Interactive Preview
            </span>
            <h2 className="font-editorial text-2xl font-bold mt-1 text-[var(--ink-primary)]">
              The Signature Evidence Reader
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-lg mx-auto">
              Click the citation buttons on the right to jump directly to physical pages and verify
              the highlighted source passages.
            </p>
          </div>
          <InteractiveReaderDemo />
        </div>
      </section>

      {/* The 4-Stage Research Workflow */}
      <section className="py-20 border-b border-[var(--border-paper)] bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-sage)] font-semibold">
              Research Process
            </span>
            <h2 className="font-editorial text-3xl font-bold mt-2 text-[var(--ink-primary)]">
              From disparate PDFs to defensible thesis arguments.
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-3 leading-relaxed">
              SOURCEWISE mirrors the natural cognitive workflow of academic investigation,
              amplifying critical thinking rather than replacing it with unverified claims.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-6 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--surface-subtle)] text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-4">
                01
              </div>
              <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                Collect & Ingest
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Upload private PDFs. Automatic parsing extracts bibliographic metadata, physical
                page coordinates, and sentence-level chunks without public exposure.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-6 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--surface-subtle)] text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-4">
                02
              </div>
              <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                Trace Evidence
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Ask targeted research questions. Every AI response resolves to exact physical page
                passages. Clicking any citation opens the document and scrolls to the quote.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-6 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--surface-subtle)] text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-4">
                03
              </div>
              <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                Compare Literature
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Generate structured cross-paper matrices across objectives, methodologies, datasets,
                findings, and limitations. Missing values are explicitly flagged.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-6 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--surface-subtle)] text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-4">
                04
              </div>
              <h3 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
                Explore Research Gaps
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Synthesize stated limitations into candidate research questions with explicit
                uncertainty ratings and concrete external validation plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grounded AI Transparency Philosophy Section */}
      <section id="evidence-first" className="py-20 border-b border-[var(--border-paper)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--accent-sage)] mb-3">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-mono-provenance text-xs uppercase tracking-widest font-semibold">
                Our Non-Negotiable Contract
              </span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              AI should assist verification, never fabricate consensus.
            </h2>
            <div className="mt-6 space-y-4 text-sm text-[var(--ink-secondary)] leading-relaxed">
              <p>
                In academic literature reviews, false confidence is dangerous. A single hallucinated
                citation or misattributed statistical claim can invalidate a thesis defense or
                derail months of research.
              </p>
              <p>
                SOURCEWISE enforces a strict architectural rule: every candidate citation generated
                by the model is verified against the actual text extracted from that paper’s physical
                pages. If the quote cannot be verified or the page number does not exist, the
                citation is flagged and rejected.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--border-paper)] pt-6 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--accent-sage)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink-primary)] block">
                    Distinguishable Claims
                  </strong>
                  Direct quotes, AI interpretations, and researcher notes are distinctly styled.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--accent-sage)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink-primary)] block">
                    Explicit Uncertainty
                  </strong>
                  When literature does not address an inquiry, SOURCEWISE explicitly communicates the
                  limitation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[var(--surface-paper)] text-xs text-[var(--ink-muted)] border-t border-[var(--border-paper)]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-editorial text-sm font-semibold text-[var(--ink-primary)]">
            <BookOpen className="h-4 w-4 text-[var(--accent-sage)]" />
            <span>SOURCEWISE</span>
          </div>
          <div>Built for students, thesis candidates, and researchers. Non-generic, evidence-grounded engineering.</div>
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="hover:text-[var(--ink-primary)]">
              Workspace
            </Link>
            <Link href="/workspace/settings" className="hover:text-[var(--ink-primary)]">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
