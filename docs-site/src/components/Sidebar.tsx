"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--docs-border)] bg-[var(--docs-sidebar)] transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="border-b border-[var(--docs-border)] px-4 py-4">
          <Link href="/docs" className="block" onClick={onClose}>
            <span className="text-sm font-semibold text-[var(--docs-ink)]">
              Occasio
            </span>
            <span className="mt-0.5 block text-[11px] text-[var(--docs-muted)]">
              Developer documentation
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navigation.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--docs-muted)]">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={[
                          "block rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors",
                          active
                            ? "bg-[var(--docs-accent-soft)] font-medium text-[var(--docs-accent)]"
                            : "text-[var(--docs-ink-soft)] hover:bg-[var(--docs-surface)] hover:text-[var(--docs-ink)]",
                        ].join(" ")}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
