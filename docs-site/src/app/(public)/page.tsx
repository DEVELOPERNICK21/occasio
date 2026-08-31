const steps = [
  {
    title: "Create a wish",
    body: "Pick a template, add photos, and write a heartfelt message in minutes.",
  },
  {
    title: "Share the link",
    body: "Send a beautiful card via WhatsApp, SMS, or any app — no account needed.",
  },
  {
    title: "Save to Vault",
    body: "Remember their date once. Occasio sends a personalized wish every year.",
  },
];

const features = [
  {
    title: "Thoughtful in minutes",
    body: "Templates, photos, and messages — designed for real relationships, not generic cards.",
  },
  {
    title: "Works for everyone",
    body: "Recipients open a link in their browser. No app install required to receive a wish.",
  },
  {
    title: "Never forget again",
    body: "Birthdays, anniversaries, festivals — arm auto-send once and let Occasio remember for you.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Personalized digital wishes
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.1] tracking-tight text-[var(--ink)] md:text-6xl">
            Never miss what matters.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl">
            Save the people you love once. Occasio creates and sends a personalized wish on
            the right day — every year — without you having to remember.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white">
              App launching soon
            </span>
            <span className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--ink-soft)]">
              Android & iOS
            </span>
          </div>
        </div>

        <div
          className="mt-14 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-12"
          style={{ boxShadow: "0 4px 24px rgba(28, 25, 20, 0.08)" }}
        >
          <div className="mx-auto max-w-sm text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Birthday</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              For Mom
            </p>
            <p className="mt-4 text-[var(--ink-soft)]">
              Happy birthday, Ma. Thank you for everything you do.
            </p>
            <p className="mt-6 text-sm text-[var(--muted)]">A wish shared via Occasio</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[var(--ink-soft)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            Built for real relationships
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl bg-[var(--accent-soft)] p-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[var(--ink-soft)]">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--accent-soft)]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:px-8 md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] md:text-4xl">
            Someone sent you a wish?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--ink-soft)]">
            Open the link they shared — your card plays right in the browser. No sign-up needed.
          </p>
        </div>
      </section>
    </>
  );
}
