"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="docs-layout flex min-h-screen bg-[var(--docs-bg)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-[var(--docs-border)] bg-[var(--docs-bg)]/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-[var(--docs-border)] px-2.5 py-1 text-xs text-[var(--docs-ink)] md:hidden"
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
            <p className="text-xs font-medium text-[var(--docs-muted)]">
              Developer docs
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-[var(--docs-muted)] transition hover:text-[var(--docs-accent)]"
          >
            Public site →
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-10">
          <div className="rounded-xl border border-[var(--docs-border)] bg-[var(--docs-surface)] px-5 py-8 shadow-sm md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
