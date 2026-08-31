"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdjacentDocs } from "@/lib/navigation";

export function DocPager() {
  const pathname = usePathname();
  const { prev, next } = getAdjacentDocs(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Document pagination"
      className="mt-12 grid gap-3 border-t border-[var(--docs-border)] pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-lg border border-[var(--docs-border)] bg-[var(--docs-surface)] p-4 transition hover:border-[var(--docs-accent)]"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--docs-muted)]">
            Previous
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--docs-ink)] group-hover:text-[var(--docs-accent)]">
            ← {prev.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group rounded-lg border border-[var(--docs-border)] bg-[var(--docs-surface)] p-4 text-right transition hover:border-[var(--docs-accent)] sm:col-start-2"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--docs-muted)]">
            Next
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--docs-ink)] group-hover:text-[var(--docs-accent)]">
            {next.title} →
          </p>
        </Link>
      ) : null}
    </nav>
  );
}
