'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { GANESH_BLESSING, OCCASION_INFO, formatDay, formatTime, type Invitation } from '@/lib/invitation';
import { useCountdown } from '../../Countdown';
import { useScene } from '../../scroll';
import { FooterBlock, MomentsBlock, ReplyBlock, VenueBlock } from '../Closing';
import type { SceneContext } from '../context';
import { fitNameSize } from '../typography';
import baseStyles from '../../invitation.module.css';
import { ArchFrame } from './PalaceArt';
import { PalaceGate } from './PalaceGate';
import { Windows } from './Windows';
import styles from './palace.module.css';

/** What the occasion is called on an invitation to it. */
function ceremonyName(invitation: Invitation): string {
  switch (invitation.occasion) {
    case 'wedding':
      return 'Wedding Ceremony';
    case 'engagement':
      return 'Engagement Ceremony';
    case 'anniversary':
      return 'Anniversary Celebration';
    default:
      return OCCASION_INFO[invitation.occasion].label;
  }
}

/** The countdown as four brass plates, like the numbers beside a palace door. */
function PlaqueCountdown({ ctx }: { ctx: SceneContext }) {
  const countdown = useCountdown(ctx.invitation);
  if (!countdown) return null;
  if (countdown.over) {
    return <p className={styles.over}>{countdown.today ? 'It is today' : 'Thank you for celebrating with us'}</p>;
  }
  const { parts } = countdown;
  const cells: Array<[string, number | null]> = [
    ['Days', parts?.days ?? null],
    ['Hours', parts?.hours ?? null],
    ['Minutes', parts?.minutes ?? null],
    ['Seconds', parts?.seconds ?? null],
  ];
  return (
    <div className={styles.plates} role="timer" aria-label="Time until the celebration begins">
      {cells.map(([label, value]) => (
        <div key={label} className={styles.brass}>
          <span key={label === 'Seconds' ? label : (value ?? 'x')} className={styles.brassNumber}>
            {value === null ? '--' : String(value).padStart(2, '0')}
          </span>
          <span className={styles.brassLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The Pink City palace, built on photographs of the lotus gate at the City Palace in Jaipur. You
 * pull a ring and the two golden doors swing open on the room inside, where a shloka appears. As
 * you scroll the arch fills with plum satin, the monogram draws itself and the names and the
 * invitation arrive, with the host's own photograph in a small arch at the foot of it, above the
 * marble terrace. Then the events are windows to open, the countdown
 * is brass plates, and the reply closes the page.
 */
export function PalaceScene({ ctx }: { ctx: SceneContext }) {
  const { invitation, opened, gateGone, hostLine } = ctx;
  const stage = useScene<HTMLDivElement>('pin');
  const sentinel = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState(false);
  const [showers, setShowers] = useState(0);
  const info = OCCASION_INFO[invitation.occasion];
  const blessing = invitation.blessing === 'ganesh';
  const size = fitNameSize(ctx.title, 330, 24, 46);

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

  const wave = (event: React.MouseEvent<HTMLElement>) => {
    ctx.fire(event.clientX, event.clientY, 'petals', 0.8);
    setShowers((count) => count + 1);
  };

  const first = ctx.entries[0];
  const last = ctx.entries[ctx.entries.length - 1];
  const dates =
    first && last && first.date !== last.date
      ? `${formatDay(first.date, 'short')} to ${formatDay(last.date, 'short')}`
      : formatDay(invitation.date);

  return (
    <>
      {ctx.gateGone ? null : <PalaceGate ctx={ctx} />}

      <main className={styles.page} aria-hidden={!opened} inert={!opened}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.sticky}>
            <div className={styles.wall} />
            <div className={styles.box}>
              <div className={styles.archWrap}>
                <ArchFrame className={styles.archLine} />
                <div className={styles.plum} />
              </div>

              <div className={styles.blessing}>
                {blessing ? (
                  <>
                    <p className={styles.shlokaHead}>{GANESH_BLESSING.heading}</p>
                    <p className={styles.shloka}>{GANESH_BLESSING.verse}</p>
                    <p className={styles.shlokaMeaning}>{GANESH_BLESSING.meaning}</p>
                  </>
                ) : (
                  <>
                    <p className={styles.lotusMark} aria-hidden>
                      &#10048;
                    </p>
                    <p className={styles.hostCaps}>{hostLine}</p>
                    <p className={styles.leadItalic}>{info.lead}</p>
                  </>
                )}
              </div>

              <button
                type="button"
                className={styles.monogram}
                onClick={wave}
                aria-label="Shower petals"
              >
                <span className={styles.monoRing} />
                <span className={styles.monoText}>{ctx.initials}</span>
              </button>
              <p className={styles.monoNote} aria-live="polite">
                {showers === 0 ? ctx.theme.copy.showerHint : `${showers} ${showers === 1 ? 'shower' : 'showers'} of petals`}
              </p>

              <h1 className={styles.names} style={{ '--ns': size } as CSSProperties} aria-label={ctx.title}>
                <span aria-hidden>{ctx.title}</span>
              </h1>

              <div className={styles.invite}>
                <p className={styles.inviteSmall}>We cordially invite you to the</p>
                <p className={styles.inviteBig}>{ceremonyName(invitation)}</p>
                <p className={styles.inviteDate}>{dates}</p>
                <p className={styles.inviteVenue}>{invitation.venueName}</p>
                {first?.time ? <p className={styles.inviteVenue}>{formatTime(first.time)}</p> : null}
              </div>

              {ctx.photos[0] ? (
                <div className={styles.portrait}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ctx.photos[0]} alt="" draggable={false} />
                </div>
              ) : null}

              <div className={styles.terrace} />
            </div>

            <div className={styles.cue} aria-hidden>
              <span className={styles.cueText}>Scroll</span>
              <span className={styles.cueArrow} />
            </div>
          </div>
        </div>
        <div ref={sentinel} className={baseStyles.sentinel} aria-hidden />

        <section className={styles.counting} aria-label="Countdown">
          <p className={styles.kicker} data-reveal="up">
            Counting down
          </p>
          <div data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
            <PlaqueCountdown ctx={ctx} />
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
        </section>

        <Windows entries={ctx.entries} lit={ctx.lit} onToggle={ctx.toggleToken} />
        {invitation.dressCode ? (
          <p className={styles.dress} data-reveal="up">
            Dress code <span>{invitation.dressCode}</span>
          </p>
        ) : null}

        <div className={baseStyles.wrap} data-variant="arch">
          <VenueBlock ctx={ctx} variant="arch" />
        </div>
        <MomentsBlock ctx={ctx} variant="arch" />
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
