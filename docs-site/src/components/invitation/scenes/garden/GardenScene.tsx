'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { OCCASION_INFO, formatDay } from '@/lib/invitation';
import { useCountdown } from '../../Countdown';
import { useScene } from '../../scroll';
import { FooterBlock, MomentsBlock, ReplyBlock, VenueBlock } from '../Closing';
import type { SceneContext } from '../context';
import { fitNameSize } from '../typography';
import baseStyles from '../../invitation.module.css';
import { Hanger } from './GardenArt';
import { FlipCards } from './FlipCards';
import { GardenGate } from './GardenGate';
import { ScratchHeart } from './ScratchHeart';
import styles from './garden.module.css';

/** "119 days · 16 hours · 10 minutes", in a hand, under the date. */
function HandCountdown({ ctx }: { ctx: SceneContext }) {
  const countdown = useCountdown(ctx.invitation);
  if (!countdown) return null;
  if (countdown.over) return <p className={styles.handCount}>{countdown.today ? 'It is today' : 'Thank you for celebrating with us'}</p>;
  const { parts } = countdown;
  if (!parts) return <p className={styles.handCount}>&nbsp;</p>;
  return (
    <p className={styles.handCount} role="timer" aria-label="Time until the celebration begins">
      {parts.days} days · {parts.hours} hours · {parts.minutes} minutes
    </p>
  );
}

/**
 * The garden. Green doors with a brass boss open on satin curtains, the curtains draw back and you
 * are standing in a walled garden with a fountain (a photograph), which you walk towards as you scroll. Then a
 * foil heart to scratch for the date, a lawn of cards to turn over for the plan, and the reply.
 */
export function GardenScene({ ctx }: { ctx: SceneContext }) {
  const { invitation, opened, gateGone, hostLine } = ctx;
  const stage = useScene<HTMLDivElement>('pin');
  const sentinel = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState(false);
  const [scratched, setScratched] = useState(false);
  const info = OCCASION_INFO[invitation.occasion];
  const nameOne = invitation.nameOne;
  const nameTwo = invitation.nameTwo;
  const size = fitNameSize(ctx.title, 330, 34, 62, 0.42);

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

  const { fireFrom, flash } = ctx;
  const revealed = useCallback(
    (heart: HTMLElement) => {
      setScratched(true);
      fireFrom(heart, 'petals', 1.6);
      flash();
    },
    [fireFrom, flash],
  );

  return (
    <>
      {gateGone ? null : <GardenGate ctx={ctx} />}

      <main className={styles.page} aria-hidden={!opened} inert={!opened}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.sticky}>
            <div className={styles.sky} />
            <div className={styles.box}>
              <div className={styles.photo} />
              <div className={styles.near} />

              <div className={styles.text}>
                <p className={`${styles.rise} ${styles.eyebrow}`} style={{ '--r': 0 } as CSSProperties}>
                  We are honoured to welcome you
                </p>
                <p className={`${styles.rise} ${styles.lead}`} style={{ '--r': 1 } as CSSProperties}>
                  to the {info.noun} of
                </p>
                <h1
                  className={`${styles.rise} ${styles.names}`}
                  style={{ '--r': 2, '--ns': size } as CSSProperties}
                  aria-label={ctx.title}
                >
                  <span aria-hidden>{nameOne}</span>
                  {nameTwo ? (
                    <>
                      <span className={styles.amp} aria-hidden>
                        &amp;
                      </span>
                      <span aria-hidden>{nameTwo}</span>
                    </>
                  ) : null}
                </h1>
                {invitation.tagline ? (
                  <p className={`${styles.rise} ${styles.tagline}`} style={{ '--r': 3 } as CSSProperties}>
                    {invitation.tagline}
                  </p>
                ) : null}
                <p className={`${styles.rise} ${styles.host}`} style={{ '--r': 4 } as CSSProperties}>
                  {hostLine}
                </p>
              </div>
            </div>

            <div className={styles.cue} aria-hidden>
              <span className={styles.cueText}>Walk forward</span>
              <span className={styles.cueArrow} />
            </div>
          </div>
        </div>
        <div ref={sentinel} className={baseStyles.sentinel} aria-hidden />

        <section className={styles.scratchSection} aria-labelledby="scratch-title">
          <p className={styles.script} id="scratch-title" data-reveal="up">
            Scratch to reveal
          </p>
          <p className={styles.scratchHint} data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
            {scratched ? 'Save the date' : 'Use your finger to find the day'}
          </p>
          <div data-reveal="zoom" style={{ '--i': 2 } as CSSProperties}>
            <ScratchHeart onReveal={revealed} skipLabel="Or reveal it without scratching">
              <p className={styles.heartDay}>{formatDay(invitation.date, 'weekday')}</p>
              <p className={styles.heartNumber}>{formatDay(invitation.date, 'dayNumber')}</p>
              <p className={styles.heartMonth}>
                {formatDay(invitation.date).split(' ').slice(1).join(' ')}
              </p>
              <p className={styles.heartPlace}>{invitation.venueName}</p>
            </ScratchHeart>
          </div>
          <div className={styles.afterScratch} data-shown={scratched ? '' : undefined}>
            <HandCountdown ctx={ctx} />
            <div className={styles.actions}>
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

        <FlipCards entries={ctx.entries} lit={ctx.lit} onToggle={ctx.toggleToken} />

        {invitation.dressCode ? (
          <section className={styles.dressCard} data-reveal="up">
            <Hanger className={styles.dressIcon} />
            <p className={styles.dressLabel}>Dress code</p>
            <p className={styles.dressText}>{invitation.dressCode}</p>
          </section>
        ) : null}

        <div className={baseStyles.wrap}>
          <VenueBlock ctx={ctx} variant="garden" />
        </div>
        <MomentsBlock ctx={ctx} variant="garden" />
        <ReplyBlock ctx={ctx} />
        <FooterBlock ctx={ctx} />
      </main>

      {ctx.hasReply ? (
        <a
          className={baseStyles.pill}
          href="#rsvp"
          onClick={ctx.goToReply}
          data-show={pill && gateGone ? '' : undefined}
          tabIndex={pill ? 0 : -1}
        >
          RSVP
        </a>
      ) : null}
    </>
  );
}

