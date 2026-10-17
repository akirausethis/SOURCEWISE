"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, ShieldCheck, AlertCircle, UserCheck } from "lucide-react";
import {
  loginUserAccount,
  getRegisteredAccounts,
  RegisteredAccount,
} from "@/lib/storage/account-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<RegisteredAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getRegisteredAccounts();
    setSavedAccounts(existing);
    if (existing.length > 0) {
      setEmail(existing[existing.length - 1].email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginUserAccount({ email, password });
      if (result.error) {
        throw new Error(result.error);
      }

      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      }).catch(() => {});

      router.push("/workspace");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginUserAccount({
        email: "student@university.edu",
        password: "academic-research",
      });
      if (result.error) throw new Error(result.error);
      router.push("/workspace");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
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
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
          Access your permanently saved PDFs, extracted pages, AI chats, and project folders.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-[var(--border-paper-strong)] bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedAccounts.length > 0 && (
            <div className="mb-5 rounded-lg border border-[var(--border-paper)] bg-[var(--surface-subtle)] p-3">
              <div className="font-mono-provenance text-[10px] font-bold uppercase text-[var(--ink-muted)] mb-2">
                Saved Accounts on This Browser (Click to Fill Email):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium border transition cursor-pointer ${
                      email.toLowerCase() === acc.email.toLowerCase()
                        ? "border-[var(--accent-sage-dark)] bg-[var(--accent-sage-light)] text-[var(--accent-sage-dark)] font-bold"
                        : "border-[var(--border-paper-strong)] bg-white text-[var(--ink-primary)] hover:bg-zinc-50"
                    }`}
                  >
                    <UserCheck className="h-3 w-3" />
                    <span>{acc.full_name} ({acc.email})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono-provenance text-xs font-medium text-[var(--ink-primary)]"
              >
                Email Address
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
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-muted)]">Don&apos;t have an account yet?</span>
              <Link
                href="/auth/signup"
                className="font-semibold text-[var(--accent-sage-dark)] hover:underline"
              >
                + Create Free Account →
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to My Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[var(--border-paper)] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleQuickDemoAccount}
              className="w-full rounded-lg border border-[var(--border-paper-strong)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-zinc-100 transition cursor-pointer"
            >
              🎓 Or Sign In with Pre-Filled Scholar Account (student@university.edu)
            </button>
          </div>

          <div className="mt-5 border-t border-[var(--border-paper)] pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-muted)] font-mono-provenance">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>Your PDFs &amp; projects stay permanently saved in your account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
