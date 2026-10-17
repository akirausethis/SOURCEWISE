"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  Layers,
  Settings,
  ArrowRight,
  UserCheck,
  LogOut,
  UserPlus,
  LogIn,
} from "lucide-react";
import {
  ActiveSessionUser,
  getActiveSessionUser,
  logoutUserAccount,
} from "@/lib/storage/account-storage";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isWorkspace = pathname.startsWith("/workspace");
  const [user, setUser] = useState<ActiveSessionUser | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      setUser(getActiveSessionUser());
    };
    syncAuth();
    window.addEventListener("sourcewise-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("sourcewise-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await logoutUserAccount();
    setUser(null);
    if (isWorkspace) {
      window.location.href = "/workspace";
    } else {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-paper)] bg-[var(--surface-paper)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] text-[var(--accent-sage-dark)] transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl font-bold tracking-tight text-[var(--ink-primary)]">
                SOURCEWISE
              </span>
              <span className="font-mono-provenance text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">
                Smart Paper Reader &amp; AI Helper
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        {!isWorkspace ? (
          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--ink-secondary)]">
            <Link
              href="#signature-reader"
              className="transition-colors hover:text-[var(--accent-sage-dark)] font-medium"
            >
              Try Interactive Demo
            </Link>
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-[var(--accent-sage-dark)] font-medium"
            >
              How It Works (4 Steps)
            </Link>
            <Link
              href="#evidence-first"
              className="transition-colors hover:text-[var(--accent-sage-dark)] font-medium"
            >
              Why Real Page Proof Matters
            </Link>
          </nav>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/workspace"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname === "/workspace"
                  ? "bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>1. All Projects</span>
            </Link>
            <Link
              href="/workspace/projects/proj_pedagogy_ai"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname.includes("/projects/")
                  ? "bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>2. Study Room (Reader &amp; AI)</span>
            </Link>
            <Link
              href="/workspace/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname === "/workspace/settings"
                  ? "bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <Settings className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              <span>3. Settings &amp; API Key</span>
            </Link>
          </div>
        )}

        {/* Action Controls (Auth & Account State) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 border-l border-[var(--border-paper)] pl-3">
              <div
                className="flex items-center gap-1.5 rounded-full bg-[var(--accent-sage-light)] border border-[var(--accent-sage-border)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-sage-dark)]"
                title={`Signed in as ${user.email} — Your data is permanently saved`}
              >
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[120px] truncate">{user.full_name}</span>
              </div>
              {!isWorkspace && (
                <Link
                  href="/workspace"
                  className="rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-sage)]"
                >
                  My Workspace →
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--ink-secondary)] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
                title="Sign out and return to Demo Mode"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : !isWorkspace ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 rounded border border-[var(--border-paper-strong)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition"
              >
                <LogIn className="h-3.5 w-3.5 text-[var(--accent-sage-dark)]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth/signup"
                className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--accent-sage-border)] bg-[var(--accent-sage-light)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-sage-dark)] hover:bg-[var(--accent-sage-light)]/80 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create Account</span>
              </Link>
              <Link
                href="/workspace/projects/proj_pedagogy_ai"
                className="group flex items-center gap-1.5 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)]"
              >
                <span>Try Demo</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 border-l border-[var(--border-paper)] pl-3">
              <span
                className="hidden lg:inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 font-mono-provenance text-[10px] font-bold text-amber-900"
                title="In Demo Mode, uploaded files reset when you close the browser tab. Create an account to save permanently!"
              >
                🧪 Demo Mode
              </span>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 rounded border border-[var(--border-paper-strong)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition"
              >
                <LogIn className="h-3 w-3 text-[var(--accent-sage-dark)]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-sage)] transition shadow-2xs"
              >
                <UserPlus className="h-3 w-3" />
                <span>Save Work (Sign Up)</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
