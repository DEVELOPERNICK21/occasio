/** Static editorial card — landing recipient preview (not live data). */
export function LandingCardMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`}
      aria-hidden
    >
      <div className="aspect-[5/4] bg-[var(--accent-soft)]" />
      <div className="px-5 py-5 text-center">
        <p className="font-[family-name:var(--font-display-serif)] text-sm font-semibold text-[var(--accent)]">
          Happy Birthday,
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-display-serif)] text-xl font-semibold text-[var(--secondary)]">
          Julianne
        </p>
        <p className="mt-3 text-sm italic leading-relaxed text-[var(--ink-soft)]">
          May your day be filled with as much light as you bring to everyone around you.
        </p>
        <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
          With love, Sarah
        </p>
      </div>
    </div>
  );
}
