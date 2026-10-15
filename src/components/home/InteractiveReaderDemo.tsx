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
      <div className="flex items-center justify-between border-b border-[var(--border-paper)] bg-[var(--surface-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono-provenance text-xs text-[var(--ink-muted)]">
            sourcewise-reader://workspace/proj_pedagogy_ai/vaswani_2017.pdf
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-[var(--accent-sage-light)] px-2 py-0.5 font-mono-provenance text-[11px] font-medium text-[var(--accent-sage-dark)]">
            <CheckCircle className="h-3 w-3 text-[var(--accent-sage)]" />
            100% Provenance Verified
          </span>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left Pane: PDF Document Reader (7 cols) */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-paper)] bg-white p-6 sm:p-8">
          {/* Reader Top Controls */}
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--ink-muted)]" />
              <h4 className="font-editorial text-sm font-semibold text-[var(--ink-primary)]">
                Attention Is All You Need (2017)
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
              <span>Page {activePage} of 11</span>
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
                    Attention Is All You Need
                  </h3>
                  <p className="font-sans-ui text-xs text-[var(--ink-muted)] mt-1">
                    Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit • Google Brain
                  </p>
                </div>
                <p className="font-semibold text-xs uppercase tracking-wider text-[var(--ink-muted)] font-sans-ui mt-3">
                  Abstract
                </p>
                <p>
                  The dominant sequence transduction models are based on complex recurrent or
                  convolutional neural networks that include an encoder and a decoder. The best
                  performing models also connect the encoder and decoder through an attention
                  mechanism.
                </p>
                <p
                  className={`p-2.5 rounded border transition-all duration-300 ${
                    activeCitation === "1"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1">
                    [1]
                  </span>
                  “We propose a new simple network architecture, the Transformer, based solely on
                  attention mechanisms, dispensing with recurrence and convolutions entirely.”
                </p>
                <p>
                  Experiments on two machine translation tasks show these models to be superior in
                  quality while being more parallelizable and requiring significantly less time to
                  train.
                </p>
              </>
            )}

            {activePage === 2 && (
              <>
                <div className="text-xs font-mono-provenance text-[var(--ink-muted)] mb-2">
                  Section 2 — Background & Computational Limits
                </div>
                <p>
                  The goal of reducing sequential computation also forms the foundation of the
                  Extended Neural GPU, ByteNet and ConvS2S, all of which use convolutional neural
                  networks as basic building block.
                </p>
                <p
                  className={`p-2.5 rounded border transition-all duration-300 ${
                    activeCitation === "2"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1">
                    [2]
                  </span>
                  “This inherently sequential nature precludes parallelization within training
                  examples, which becomes critical at longer sequence lengths, as memory constraints
                  limit batching across examples.”
                </p>
                <p>
                  Recent work has achieved significant improvements in computational efficiency
                  through factorization tricks, but the fundamental constraint of sequential
                  execution remains.
                </p>
              </>
            )}

            {activePage === 3 && (
              <>
                <div className="text-xs font-mono-provenance text-[var(--ink-muted)] mb-2">
                  Section 3.2 — Attention Formulation
                </div>
                <p
                  className={`p-2.5 rounded border transition-all duration-300 ${
                    activeCitation === "3"
                      ? "bg-amber-50 border-[var(--accent-amber)] text-[var(--ink-primary)] shadow-sm"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-mono-provenance text-xs font-bold text-[var(--accent-amber)] mr-1">
                    [3]
                  </span>
                  “An attention function can be described as mapping a query and a set of key-value
                  pairs to an output, where the query, keys, values, and output are all vectors.”
                </p>
                <p>
                  The output is computed as a weighted sum of the values, where the weight assigned
                  to each value is computed by a compatibility function of the query with the
                  corresponding key. We compute the dot products of the query with all keys, divide
                  each by sqrt(dk), and apply a softmax function.
                </p>
              </>
            )}
          </div>

          {/* Active Citation Provenance Bar */}
          <div className="mt-4 flex items-center justify-between rounded border border-[var(--border-paper)] bg-[var(--surface-paper)] p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono-provenance font-semibold text-[var(--accent-amber)]">
                Active Citation: {DEMO_CITATIONS[activeCitation]?.badge}
              </span>
              <span className="text-[var(--ink-muted)]">
                Physical Page {DEMO_CITATIONS[activeCitation]?.page}
              </span>
            </div>
            <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
              Exact passage verified in PDF
            </span>
          </div>
        </div>

        {/* Right Pane: Contextual Evidence-Grounded Assistant (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[var(--surface-paper)] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
              <span className="font-sans-ui text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)]">
                Grounded Research Assistant
              </span>
            </div>
            <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)]">
              Gemini 2.5 Grounded
            </span>
          </div>

          {/* Assistant Conversation */}
          <div className="flex-1 space-y-4 text-xs leading-relaxed">
            {/* User Inquiry Bubble */}
            <div className="rounded-lg border border-[var(--border-paper)] bg-white p-3">
              <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)] block mb-1">
                Student Research Question
              </span>
              <p className="font-medium text-[var(--ink-primary)]">
                How does the Transformer model overcome sequential bottlenecks in earlier sequence
                models, and what is its core mathematical formulation?
              </p>
            </div>

            {/* Assistant Evidence Response */}
            <div className="rounded-lg border border-[var(--border-paper-strong)] bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans-ui text-[11px] font-semibold text-[var(--accent-sage-dark)]">
                  Evidence-Grounded Synthesis
                </span>
                <span className="font-mono-provenance text-[10px] text-[var(--ink-muted)]">
                  3 Citations Resolved
                </span>
              </div>

              <p className="text-[var(--ink-secondary)]">
                Unlike previous architectures that factored computation along step positions{" "}
                <button
                  onClick={() => selectCitation("2")}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono-provenance font-bold transition ${
                    activeCitation === "2"
                      ? "bg-amber-300 text-amber-950 scale-105"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  [2] Page 2
                </button>
                , the Transformer dispenses with recurrence and convolution entirely in favor of an
                attention-only mechanism{" "}
                <button
                  onClick={() => selectCitation("1")}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono-provenance font-bold transition ${
                    activeCitation === "1"
                      ? "bg-amber-300 text-amber-950 scale-105"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  [1] Page 1
                </button>
                .
              </p>

              <p className="text-[var(--ink-secondary)]">
                Mathematically, attention maps a query vector against key-value pairs using scaled
                dot-product compatibility{" "}
                <button
                  onClick={() => selectCitation("3")}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono-provenance font-bold transition ${
                    activeCitation === "3"
                      ? "bg-amber-300 text-amber-950 scale-105"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  [3] Page 3
                </button>
                .
              </p>

              {/* Research Interpretation Callout */}
              <div className="rounded border-l-2 border-[var(--accent-sage)] bg-[var(--accent-sage-light)] p-2.5 text-[11px] text-[var(--accent-sage-dark)]">
                <span className="font-semibold block mb-0.5">Methodological Significance:</span>
                Enables $O(1)$ path length between distant tokens, facilitating full parallelization
                during literature encoding.
              </div>
            </div>

            {/* Interactive hint */}
            <p className="font-mono-provenance text-[11px] text-center text-[var(--ink-muted)]">
              ← Click any citation badge [1], [2], [3] above to jump to that physical page and
              inspect the highlighted source passage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
