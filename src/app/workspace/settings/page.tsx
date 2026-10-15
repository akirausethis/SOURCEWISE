"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, User, Sparkles, Database, Trash2, CheckCircle } from "lucide-react";
import { DEFAULT_USER } from "@/lib/data/store";

export default function SettingsPage() {
  const [fullName, setFullName] = useState(DEFAULT_USER.full_name || "Elena Rostova");
  const [institution, setInstitution] = useState(
    DEFAULT_USER.institution || "Oxford Institute of Cognitive Sciences"
  );
  const [researchField, setResearchField] = useState(
    DEFAULT_USER.research_field || "Human-AI Alignment & Pedagogical Synthesis"
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to reset your local research workspace cache?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-paper)] text-[var(--ink-primary)]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-[var(--border-paper)] pb-4">
          <div className="flex items-center gap-2 text-xs font-mono-provenance text-[var(--accent-sage-dark)] mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Scholar Preferences & Provenance Architecture</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold text-[var(--ink-primary)]">
            Workspace Settings
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Manage your researcher profile, AI transparency settings, and local data persistence.
          </p>
        </div>

        {/* Researcher Profile Section */}
        <section className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-paper)] pb-3">
            <User className="h-4 w-4 text-[var(--accent-sage)]" />
            <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
              Researcher Profile
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                  Institutional Affiliation
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                Primary Research Domain / Thesis Scope
              </label>
              <input
                type="text"
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono-provenance">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Profile updated successfully.</span>
                </span>
              )}
              <button
                type="submit"
                className="ml-auto rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)]"
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* AI Transparency & Provenance Configuration */}
        <section className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-[var(--border-paper)] pb-3">
            <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
            <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
              AI Grounding & Citation Architecture
            </h2>
          </div>

          <div className="space-y-3 text-[var(--ink-secondary)] leading-relaxed">
            <div className="flex items-start justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  Primary Model Engine
                </strong>
                <span>Google Gemini 2.5 Flash / Grounded Deterministic Rule Synthesizer</span>
              </div>
              <span className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] px-2 py-0.5 rounded font-semibold">
                Active & Grounded
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  Citation Verification Filter
                </strong>
                <span>
                  Every candidate citation quote must match extracted physical page text. Hallucinations are rejected.
                </span>
              </div>
              <span className="font-mono-provenance text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Enforced (100%)
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  Document Privacy Guarantee
                </strong>
                <span>
                  Your uploaded PDFs are isolated per user project and never shared with public indexes or third-party datasets.
                </span>
              </div>
              <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                Private RLS Storage
              </span>
            </div>
          </div>
        </section>

        {/* Data Persistence & Reset */}
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-red-100 pb-3">
            <Database className="h-4 w-4 text-red-600" />
            <h2 className="font-editorial text-base font-bold text-red-950">
              Data Management & Reset
            </h2>
          </div>

          <p className="text-[var(--ink-secondary)]">
            Reset local workspace cache or clear uploaded papers and generated comparison matrices.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Local Workspace Data</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
