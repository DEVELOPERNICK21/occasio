import Link from 'next/link';

export function CardNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Occasio
        </p>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Card not found
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          This link may be incorrect or the card was removed. Check the URL or ask the sender
          to share again.
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
