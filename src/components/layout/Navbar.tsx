"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Layers, ShieldCheck, ArrowRight, User } from "lucide-react";

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
                Academic AI Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links (for marketing / general) */}
        {!isWorkspace ? (
          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--ink-secondary)]">
            <Link
              href="#evidence-first"
              className="transition-colors hover:text-[var(--accent-sage-dark)]"
            >
              Evidence Grounding
            </Link>
            <Link
              href="#signature-reader"
              className="transition-colors hover:text-[var(--accent-sage-dark)]"
            >
              PDF Reader
            </Link>
            <Link
              href="#research-canvas"
              className="transition-colors hover:text-[var(--accent-sage-dark)]"
            >
              Research Canvas
            </Link>
            <Link
              href="#gap-exploration"
              className="transition-colors hover:text-[var(--accent-sage-dark)]"
            >
              Gap Analysis
            </Link>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname === "/workspace"
                  ? "bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Research Desk
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
              Active Project
            </Link>
            <Link
              href="/workspace/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname === "/workspace/settings"
                  ? "bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-sage)]" />
              Provenance Settings
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
                href="/workspace"
                className="group flex items-center gap-1.5 rounded border border-[var(--accent-sage-dark)] bg-[var(--accent-sage-dark)] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[var(--accent-sage)]"
              >
                <span>Enter Research Desk</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5 border-l border-[var(--border-paper)] pl-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--ink-primary)] border border-[var(--border-paper)] text-xs font-mono-provenance">
                <User className="h-3.5 w-3.5 text-[var(--ink-secondary)]" />
              </div>
              <span className="hidden text-xs text-[var(--ink-muted)] sm:inline">
                Elena Rostova
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
