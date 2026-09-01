import Link from 'next/link';

export function ExpiredCardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Occasio
        </p>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          This link has expired
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          Greeting links are available for 30 days. Ask the sender to share a new wish.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#174a3e]"
        >
          Make your own
        </Link>
      </div>
    </div>
  );
}
