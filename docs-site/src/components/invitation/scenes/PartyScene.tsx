'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { OCCASION_INFO, formatDay } from '@/lib/invitation';
import type { Look } from '@/lib/invitationTheme';
import { Celebrations } from '../Celebrations';
import { Countdown } from '../Countdown';
import { PartyGate } from '../PartyGate';
import { Hero } from '../Hero';
import { useScene } from '../scroll';
import styles from '../invitation.module.css';
import { FooterBlock, MomentsBlock, ReplyBlock, VenueBlock } from './Closing';
import type { SceneContext } from './context';

const AMBIENT = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 9) % 100,
  delay: ((i * 53) % 90) / 10,
  duration: 11 + ((i * 29) % 80) / 10,
  size: 8 + ((i * 17) % 9),
  sway: ((i * 41) % 120) - 60,
}));

const DRIFT_SHAPE: Record<Look, string> = {
  regal: styles.driftPetal,
  palace: styles.driftPetal,
  party: styles.driftBit,
  sage: styles.driftLeaf,
};

/** Floating confetti behind everything, once the invitation is open. Fixed, so it costs nothing on scroll. */
function Ambient({ colors, look }: { colors: string[]; look: Look }) {
  const flat = look === 'party';
  return (
    <div className={styles.ambient} aria-hidden>
      {AMBIENT.map((bit, i) => (
        <span
          key={i}
          className={`${styles.drift} ${DRIFT_SHAPE[look]}`}
          style={
            {
              left: `${bit.left}%`,
              width: bit.size,
              height: flat ? bit.size * 0.7 : bit.size * 1.6,
              background: colors[i % colors.length],
              animationDelay: `-${bit.delay}s`,
              animationDuration: `${bit.duration}s`,
              '--sway': `${bit.sway}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * The party look: balloons to pop, a pinned hero that assembles as you scroll, a countdown, stars
 * to collect for each event, the venue, the photo stack and the reply pass.
 */
export function PartyScene({ ctx }: { ctx: SceneContext }) {
  const { invitation, theme, opened, gateGone, entries } = ctx;
  const { palette, look, copy } = theme;
  const info = OCCASION_INFO[invitation.occasion];
  const stage = useScene<HTMLDivElement>('pin');
  const sentinel = useRef<HTMLDivElement>(null);
  const [showers, setShowers] = useState(0);
  const [pill, setPill] = useState(false);

  const shower = (event: MouseEvent<HTMLElement>) => {
    ctx.fire(event.clientX, event.clientY, 'confetti', 0.7);
    setShowers((count) => count + 1);
  };

  // The floating reply button shows once the hero is behind you, and steps aside at the reply itself.
  useEffect(() => {
    const reply = document.getElementById('rsvp');
    const marker = sentinel.current;
    if (!opened || !reply || !marker || typeof IntersectionObserver === 'undefined') return undefined;
    let past = false;
    let atReply = false;
    const observer = new IntersectionObserver((seen) => {
      for (const entry of seen) {
        if (entry.target === reply) atReply = entry.isIntersecting;
        else past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      }
      setPill(past && !atReply);
    });
    observer.observe(marker);
    observer.observe(reply);
    return () => observer.disconnect();
  }, [opened]);

  const startsOn = entries[0]?.date ?? invitation.date;

  return (
    <>
      {gateGone ? null : (
        <PartyGate title={ctx.title} initials={ctx.initials} onOpen={ctx.open} onGone={ctx.gone} burst={ctx.fire} />
      )}
      {opened ? <Ambient colors={palette.confetti} look={look} /> : null}
      <div className={styles.progress} aria-hidden />

      <main className={styles.page} aria-hidden={!opened} inert={!opened}>
        <Hero
          stageRef={stage}
          invitation={invitation}
          photo={ctx.photos[0]}
          initials={ctx.initials}
          title={ctx.title}
          hostLine={ctx.hostLine}
          lead={info.lead}
          tapLabel="Throw confetti"
          note={showers === 0 ? copy.showerHint : `${showers} ${showers === 1 ? 'pop' : 'pops'}`}
          onTap={shower}
        />
        <div ref={sentinel} className={styles.sentinel} aria-hidden />

        <section className={`${styles.section} ${styles.counting}`} aria-label="Countdown">
          <div className={styles.wrap}>
            <p className={styles.sectionEyebrow} data-reveal="up">
              {formatDay(startsOn) ? `Counting down to ${formatDay(startsOn, 'short')}` : 'Counting down'}
            </p>
            <div data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
              <Countdown invitation={invitation} />
            </div>
            <div className={styles.actions} data-reveal="up" style={{ '--i': 2 } as CSSProperties}>
              {ctx.hasReply ? (
                <a className={styles.solid} href="#rsvp" onClick={ctx.goToReply}>
                  RSVP
                </a>
              ) : null}
              <a className={styles.ghost} href={`/api/v1/cards/${ctx.slug}/calendar`}>
                Save the date
              </a>
            </div>
          </div>
        </section>

        <div className={styles.wrap}>
          <Celebrations invitation={invitation} lit={ctx.lit} onToggle={ctx.toggleToken} />
          <VenueBlock ctx={ctx} />
        </div>
        <MomentsBlock ctx={ctx} />
        <ReplyBlock ctx={ctx} />
        <FooterBlock ctx={ctx} />
      </main>

      {ctx.hasReply ? (
        <a className={styles.pill} href="#rsvp" onClick={ctx.goToReply} data-show={pill ? '' : undefined} tabIndex={pill ? 0 : -1}>
          RSVP
        </a>
      ) : null}
    </>
  );
}
