import Link from "next/link";
import { contact } from "@/lib/contact";

type Props = {
  children: React.ReactNode;
};

export function PublicShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="landing-glass-nav sticky top-0 z-50 border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="rounded-[var(--radius-md)] font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Occasio
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/#frames"
              className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-flex"
            >
              Frames
            </Link>
            <a
              href={contact.playStore}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Get the app
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-clip">{children}</main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Occasio. Made with care for the people who matter.</p>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            aria-label="Legal"
          >
            <a
              href={contact.mailto}
              className="rounded-[var(--radius-md)] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Contact
            </a>
            <Link
              href="/privacy"
              className="rounded-[var(--radius-md)] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="rounded-[var(--radius-md)] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Terms of Service
            </Link>
            <Link
              href="/dmca"
              className="rounded-[var(--radius-md)] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Copyright
            </Link>
            <Link
              href="/delete-account"
              className="rounded-[var(--radius-md)] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Delete account
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
