'use client';

import type { CSSProperties } from 'react';
import { formatDay, formatTime, type InvitationEvent } from '@/lib/invitation';
import { eventKind } from '@/lib/invitationTheme';
import { EventIcon } from '../../ornaments';
import { useInvitationTheme } from '../../theme';
import styles from './garden.module.css';

type Props = {
  entries: InvitationEvent[];
  lit: ReadonlySet<number>;
  onToggle: (index: number, element: HTMLElement) => void;
};

/**
 * The events as a deck of cards on a lawn. Each shows its name and a small picture; turn it over
 * and the back gives the day, the time and the place. Turning every card is the small game.
 */
export function FlipCards({ entries, lit, onToggle }: Props) {
  const { copy } = useInvitationTheme();
  const total = entries.length;
  const done = lit.size >= total && total > 0;

  return (
    <section className={styles.deckSection} aria-labelledby="cards-title">
      <p className={styles.script} id="cards-title" data-reveal="up">
        {total > 1 ? 'The celebrations' : 'The day'}
      </p>
      <p className={styles.deckIntro} data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
        {done ? copy.tokenDone : copy.tokenIntro}
      </p>
      <p className={styles.deckCount} aria-live="polite" data-reveal="up" style={{ '--i': 2 } as CSSProperties}>
        <span className={styles.deckNumber}>{lit.size}</span> of {total} {total === 1 ? copy.token : copy.tokens}
      </p>

      <ul className={styles.deck}>
        {entries.map((event, index) => {
          const flipped = lit.has(index);
          return (
            <li
              key={`${event.title}-${event.date}-${event.time}`}
              className={styles.flip}
              data-flipped={flipped ? '' : undefined}
              data-reveal="up"
              style={{ '--i': Math.min(index, 3) } as CSSProperties}
            >
              <div className={styles.scene}>
                <span className={styles.flipInner}>
                  <span className={`${styles.face} ${styles.front}`}>
                    <span className={styles.cornerLeaf} aria-hidden />
                    <EventIcon kind={eventKind(event.title)} className={styles.faceIcon} />
                    <span className={styles.faceTitle}>{event.title}</span>
                    <span className={styles.faceHint}>Tap to turn</span>
                  </span>
                  <span className={`${styles.face} ${styles.back}`}>
                    <span className={styles.backDay}>{formatDay(event.date, 'weekday')}</span>
                    <span className={styles.backDate}>{formatDay(event.date, 'dayNumber')}</span>
                    <span className={styles.backMonth}>{formatDay(event.date, 'monthShort')}</span>
                    {event.time ? <span className={styles.backTime}>{formatTime(event.time)}</span> : null}
                    {event.venue ? <span className={styles.backPlace}>{event.venue}</span> : null}
                  </span>
                </span>
                {/* The button is laid over the card, not around it: a button flattens a 3D turn. */}
                <button
                  type="button"
                  className={styles.flipHit}
                  aria-pressed={flipped}
                  aria-label={`${flipped ? copy.tokenUndo : copy.tokenDo} the ${copy.token} for ${event.title}`}
                  onClick={(click) => onToggle(index, click.currentTarget)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
