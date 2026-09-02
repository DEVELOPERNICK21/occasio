'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LandingFloatingHearts } from '@/components/LandingFloatingHearts';
import { LandingPhoneFrame } from '@/components/LandingPhoneFrame';
import { contact } from '@/lib/contact';

export function LandingHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="landing-hero relative overflow-hidden">
      <LandingFloatingHearts />

      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-16 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1fr_minmax(0,18rem)] lg:gap-14">
        <div
          className={`landing-hero-copy ${mounted ? 'landing-hero-copy--visible' : ''}`}
        >
          <p className="landing-hero-eyebrow text-sm font-medium text-[var(--accent)]">
            Occasio · Android beta
          </p>
          <h1 className="landing-hero-title mt-3 max-w-lg text-[2rem] leading-[1.12] tracking-tight text-[var(--ink)] md:text-[2.75rem]">
            Send a wish that feels like you showed up
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-soft)] md:text-lg">
            Pick an occasion, add a photo, share a private link in minutes. When they open it,
            it&apos;s the kind of moment that stays — not another forgotten notification.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={contact.playStoreInternalTest}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-primary landing-hero-cta"
            >
              Join Android beta
            </a>
            <Link href="#app" className="landing-btn-secondary">
              Explore the app
            </Link>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">
            Want early access? Email{' '}
            <a
              href={contact.mailto}
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {contact.email}
            </a>{' '}
            and we&apos;ll add you to the test group.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Free to create · Recipients open a link — no app required
          </p>
        </div>

        <div
          className={`landing-hero-device relative mx-auto w-full max-w-[18rem] ${mounted ? 'landing-hero-device--visible' : ''}`}
        >
          <div className="landing-phone-glow" aria-hidden />
          <LandingPhoneFrame
            src="/landing/create-guest.png"
            alt="Occasio Create home — pick an occasion and share a wish"
            priority
            variant="hero"
            className="landing-hero-phone"
          />
        </div>
      </div>
    </section>
  );
}
