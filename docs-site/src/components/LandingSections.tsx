import Link from 'next/link';
import { OccasionIcon } from '@/components/OccasionIcon';
import { LandingCardMock } from '@/components/LandingCardMock';
import { LandingPhoneFrame } from '@/components/LandingPhoneFrame';
import { LandingScrollReveal } from '@/components/LandingScrollReveal';
import { contact } from '@/lib/contact';

const trustPoints = [
  {
    title: 'No account to start',
    body: 'Guests can pick a template, add photos, and share a link — sign in only when you want Vault.',
  },
  {
    title: 'Private share links',
    body: 'Only people with the link can view a card. Unlisted — not searchable online.',
  },
  {
    title: 'Recipients need no app',
    body: 'Cards open in the browser over WhatsApp, SMS, or email.',
  },
];

const steps = [
  {
    title: 'Pick an occasion',
    body: 'Birthday, anniversary, Mother\'s Day, and more — each template sets the tone.',
  },
  {
    title: 'Share a private link',
    body: 'Add photos and your message, preview the card, then send a link — no download for them.',
  },
  {
    title: 'Save dates in Vault',
    body: 'Optional: sign in, add birthdays once, and see upcoming occasions on Create.',
  },
];

const occasions = [
  { id: 'birthday', label: 'Birthdays' },
  { id: 'anniversary', label: 'Anniversaries' },
  { id: 'mothers_day', label: "Mother's Day" },
  { id: 'fathers_day', label: "Father's Day" },
  { id: 'proposal', label: 'Proposals' },
  { id: 'sorry', label: 'Thinking of you' },
];

const features = [
  {
    title: 'Honest, calm design',
    body: 'Cream canvas, coral accents, and copy that says what happens next — no hype, no guilt trips.',
  },
  {
    title: 'Works for everyone',
    body: 'Recipients open a link in their browser. No app install required to receive a wish.',
  },
  {
    title: 'Vault when you are ready',
    body: 'Track people and upcoming birthdays on Create. Auto-send is on the roadmap — never required to share today.',
  },
];

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--accent)]"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 10.5 8 14.5 16 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingTrustStrip() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <ul className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-3 md:gap-8">
        {trustPoints.map((point, index) => (
          <LandingScrollReveal key={point.title} delay={index * 80}>
            <li className="flex gap-3">
              <CheckIcon />
              <div>
                <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink)]">
                  {point.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{point.body}</p>
              </div>
            </li>
          </LandingScrollReveal>
        ))}
      </ul>
    </section>
  );
}

export function LandingOccasions() {
  return (
    <section className="border-b border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <LandingScrollReveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--accent)]">Occasions</p>
            <h2 className="landing-section-title mt-2 text-2xl md:text-[1.75rem]">
              For every moment that matters
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Start with a template tuned to the relationship — then make it personal with your
              words and photos.
            </p>
          </div>
        </LandingScrollReveal>
        <ul className="mt-10 flex flex-wrap gap-3">
          {occasions.map((occasion, index) => (
            <LandingScrollReveal key={occasion.id} delay={index * 60} variant="scale">
              <li className="landing-occasion-chip inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
                <OccasionIcon templateType={occasion.id} className="h-4 w-4 text-[var(--accent)]" />
                {occasion.label}
              </li>
            </LandingScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--sidebar)]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <LandingScrollReveal>
          <div className="max-w-2xl">
            <h2 className="landing-section-title text-2xl md:text-[1.75rem]">How it works</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Three steps from idea to a wish that arrives on the right day.
            </p>
          </div>
        </LandingScrollReveal>
        <ol className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <LandingScrollReveal key={step.title} delay={index * 100}>
              <li className="landing-step-card relative">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{step.body}</p>
              </li>
            </LandingScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  const [featured, ...rest] = features;

  return (
    <section className="border-b border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <LandingScrollReveal>
          <div className="max-w-2xl">
            <h2 className="landing-section-title text-2xl md:text-[1.75rem]">
              Built for real relationships
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Occasio is a vault for the people you care about — not another generic e-card app.
            </p>
          </div>
        </LandingScrollReveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <LandingScrollReveal variant="fade-left">
            <article className="landing-feature-card landing-feature-card--highlight lg:row-span-2">
              <p className="text-xs font-medium text-[var(--accent)]">Why Occasio</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                {featured.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{featured.body}</p>
              <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-xs text-[var(--muted)]">Example message</p>
                <p className="mt-2 font-[family-name:var(--font-display-serif)] text-base italic leading-relaxed text-[var(--ink-soft)]">
                  &ldquo;Still the first person I want to tell good news. Happy birthday, Ananya.&rdquo;
                </p>
              </div>
            </article>
          </LandingScrollReveal>
          {rest.map((feature, index) => (
            <LandingScrollReveal key={feature.title} delay={index * 80} variant="fade-right">
              <article className="landing-feature-card">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{feature.body}</p>
              </article>
            </LandingScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingVaultVignette() {
  return (
    <section className="border-b border-[var(--border)]">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_minmax(0,15rem)] md:py-20">
        <LandingScrollReveal variant="fade-left">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">Vault</p>
            <h2 className="landing-section-title mt-2 text-2xl md:text-[1.75rem]">
              Remember once. Reach out when it counts.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-[var(--ink-soft)]">
              Add birthdays for the people you celebrate. Occasio surfaces upcoming dates on
              Create — with a clear countdown so you are not surprised at 80 days or 8.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--ink-soft)]">
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--ink)]">Upcoming</span>
                <span>— next occasions on your Create home.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[var(--ink)]">History</span>
                <span>— resend links and see what you shared this month.</span>
              </li>
            </ul>
            <Link href="#app" className="landing-btn-secondary mt-8 inline-flex">
              View Vault screen
            </Link>
          </div>
        </LandingScrollReveal>
        <LandingScrollReveal variant="fade-right" delay={120}>
          <LandingPhoneFrame
            src="/landing/vault.png"
            alt="Occasio Vault with saved contacts and birthday countdown"
            variant="showcase"
            className="mx-auto w-full max-w-[15rem]"
          />
        </LandingScrollReveal>
      </div>
    </section>
  );
}

export function LandingRecipientCta() {
  return (
    <section className="border-b border-[var(--border)]">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-20">
        <LandingScrollReveal variant="fade-left">
          <div>
            <h2 className="landing-section-title text-2xl md:text-[1.75rem]">
              Someone sent you a wish?
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-[var(--ink-soft)]">
              Open the link they shared — your card plays right in the browser. No sign-up needed to
              view it.
            </p>
            <p className="mt-6 text-sm text-[var(--muted)]">
              Want to send one back? Join the Android beta or email us for access.
            </p>
          </div>
        </LandingScrollReveal>
        <LandingScrollReveal variant="fade-right" delay={100}>
          <LandingCardMock className="mx-auto w-full max-w-xs" />
        </LandingScrollReveal>
      </div>
    </section>
  );
}

export function LandingClosingCta() {
  return (
    <section className="landing-closing-cta relative overflow-hidden">
      <div className="landing-closing-hearts pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
        <LandingScrollReveal>
          <h2 className="landing-section-title text-2xl md:text-[1.75rem]">
            Ready when the moment arrives
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--ink-soft)]">
            Pick an occasion, share a link, and save people to Vault when you are ready. Try the
            Android beta today — we&apos;d love your feedback.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={contact.playStoreInternalTest}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-primary"
            >
              Join Android beta
            </a>
            <Link href="#app" className="landing-btn-secondary">
              See app screens
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Need an invite? Email{' '}
            <a
              href={contact.mailto}
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {contact.email}
            </a>{' '}
            and we&apos;ll get you on the internal test list.
          </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
