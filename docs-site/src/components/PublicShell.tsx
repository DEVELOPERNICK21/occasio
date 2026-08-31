import Link from "next/link";

type Props = {
  children: React.ReactNode;
};

export function PublicShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            Occasio
          </Link>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Coming soon
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Occasio. Made with care for the people who matter.</p>
          <p>Personalized wishes, sent on the right day.</p>
        </div>
      </footer>
    </div>
  );
}
