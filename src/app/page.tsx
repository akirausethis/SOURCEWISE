import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { InteractiveReaderDemo } from "@/components/home/InteractiveReaderDemo";
import {
  BookOpen,
  CheckCircle,
  FileSearch,
  ArrowRight,
  ShieldCheck,
  Upload,
  MessageSquare,
  Columns,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-paper)] text-[var(--ink-primary)]">
      <Navbar />

      {/* Hero Section: Crystal-Clear & Welcoming */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[var(--border-paper)]">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Simple Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] px-3.5 py-1 text-xs font-semibold text-[var(--accent-sage-dark)] mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Upload Any Paper or Topic • Every AI Answer Shows Exact Page Proof</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.15]">
            Read papers faster, ask questions, and{" "}
            <span className="italic font-normal text-[var(--accent-sage-dark)]">
              see the exact page every answer comes from.
            </span>
          </h1>

          {/* Supporting Copy in Plain English */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed font-sans-ui">
            Normal AI chatbots sometimes make things up. <strong>SOURCEWISE</strong> is different: you upload your PDF file (or type any topic), ask questions in plain English, and click any answer to jump straight to the highlighted sentence in your paper!
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspace/projects/proj_pedagogy_ai"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--accent-sage)]"
            >
              <span>Start Using Sourcewise Now (Free Demo)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workspace"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--border-paper-strong)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--ink-primary)] shadow-xs hover:bg-[var(--surface-subtle)]"
            >
              <FileSearch className="h-4 w-4 text-[var(--accent-amber)]" />
              <span>View All Sample Projects</span>
            </Link>
          </div>

          {/* Simple 3-Point Promise */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--ink-secondary)] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[var(--accent-sage)]" />
              1. Upload your own PDF or topic
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[var(--accent-sage)]" />
              2. Ask the AI anything in simple words
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[var(--accent-sage)]" />
              3. Click to highlight the exact page &amp; quote
            </span>
          </div>
        </div>

        {/* Live Interactive Product Preview */}
        <div id="signature-reader" className="mt-14 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-sage-dark)] font-bold">
              👇 Interactive Preview — Try Clicking the Yellow Buttons Below!
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold mt-1 text-[var(--ink-primary)]">
              See How the Paper Reader &amp; AI Helper Work Together
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 max-w-xl mx-auto">
              On the left is your paper. On the right is the AI Helper. Click the yellow <strong>[1]</strong>, <strong>[2]</strong>, or <strong>[3]</strong> buttons to watch it jump to the exact page and highlight the proof!
            </p>
          </div>
          <InteractiveReaderDemo />
        </div>
      </section>

      {/* How It Works in 4 Simple Steps */}
      <section id="how-it-works" className="py-20 border-b border-[var(--border-paper)] bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono-provenance text-xs uppercase tracking-widest text-[var(--accent-sage-dark)] font-bold">
              Super Simple Guide
            </span>
            <h2 className="font-editorial text-3xl font-bold mt-2 text-[var(--ink-primary)]">
              How to Use Sourcewise in 4 Easy Steps
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-3 leading-relaxed">
              Whether you are doing school homework, writing a college essay, or researching a big topic, here is all you need to do:
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-sage-light)] text-xs font-mono-provenance font-bold text-[var(--accent-sage-dark)] mb-4">
                <Upload className="h-4 w-4" />
              </div>
              <div className="font-mono-provenance text-[11px] font-bold text-[var(--accent-sage-dark)] uppercase">
                Step 1
              </div>
              <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                Add a Paper or Topic
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Upload a PDF/text file from your computer, or simply type any topic you want to learn about. We break it into neat, readable pages.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-xs font-mono-provenance font-bold text-amber-900 mb-4">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="font-mono-provenance text-[11px] font-bold text-[var(--accent-amber)] uppercase">
                Step 2
              </div>
              <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                Ask the AI &amp; Check Proof
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Ask the AI any question. Every answer includes yellow proof buttons. Click a button to jump straight to that page and see the highlighted sentence!
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-sage-light)] text-xs font-mono-provenance font-bold text-[var(--accent-sage-dark)] mb-4">
                <Columns className="h-4 w-4" />
              </div>
              <div className="font-mono-provenance text-[11px] font-bold text-[var(--accent-sage-dark)] uppercase">
                Step 3
              </div>
              <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                Compare Papers in a Table
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Have more than one paper? Click the <strong>Compare Table</strong> tab to see their main goals, methods, results, and weaknesses side by side.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-xs font-mono-provenance font-bold text-amber-900 mb-4">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="font-mono-provenance text-[11px] font-bold text-[var(--accent-amber)] uppercase">
                Step 4
              </div>
              <h3 className="font-editorial text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                Find New Project Ideas
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-2 leading-relaxed">
                Click the <strong>New Ideas (Gaps)</strong> tab to see what problems the authors haven&apos;t solved yet—giving you great ideas for your own project!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Real Page Proof Matters Section */}
      <section id="evidence-first" className="py-20 border-b border-[var(--border-paper)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--accent-sage-dark)] mb-3">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-mono-provenance text-xs uppercase tracking-widest font-bold">
                Why Students &amp; Researchers Love Sourcewise
              </span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              An AI helper that shows its homework—and never makes up fake quotes.
            </h2>
            <div className="mt-5 space-y-4 text-sm text-[var(--ink-secondary)] leading-relaxed">
              <p>
                When you use a normal chatbot for school or research, it can accidentally invent fake facts or fake book titles. That can ruin your homework or essay!
              </p>
              <p>
                <strong>SOURCEWISE</strong> solves this with a simple rule: every answer must point to a real page and a real sentence inside your uploaded papers. You can even open the AI&apos;s <strong>&ldquo;Thinking Steps&rdquo;</strong> box to see how it found the answer!
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--border-paper)] pt-6 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--accent-sage)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink-primary)] block">
                    See Exact Quotes Highlighted
                  </strong>
                  Click any citation to jump to the exact page and highlight the words in yellow.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--accent-sage)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink-primary)] block">
                    Honest When It Doesn&apos;t Know
                  </strong>
                  If your papers don&apos;t mention something, the AI honestly tells you instead of guessing.
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/workspace/projects/proj_pedagogy_ai"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)]"
              >
                <span>Open the Study Room &amp; Try It Yourself</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
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
          <div>Easy-to-use AI paper reader and study helper with 100% real page proof.</div>
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="hover:text-[var(--ink-primary)] font-medium">
              All Projects
            </Link>
            <Link href="/workspace/projects/proj_pedagogy_ai" className="hover:text-[var(--ink-primary)] font-medium">
              Study Room
            </Link>
            <Link href="/workspace/settings" className="hover:text-[var(--ink-primary)] font-medium">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

