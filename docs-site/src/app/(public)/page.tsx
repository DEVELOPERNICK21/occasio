import { LandingHero } from "@/components/LandingHero";

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
    body: "Birthdays, anniversaries, festivals — set auto-send once and let Occasio remember for you.",
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingHero />

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <ul className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-[var(--ink-soft)] md:flex-row md:flex-wrap md:gap-x-8 md:gap-y-2">
          <li>Readable on any phone</li>
          <li>Your dates stay private</li>
          <li>Recipients need no app</li>
        </ul>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
            Three steps from idea to a wish that arrives on the right day.
          </p>
          <ol className="mt-10 space-y-6">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-6"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--sidebar)]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
            Built for real relationships
          </h2>
          <div className="mt-10 space-y-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
            Someone sent you a wish?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--ink-soft)]">
            Open the link they shared — your card plays right in the browser. No sign-up
            needed.
          </p>
        </div>
      </section>
    </>
  );
}
