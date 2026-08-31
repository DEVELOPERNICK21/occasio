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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="border-b border-[var(--border)] px-5 py-5">
          <Link href="/" className="block" onClick={onClose}>
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
              Occasio
            </span>
            <span className="mt-0.5 block text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Product docs
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={[
                          "block rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                            : "text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
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
