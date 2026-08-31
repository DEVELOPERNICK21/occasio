"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--ink)] md:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <p className="truncate text-sm text-[var(--muted)]">
            Living record for Occasio — discovery → PRD → UX → TRD → build
          </p>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
