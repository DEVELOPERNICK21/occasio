'use client';

import { useCallback, useState } from 'react';
import { LandingPhoneFrame } from '@/components/LandingPhoneFrame';
import { LandingScrollReveal } from '@/components/LandingScrollReveal';

type SlideId = 'create' | 'vault' | 'account' | 'signin';

type CreateMode = 'guest' | 'signed-in';

type Slide = {
  id: SlideId;
  label: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
  alt: string;
};

const slides: Slide[] = [
  {
    id: 'create',
    label: 'Create',
    title: 'Create a wish in minutes',
    body: 'Pick an occasion, add photos, and write a short message. Preview everything before you share.',
    bullets: [
      'Six occasion templates — birthday, anniversary, and more',
      'Guest mode — no account needed to share a link',
      'Quick birthday wish shortcut when you are in a hurry',
    ],
    image: '/landing/create-guest.png',
    alt: 'Occasio Create home screen with occasion templates and quick birthday wish',
  },
  {
    id: 'vault',
    label: 'Vault',
    title: 'Save people for next year',
    body: 'Add birthdays once — upcoming occasions show up on Create when it is time to reach out.',
    bullets: [
      'One place for the people you celebrate',
      'Upcoming dates surfaced on your home screen',
      'Auto-send wishes when you are ready (coming soon)',
    ],
    image: '/landing/vault.png',
    alt: 'Occasio Vault screen with saved people and birthday countdown',
  },
  {
    id: 'account',
    label: 'Account',
    title: 'Your profile, your plan',
    body: 'Sign in to sync Vault and history across devices. Free tier lets you create and share today.',
    bullets: [
      'Google or email sign-in',
      'Manage subscription when billing launches',
      'Notification preferences in one place',
    ],
    image: '/landing/account.png',
    alt: 'Occasio Account screen with profile and subscription',
  },
  {
    id: 'signin',
    label: 'Sign in',
    title: 'Calm login — no pressure',
    body: 'Continue with Google or email. Creating and sharing stay free as a guest until you want Vault.',
    bullets: [
      'Full-bleed hero — warm, personal first impression',
      'Skip sign-in and create as a guest anytime',
      'Terms and privacy linked on the welcome screen',
    ],
    image: '/landing/login.jpg',
    alt: 'Occasio login screen with Google and email options',
  },
];

const signedInImage = '/landing/create-signed-in.jpg';

export function LandingAppShowcase() {
  const [active, setActive] = useState<SlideId>('create');
  const [createMode, setCreateMode] = useState<CreateMode>('guest');

  const slide = slides.find((item) => item.id === active) ?? slides[0];

  const imageSrc =
    active === 'create' && createMode === 'signed-in' ? signedInImage : slide.image;

  const imageAlt =
    active === 'create' && createMode === 'signed-in'
      ? 'Occasio Create home signed in with upcoming occasions and milestone'
      : slide.alt;

  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next =
        event.key === 'ArrowRight'
          ? (index + 1) % slides.length
          : (index - 1 + slides.length) % slides.length;
      setActive(slides[next].id);
      if (slides[next].id !== 'create') {
        setCreateMode('guest');
      }
    },
    [],
  );

  return (
    <section id="app" className="border-b border-[var(--border)] bg-[var(--sidebar)]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <LandingScrollReveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--accent)]">Inside the app</p>
            <h2 className="landing-section-title mt-2 text-2xl md:text-[1.75rem]">
              See Occasio on your phone
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Tap a tab below to explore Create, Vault, Account, and sign-in — real screens from
              the mobile app.
            </p>
          </div>
        </LandingScrollReveal>

        <div
          className="landing-showcase-tabs mt-10 flex flex-wrap gap-2"
          role="tablist"
          aria-label="App screens"
        >
          {slides.map((item, index) => {
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`showcase-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="showcase-panel"
                tabIndex={selected ? 0 : -1}
                className={`landing-showcase-tab ${selected ? 'landing-showcase-tab--active' : ''}`}
                onClick={() => {
                  setActive(item.id);
                  if (item.id !== 'create') setCreateMode('guest');
                }}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {active === 'create' ? (
          <div
            className="mt-4 flex gap-2"
            role="group"
            aria-label="Create screen mode"
          >
            {(['guest', 'signed-in'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`landing-showcase-pill ${createMode === mode ? 'landing-showcase-pill--active' : ''}`}
                aria-pressed={createMode === mode}
                onClick={() => setCreateMode(mode)}
              >
                {mode === 'guest' ? 'Guest' : 'Signed in'}
              </button>
            ))}
          </div>
        ) : null}

        <LandingScrollReveal delay={80}>
          <div
            id="showcase-panel"
            role="tabpanel"
            aria-labelledby={`showcase-tab-${active}`}
            className="landing-showcase-panel mt-8 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,16rem)] lg:gap-12"
          >
            <div className="landing-showcase-copy">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)] md:text-2xl">
                {slide.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">{slide.body}</p>
              <ul className="mt-6 space-y-3">
                {slide.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                      aria-hidden
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-showcase-device mx-auto w-full max-w-[16rem]">
              <LandingPhoneFrame
                key={imageSrc}
                src={imageSrc}
                alt={imageAlt}
                variant="showcase"
                className="landing-showcase-phone"
              />
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
