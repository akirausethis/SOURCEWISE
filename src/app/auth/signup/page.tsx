"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { registerUserAccount } from "@/lib/storage/account-storage";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [researchField, setResearchField] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const localResult = await registerUserAccount({
        email,
        password,
        full_name: fullName,
        institution,
        research_field: researchField,
      });

      if (localResult.error) {
        throw new Error(localResult.error);
      }

      // Also sync with server API in background
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          email,
          password,
          full_name: fullName,
          institution,
          research_field: researchField,
        }),
      }).catch(() => {});

      router.push("/workspace");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[var(--surface-paper)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] text-[var(--accent-sage-dark)]">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            SOURCEWISE
          </span>
        </Link>
        <h2 className="mt-4 font-editorial text-2xl font-bold text-[var(--ink-primary)]">
          Create Your Free Account
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
          Save your uploaded PDFs, all extracted pages, AI chats, and study notes permanently so they never disappear when you close the browser.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)]/50 p-3 text-xs text-[var(--accent-sage-dark)]">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Instant Demo Migration:</strong> Any PDFs or project folders you already uploaded in Demo Mode will be automatically saved to your new account!
            </span>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Your Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                placeholder="e.g. Budi Santoso / Maya Lin"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="institution"
                  className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
                >
                  School / University (Optional)
                </label>
                <input
                  id="institution"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                  placeholder="e.g. Universitas Indonesia"
                />
              </div>

              <div>
                <label
                  htmlFor="field"
                  className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
                >
                  Study Major / Topic (Optional)
                </label>
                <input
                  id="field"
                  type="text"
                  value={researchField}
                  onChange={(e) => setResearchField(e.target.value)}
                  className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                  placeholder="e.g. Hukum / Fisika / AI"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Password (min. 4 characters) *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[var(--ink-muted)]">Already have an account?</span>
              <Link
                href="/auth/login"
                className="font-semibold text-[var(--accent-sage-dark)] hover:underline"
              >
                Sign in here →
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Creating Account &amp; Saving Data...</span>
              ) : (
                <>
                  <span>Create Account &amp; Save My Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border-paper)] pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-muted)] font-mono-provenance">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>Permanent account storage • Zero data loss on tab close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
