'use client';

import { useState, type CSSProperties } from 'react';
import { OCCASION_INFO, formatDay, formatTime } from '@/lib/invitation';
import { eventKind } from '@/lib/invitationTheme';
import { useCountdown } from '../../Countdown';
import { EventIcon } from '../../ornaments';
import { useScene } from '../../scroll';
import { FooterBlock, MomentsBlock, ReplyBlock, VenueBlock } from '../Closing';
import type { SceneContext } from '../context';
import { dateSpan } from '../dates';
import baseStyles from '../../invitation.module.css';
import { BaraatGate } from './BaraatGate';
import { Garland } from './BaraatArt';
import styles from './baraat.module.css';

/** The days, hours, minutes and seconds as four number plates, like the ones on a wedding car. */
function PlateCountdown({ ctx }: { ctx: SceneContext }) {
  const countdown = useCountdown(ctx.invitation);
  if (!countdown) return null;
  if (countdown.over) {
    return <p className={styles.over}>{countdown.today ? 'It is today' : 'Thank you for celebrating with us'}</p>;
  }
  const { parts } = countdown;
  const cells: Array<[string, number | null]> = [
    ['Days', parts?.days ?? null],
    ['Hours', parts?.hours ?? null],
    ['Mins', parts?.minutes ?? null],
    ['Secs', parts?.seconds ?? null],
  ];
  return (
    <div className={styles.plates} role="timer" aria-label="Time until the celebration begins">
      {cells.map(([label, value]) => (
        <div key={label} className={styles.plate}>
          <span key={label === 'Secs' ? label : (value ?? 'x')} className={styles.plateNumber}>
            {value === null ? '--' : String(value).padStart(2, '0')}
          </span>
          <span className={styles.plateLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

type StopProps = {
  index: number;
  event: SceneContext['entries'][number];
  hung: boolean;
  onHonk: (index: number, element: HTMLElement) => void;
  copy: SceneContext['theme']['copy'];
};

/** One stop on the road. It comes into focus as you reach it; tap it to honk and hang a garland. */
function Stop({ index, event, hung, onHonk, copy }: StopProps) {
  const ref = useScene<HTMLLIElement>('pass');
  return (
    <li ref={ref} className={styles.stop} data-hung={hung ? '' : undefined}>
      <div className={styles.board}>
        <p className={styles.stopNumber}>Stop {index + 1}</p>
        <EventIcon kind={eventKind(event.title)} className={styles.stopIcon} />
        <h3 className={styles.stopTitle}>{event.title}</h3>
        <p className={styles.stopWhen}>
          {formatDay(event.date, 'weekday')}, {formatDay(event.date, 'short')}
        </p>
        {event.time ? <p className={styles.stopTime}>{formatTime(event.time)}</p> : null}
        {event.venue ? <p className={styles.stopPlace}>{event.venue}</p> : null}
        <button
          type="button"
          className={styles.honk}
          aria-pressed={hung}
          aria-label={`${hung ? copy.tokenUndo : copy.tokenDo} a ${copy.token} for ${event.title}`}
          onClick={(click) => onHonk(index, click.currentTarget)}
        >
          {hung ? 'Garland hung' : 'Honk and hang a garland'}
        </button>
      </div>
    </li>
  );
}

/**
 * The baraat road. Tap to honk the horn on a photograph of the couple's car and the page arrives
 * over the same photograph, out of focus. Each celebration is a stop on the road you scroll down;
 * honk at a stop to hang a garland over the car, and the road ends at the venue under a marigold
 * toran.
 */
export function BaraatScene({ ctx }: { ctx: SceneContext }) {
  const { invitation, opened, gateGone, lit, hostLine } = ctx;
  const info = OCCASION_INFO[invitation.occasion];
  const [honks, setHonks] = useState(0);

  const honk = (index: number, element: HTMLElement) => {
    if (!lit.has(index)) setHonks((count) => count + 1);
    ctx.toggleToken(index, element);
  };

  const first = ctx.entries[0];
  const last = ctx.entries[ctx.entries.length - 1];

  return (
    <div className={styles.scene}>
      <div className={styles.backdrop} aria-hidden />

      {gateGone ? null : <BaraatGate ctx={ctx} />}

      <main className={styles.main} aria-hidden={!opened} inert={!opened}>
        <div className={styles.strip}>
          <section className={styles.hero}>
            <p className={styles.saveTitle}>
              Save
              <br />
              the Date
            </p>
            <figure className={styles.print} aria-hidden>
              <div className={styles.printPhoto} />
              <svg className={styles.strands} viewBox="0 0 300 120" preserveAspectRatio="none" focusable="false">
                {Array.from({ length: Math.min(lit.size, 5) }, (_, strand) => (
                  <Garland
                    key={strand}
                    className={styles.hung}
                    from={[-4, 4 + strand * 9]}
                    to={[304, 4 + strand * 9]}
                    sag={20 + strand * 4}
                    count={22}
                  />
                ))}
              </svg>
              {honks > 0 ? (
                <span key={honks} className={styles.bubble}>
                  Pom pom
                </span>
              ) : null}
            </figure>
            <p className={styles.span}>{dateSpan(first?.date ?? invitation.date, last?.date ?? invitation.date)}</p>
            <p className={styles.forLine}>For the {info.noun} celebrations of</p>
            <div className={styles.banner}>
              <h1 className={styles.names} aria-label={ctx.title}>
                <span aria-hidden>{invitation.nameOne}</span>
                {invitation.nameTwo ? (
                  <>
                    <span className={styles.amp} aria-hidden>
                      &amp;
                    </span>
                    <span aria-hidden>{invitation.nameTwo}</span>
                  </>
                ) : null}
              </h1>
            </div>
            {invitation.tagline ? <p className={styles.tagline}>{invitation.tagline}</p> : null}
            <p className={styles.host}>{hostLine}</p>
            <p className={styles.cue}>Scroll to start the baraat</p>
          </section>

          <section className={styles.counting} aria-label="Countdown">
            <p className={styles.kicker} data-reveal="up">
              Counting down
            </p>
            <div data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
              <PlateCountdown ctx={ctx} />
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

          <section className={styles.roadSection} aria-labelledby="road-title">
            <p className={styles.kicker} data-reveal="up">
              {ctx.entries.length > 1 ? 'The celebrations' : 'The day'}
            </p>
            <h2 className={styles.roadTitle} id="road-title" data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
              {lit.size >= ctx.entries.length && lit.size > 0 ? ctx.theme.copy.tokenDone : ctx.theme.copy.tokenIntro}
            </h2>
            <p className={styles.roadCount} aria-live="polite" data-reveal="up" style={{ '--i': 2 } as CSSProperties}>
              <span className={styles.roadNumber}>{lit.size}</span> of {ctx.entries.length}{' '}
              {ctx.entries.length === 1 ? ctx.theme.copy.token : ctx.theme.copy.tokens}
            </p>
            <ol className={styles.road}>
              {ctx.entries.map((event, index) => (
                <Stop
                  key={`${event.title}-${event.date}-${event.time}`}
                  index={index}
                  event={event}
                  hung={lit.has(index)}
                  onHonk={honk}
                  copy={ctx.theme.copy}
                />
              ))}
            </ol>
          </section>
        </div>

        <div className={styles.after}>
          <div className={styles.destination}>
            <svg className={styles.toran} viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden focusable="false">
              <Garland from={[0, 8]} to={[400, 8]} sag={70} count={26} />
            </svg>
            <p className={styles.arrived}>You have arrived</p>
            <p className={styles.venueTitle}>{invitation.venueName}</p>
          </div>
          <div className={baseStyles.wrap}>
            <VenueBlock ctx={ctx} variant="folk" />
          </div>
          <MomentsBlock ctx={ctx} variant="folk" />
          <ReplyBlock ctx={ctx} />
          <FooterBlock ctx={ctx} />
        </div>
      </main>
    </div>
  );
}
