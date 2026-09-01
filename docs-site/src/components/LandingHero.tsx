type DeviceProps = {
  children: React.ReactNode;
  className?: string;
};

function DeviceFrame({ children, className = "" }: DeviceProps) {
  return (
    <div className={`landing-device shrink-0 ${className}`} aria-hidden>
      <div className="landing-device-screen">
        <div className="landing-device-content">{children}</div>
      </div>
    </div>
  );
}

function VaultMock() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold leading-tight text-[var(--ink)]">
          Vault
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-[var(--muted)]">
          People you never want to forget
        </p>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        {[
          { name: "Mom", date: "Birthday · Mar 12" },
          { name: "Ananya", date: "Anniversary · Nov 3" },
        ].map((person) => (
          <div
            key={person.name}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2"
          >
            <p className="text-[11px] font-medium text-[var(--ink)]">{person.name}</p>
            <p className="mt-0.5 text-[9px] text-[var(--muted)]">{person.date}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-around border-t border-[var(--border)] pt-2">
        {["Create", "Vault", "History"].map((tab, index) => (
          <span
            key={tab}
            className={`text-[8px] font-medium ${
              index === 1 ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewMock() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold leading-tight text-[var(--ink)]">
            Preview
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--muted)]">How it will look</p>
        </div>
        <span className="text-[10px] font-semibold text-[var(--accent)]">Generate link</span>
      </div>
      <div className="mt-3 flex flex-1 flex-col items-center justify-center">
        <p className="mb-2 text-[8px] font-semibold tracking-wide text-[var(--accent)]">
          Occasio
        </p>
        <div className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="flex aspect-[3/4] flex-col justify-end bg-[var(--accent-soft)] p-3 text-center">
            <p className="text-[8px] text-[var(--muted)]">Birthday</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink)]">
              For Mom
            </p>
            <p className="mt-1 text-[9px] leading-snug text-[var(--ink-soft)]">
              Happy birthday, Ma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-16 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-12">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Occasio</p>
          <h1 className="landing-hero-title mt-3 max-w-lg text-[2rem] leading-[1.12] tracking-tight text-[var(--ink)] md:text-[2.625rem]">
            Nurture your most important connections
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-soft)] md:text-lg">
            The digital vault for your relationship milestones. Save people once — Occasio
            sends a personalized wish on the right day, every year.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="landing-btn-primary" role="status">
              App launching soon
            </span>
            <span className="landing-btn-secondary">Android &amp; iOS</span>
          </div>
        </div>

        <div className="relative mx-auto h-[21rem] w-full max-w-[20rem] sm:h-[23rem]">
          <DeviceFrame className="absolute left-0 top-8 z-0 -translate-x-1 -rotate-[8deg] scale-[0.94] opacity-95">
            <VaultMock />
          </DeviceFrame>
          <DeviceFrame className="absolute right-0 top-0 z-10 translate-x-1 rotate-[6deg]">
            <PreviewMock />
          </DeviceFrame>
        </div>
      </div>
    </section>
  );
}
