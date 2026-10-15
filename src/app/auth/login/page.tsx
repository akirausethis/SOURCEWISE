"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("student@university.edu");
  const [password, setPassword] = useState("academic-research");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      router.push("/workspace");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
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
        <h2 className="mt-4 font-editorial text-xl font-bold text-[var(--ink-primary)]">
          Sign in to your Research Desk
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
          Continue your literature reviews and verified paper annotations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                placeholder="scholar@university.edu"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded border border-[var(--border-paper)] bg-white px-3 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-muted)]">Pre-filled with scholar session</span>
              <Link
                href="/auth/signup"
                className="font-medium text-[var(--accent-sage-dark)] hover:underline"
              >
                Create new account
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] disabled:opacity-50"
            >
              {loading ? (
                <span>Entering Workspace...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border-paper)] pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-muted)] font-mono-provenance">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>Private session with isolated local storage fallback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
