'use client';

import { useCallback, useState } from 'react';
import { LandingScrollReveal } from '@/components/LandingScrollReveal';
import { WishCard } from '@/components/WishCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Frame = { id: string; name: string; line: string };

/** A spread of the app's frames, newest and most distinctive first. */
const FRAMES: Frame[] = [
  { id: 'F01', name: 'Our movie', line: 'Their name is the title. You are the director.' },
  { id: 'F02', name: 'Handwritten note', line: 'Your words on ruled paper, as if by hand.' },
  { id: 'F03', name: 'Postcard', line: 'A picture on the front, a few lines and a stamp.' },
  { id: 'F04', name: 'Photo booth', line: 'Three shots and a name on a booth curtain.' },
  { id: 'F05', name: 'Contact sheet', line: 'Five frames off the roll, one circled in red.' },
  { id: 'G05', name: 'Scrapbook', line: 'Taped prints scattered on paper.' },
  { id: 'G04', name: 'Snapshot', line: 'One full photo with a small print on top.' },
  { id: 'B04', name: 'Two memories', line: 'Two photos side by side.' },
  { id: 'B01', name: 'Letter & photo', line: 'Classic and calm.' },
];

/** Two self-hosted demo photos, alternated to fill frames that take up to five. */
const PHOTOS = ['/demo/photo-1.jpg', '/demo/photo-2.jpg', '/demo/photo-1.jpg', '/demo/photo-2.jpg', '/demo/photo-1.jpg'];

function sampleCard(templateId: string): RecipientCard {
  return {
    recipientName: 'Maya',
    message: 'Thank you for every phone call that started with “did you eat?” You make every room feel like home.',
    templateType: 'birthday',
    templateId,
    fromName: 'Sam',
    isDemo: true,
    mediaUrls: PHOTOS,
  };
}

/**
 * Tap through the frames the app offers. Each preview is the same card the
 * person on the other end sees, drawn by the same code.
 */
export function LandingFrames() {
  const [active, setActive] = useState(FRAMES[0].id);
  const [round, setRound] = useState(0);
  const frame = FRAMES.find((item) => item.id === active) ?? FRAMES[0];

  const choose = useCallback((id: string) => {
    setActive(id);
    setRound((n) => n + 1);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      const next = FRAMES[(index + step + FRAMES.length) % FRAMES.length];
      choose(next.id);
      document.getElementById(`landing-frame-${next.id}`)?.focus();
    },
    [choose],
  );

  return (
    <section id="frames" className="border-b border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <LandingScrollReveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--accent)]">Frames</p>
            <h2 className="landing-section-title mt-2 text-2xl md:text-[1.75rem]">
              Same words, a different feeling
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Pick how your photos and message are arranged: a title card, a handwritten note, a
              postcard. Tap through a few.
            </p>
          </div>
        </LandingScrollReveal>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
          <LandingScrollReveal variant="fade-left" className="min-w-0">
            <div
              role="tablist"
              aria-label="Frames"
              aria-orientation="vertical"
              className="landing-frames__list"
            >
              {FRAMES.map((item, index) => (
                <button
                  key={item.id}
                  id={`landing-frame-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={item.id === active}
                  aria-controls="landing-frame-preview"
                  tabIndex={item.id === active ? 0 : -1}
                  className="landing-frames__tab"
                  onClick={() => choose(item.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <span className="landing-frames__name">{item.name}</span>
                  <span className="landing-frames__line">{item.line}</span>
                </button>
              ))}
            </div>
          </LandingScrollReveal>

          <LandingScrollReveal variant="fade-right" delay={100}>
            <div
              id="landing-frame-preview"
              role="tabpanel"
              aria-label={`${frame.name} preview`}
              className="landing-frames__preview"
            >
              <WishCard
                key={`${frame.id}-${round}`}
                card={sampleCard(frame.id)}
                replayKey={round}
                onReplay={() => setRound((n) => n + 1)}
              />
            </div>
          </LandingScrollReveal>
        </div>
      </div>
    </section>
  );
}
