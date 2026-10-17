"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, User, Sparkles, Database, Trash2, CheckCircle, Key } from "lucide-react";
import { DEFAULT_USER } from "@/lib/data/store";
import { getActiveSessionUser, setActiveSessionUser } from "@/lib/storage/account-storage";

export default function SettingsPage() {
  const [fullName, setFullName] = useState(DEFAULT_USER.full_name || "Guest Demo Student");
  const [institution, setInstitution] = useState(
    DEFAULT_USER.institution || "University Study Desk"
  );
  const [researchField, setResearchField] = useState(
    DEFAULT_USER.research_field || "General Study & Research"
  );
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("sourcewise_gemini_key") || "";
      setGeminiKey(storedKey);
      const activeUser = getActiveSessionUser();
      if (activeUser) {
        setFullName(activeUser.full_name);
        setInstitution(activeUser.institution);
        setResearchField(activeUser.research_field);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (geminiKey.trim()) {
        localStorage.setItem("sourcewise_gemini_key", geminiKey.trim());
      } else {
        localStorage.removeItem("sourcewise_gemini_key");
      }
      const activeUser = getActiveSessionUser();
      if (activeUser) {
        setActiveSessionUser({
          ...activeUser,
          full_name: fullName,
          institution,
          research_field: researchField,
        });
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to reset your temporary Demo workspace cache?")) {
      sessionStorage.clear();
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
            <span>Step 3 • Your Profile & AI Settings</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold text-[var(--ink-primary)]">
            Settings & AI Key
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Update your name, add an optional Google Gemini API key, or reset your saved study files.
          </p>
        </div>

        {/* Researcher Profile Section */}
        <section className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-paper)] pb-3">
            <User className="h-4 w-4 text-[var(--accent-sage)]" />
            <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
              Your Student / Researcher Profile
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)] mb-1">
                  Your Name
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
                  School or University
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
                What Are You Studying?
              </label>
              <input
                type="text"
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs focus:border-[var(--accent-sage)] focus:outline-none"
              />
            </div>

            {/* Gemini API Key Configuration */}
            <div className="border-t border-[var(--border-paper)] pt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Key className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
                <label className="font-mono-provenance text-xs font-semibold text-[var(--ink-primary)]">
                  Google Gemini API Key (Optional — Works Great Without It Too!)
                </label>
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Paste your AIzaSy... key here (or leave blank)"
                className="w-full rounded border border-[var(--border-paper)] px-3 py-2 text-xs font-mono-provenance focus:border-[var(--accent-sage)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Saved privately in your browser. If you add a key, SOURCEWISE uses live Google Gemini 2.5 Flash. If you leave this blank, our built-in Smart Study Engine automatically reads your uploaded papers and answers with 100% real page proof!
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono-provenance">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Saved! Your settings are ready.</span>
                </span>
              )}
              <button
                type="submit"
                className="ml-auto rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)]"
              >
                Save My Settings
              </button>
            </div>
          </form>
        </section>

        {/* AI Transparency & Provenance Configuration */}
        <section className="rounded-xl border border-[var(--border-paper)] bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-[var(--border-paper)] pb-3">
            <Sparkles className="h-4 w-4 text-[var(--accent-sage)]" />
            <h2 className="font-editorial text-base font-bold text-[var(--ink-primary)]">
              How Our Honest AI Protects Your Work
            </h2>
          </div>

          <div className="space-y-3 text-[var(--ink-secondary)] leading-relaxed">
            <div className="flex items-start justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  Active AI Brain
                </strong>
                <span>
                  {geminiKey ? "Google Gemini 2.5 Flash (Your Custom API Key)" : "Sourcewise Built-In Smart Study Engine (Works Instantly)"}
                </span>
              </div>
              <span className="font-mono-provenance text-[11px] text-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] px-2 py-0.5 rounded font-semibold">
                Ready & Active
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  No Fake Quotes Rule
                </strong>
                <span>
                  Every quote and page number must match the real words inside your uploaded paper. Made-up facts are blocked.
                </span>
              </div>
              <span className="font-mono-provenance text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                100% Checked
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <strong className="text-[var(--ink-primary)] block font-semibold">
                  Private to You
                </strong>
                <span>
                  The PDFs and topics you upload stay in your private study workspace.
                </span>
              </div>
              <span className="font-mono-provenance text-[11px] text-[var(--ink-muted)]">
                Private Storage
              </span>
            </div>
          </div>
        </section>

        {/* Data Persistence & Reset */}
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-red-100 pb-3">
            <Database className="h-4 w-4 text-red-600" />
            <h2 className="font-editorial text-base font-bold text-red-950">
              Start Fresh (Reset Saved Data)
            </h2>
          </div>

          <p className="text-[var(--ink-secondary)]">
            Want to clear your custom uploaded papers, notes, and saved settings to start over from the original demo? Click the button below.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset All Saved Data</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
