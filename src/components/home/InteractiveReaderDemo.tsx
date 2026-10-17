"use client";

import { useState } from "react";
import { CheckCircle, Sparkles, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface DemoCitation {
  id: string;
  badge: string;
  page: number;
  phrase: string;
  docTitle: string;
}

const DEMO_CITATIONS: Record<string, DemoCitation> = {
  "1": {
    id: "cit_1",
    badge: "[1]",
    page: 1,
    phrase: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    docTitle: "Attention Is All You Need (Vaswani et al., 2017)",
  },
  "2": {
    id: "cit_2",
    badge: "[2]",
    page: 2,
    phrase: "This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths.",
    docTitle: "Attention Is All You Need (Vaswani et al., 2017)",
  },
  "3": {
    id: "cit_3",
    badge: "[3]",
    page: 3,
    phrase: "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors.",
    docTitle: "Attention Is All You Need (Vaswani et al., 2017)",
  },
};

export function InteractiveReaderDemo() {
  const [activePage, setActivePage] = useState<number>(1);
  const [activeCitation, setActiveCitation] = useState<string>("1");

  const selectCitation = (citKey: string) => {
    setActiveCitation(citKey);
    const target = DEMO_CITATIONS[citKey];
    if (target) {
      setActivePage(target.page);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-[var(--border-paper-strong)] bg-[var(--surface-paper)] shadow-xl">
      {/* Top Application Frame Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono-provenance text-xs text-[var(--ink-primary)] font-semibold">
            👋 Try it right now: Click the yellow buttons [1], [2], or [3] on the right!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-[var(--accent-sage-light)] px-2 py-0.5 font-mono-provenance text-[11px] font-medium text-[var(--accent-sage-dark)]">
            <CheckCircle className="h-3 w-3 text-[var(--accent-sage)]" />
            100% Real Page Proof
          </span>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Pane: PDF Document Reader (7 cols) */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-paper)] bg-white p-6 sm:p-8">
          {/* Reader Top Controls */}
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--accent-sage)]" />
              <h4 className="font-editorial text-sm font-bold text-[var(--ink-primary)]">
                LEFT SIDE: Your Uploaded Paper (Attention Is All You Need, 2017)
              </h4>
            </div>
            <div className="flex items-center gap-1.5 font-mono-provenance text-xs text-[var(--ink-secondary)]">
              <button
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="rounded p-1 hover:bg-[var(--surface-subtle)] disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-[var(--ink-primary)]">Page {activePage} of 3</span>
              <button
                onClick={() => setActivePage((p) => Math.min(3, p + 1))}
                disabled={activePage === 3}
                className="rounded p-1 hover:bg-[var(--surface-subtle)] disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Academic Paper Surface Text */}
          <div className="flex-1 space-y-4 font-editorial text-sm leading-relaxed text-[var(--ink-secondary)] selection:bg-amber-100">
            {activePage === 1 && (
              <>
                <div className="text-center py-2 border-b border-[var(--border-paper)]">
                  <h3 className="text-base font-bold text-[var(--ink-primary)]">
                    Attention Is All You Need (Page 1)
                  </h3>
                  <p className="font-sans-ui text-xs text-[var(--ink-muted)] mt-1">
                    Ashish Vaswani et al. • Google Brain
                  </p>
                </div>
                <p className="font-semibold text-xs uppercase tracking-wider text-[var(--ink-muted)] font-sans-ui mt-3">
                  Summary (Abstract)
                </p>
                <p>
                  Most older language AI models read words one by one in a slow chain.
                </p>
                <p
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    activeCitation === "1"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm font-medium"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1.5">
                    [1] Exact Proof on Page 1:
                  </span>
                  “We propose a new simple network architecture, the Transformer, based solely on
                  attention mechanisms, dispensing with recurrence and convolutions entirely.”
                </p>
                <p>
                  Experiments on two translation tasks show these models are much faster to train and give better results.
                </p>
              </>
            )}

            {activePage === 2 && (
              <>
                <div className="text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-2">
                  Page 2 — Why Old Models Were Too Slow
                </div>
                <p>
                  Older models had to wait for word #1 to finish before looking at word #2.
                </p>
                <p
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    activeCitation === "2"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm font-medium"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1.5">
                    [2] Exact Proof on Page 2:
                  </span>
                  “This inherently sequential nature precludes parallelization within training
                  examples, which becomes critical at longer sequence lengths, as memory constraints
                  limit batching across examples.”
                </p>
                <p>
                  Because of this bottleneck, reading long books or papers took way too much computer memory and time.
                </p>
              </>
            )}

            {activePage === 3 && (
              <>
                <div className="text-xs font-mono-provenance font-bold text-[var(--ink-primary)] mb-2">
                  Page 3 — How the New &ldquo;Attention&rdquo; Idea Works
                </div>
                <p
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    activeCitation === "3"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm font-medium"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1.5">
                    [3] Exact Proof on Page 3:
                  </span>
                  “An attention function can be described as mapping a query and a set of key-value
                  pairs to an output, where the query, keys, values, and output are all vectors.”
                </p>
                <p>
                  In simple words: instead of reading one word at a time, Attention lets the computer look at all words on the page at once and connect the most important ones together!
                </p>
              </>
            )}
          </div>

          {/* Active Citation Provenance Bar */}
          <div className="mt-4 flex items-center justify-between rounded border border-[var(--border-paper)] bg-[var(--surface-paper)] p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono-provenance font-bold text-[var(--accent-amber)]">
                Currently Highlighting: Proof {DEMO_CITATIONS[activeCitation]?.badge}
              </span>
              <span className="text-[var(--ink-muted)]">
                • Located on Page {DEMO_CITATIONS[activeCitation]?.page}
              </span>
            </div>
            <span className="font-mono-provenance text-[11px] text-emerald-700 font-semibold">
              ✓ Matched Word-for-Word
            </span>
          </div>
        </div>

        {/* Right Pane: Contextual Evidence-Grounded Assistant (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[var(--surface-paper)] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
              <span className="font-sans-ui text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                RIGHT SIDE: AI Study Helper
              </span>
            </div>
            <span className="font-mono-provenance text-[10px] text-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] px-2 py-0.5 rounded font-semibold">
              No Fake Answers
            </span>
          </div>

          {/* Assistant Conversation */}
          <div className="flex-1 space-y-4 text-xs leading-relaxed">
            {/* User Inquiry Bubble */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-3">
              <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)] font-bold block mb-1">
                🧑 Your Question:
              </span>
              <p className="font-semibold text-[var(--ink-primary)]">
                Why is the Transformer model faster than older AI models, and how does it work?
              </p>
            </div>

            {/* Assistant Evidence Response */}
            <div className="rounded-lg border border-[var(--border-paper-strong)] bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans-ui text-[11px] font-bold text-[var(--accent-sage-dark)]">
                  🤖 AI Answer (with Clickable Page Proof):
                </span>
                <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)]">
                  3 Proofs Found
                </span>
              </div>

              <p className="text-[var(--ink-secondary)]">
                Older AI models were slow because they had to read words one by one in a line{" "}
                <button
                  onClick={() => selectCitation("2")}
                  className={`inline-flex items-center px-2 py-0.5 rounded font-mono-provenance font-bold transition cursor-pointer ${
                    activeCitation === "2"
                      ? "bg-amber-300 text-amber-950 ring-2 ring-amber-500"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  [2] Click for Page 2
                </button>
                . The new Transformer model removes that slow chain and uses only &ldquo;Attention&rdquo;{" "}
                <button
                  onClick={() => selectCitation("1")}
                  className={`inline-flex items-center px-2 py-0.5 rounded font-mono-provenance font-bold transition cursor-pointer ${
                    activeCitation === "1"
                      ? "bg-amber-300 text-amber-950 ring-2 ring-amber-500"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  [1] Click for Page 1
                </button>
                .
              </p>

              <p className="text-[var(--ink-secondary)]">
                Attention works by matching your question (query) with the most important words (keys and values) all at the same time{" "}
                <button
                  onClick={() => selectCitation("3")}
                  className={`inline-flex items-center px-2 py-0.5 rounded font-mono-provenance font-bold transition cursor-pointer ${
                    activeCitation === "3"
                      ? "bg-amber-300 text-amber-950 ring-2 ring-amber-500"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  [3] Click for Page 3
                </button>
                .
              </p>

              {/* Simple Takeaway Callout */}
              <div className="rounded border-l-2 border-[var(--accent-sage)] bg-[var(--accent-sage-light)] p-2.5 text-[11px] text-[var(--accent-sage-dark)]">
                <span className="font-bold block mb-0.5">💡 Simple Takeaway:</span>
                Instead of reading one word at a time like a slow train, the Transformer looks at the whole page at once!
              </div>
            </div>

            {/* Interactive hint */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 font-mono-provenance text-[11px] text-center text-amber-900 font-semibold">
              👆 Click [1], [2], or [3] above and watch the page on the left flip &amp; highlight automatically!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
