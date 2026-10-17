"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Layers, Settings, ArrowRight, User } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");

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
                Smart Paper Reader & AI Helper
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
              <span>2. Study Room (Reader & AI)</span>
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
              <span>3. Settings & API Key</span>
            </Link>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isWorkspace ? (
            <>
              <Link
                href="/auth/login"
                className="text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                Sign In
              </Link>
              <Link
                href="/workspace/projects/proj_pedagogy_ai"
                className="group flex items-center gap-1.5 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-sage)]"
              >
                <span>Open App Now</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5 border-l border-[var(--border-paper)] pl-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-primary)] border border-[var(--border-paper)] text-xs font-mono-provenance">
                <User className="h-3.5 w-3.5 text-[var(--ink-secondary)]" />
              </div>
              <span className="hidden text-xs text-[var(--ink-muted)] sm:inline">
                Student Mode
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

