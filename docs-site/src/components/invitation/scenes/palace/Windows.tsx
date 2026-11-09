'use client';

import type { CSSProperties } from 'react';
import { formatDay, formatTime, type InvitationEvent } from '@/lib/invitation';
import { eventKind } from '@/lib/invitationTheme';
import { EventIcon } from '../../ornaments';
import { useInvitationTheme } from '../../theme';
import styles from './palace.module.css';

type Props = {
  entries: InvitationEvent[];
  lit: ReadonlySet<number>;
  onToggle: (index: number, element: HTMLElement) => void;
};

/**
 * The events as the arched windows of a palace wall, side by side on a rail you swipe along. Each
 * window is shuttered and has a brass plate with its name; tap it and the shutters swing open on
 * the time and the place, with a lamp lit inside. Opening them all is the small game.
 */
export function Windows({ entries, lit, onToggle }: Props) {
  const { copy } = useInvitationTheme();
  const total = entries.length;
  const done = lit.size >= total && total > 0;

  return (
    <section className={styles.windows} aria-labelledby="windows-title">
      <p className={styles.kicker} data-reveal="up">
        {total > 1 ? 'The celebrations' : 'The day'}
      </p>
      <h2 className={styles.windowsTitle} id="windows-title" data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
        {done ? copy.tokenDone : copy.tokenIntro}
      </h2>
      <p className={styles.windowsCount} aria-live="polite" data-reveal="up" style={{ '--i': 2 } as CSSProperties}>
        <span className={styles.windowsNumber}>{lit.size}</span> of {total} {total === 1 ? copy.token : copy.tokens}
      </p>

      <ul className={styles.rail}>
        {entries.map((event, index) => {
          const isOpen = lit.has(index);
          return (
            <li
              key={`${event.title}-${event.date}-${event.time}`}
              className={styles.window}
              data-open={isOpen ? '' : undefined}
              data-reveal="up"
              style={{ '--i': Math.min(index, 3) } as CSSProperties}
            >
              <button
                type="button"
                className={styles.windowButton}
                aria-pressed={isOpen}
                aria-label={`${isOpen ? copy.tokenUndo : copy.tokenDo} the ${copy.token} for ${event.title}`}
                onClick={(click) => onToggle(index, click.currentTarget)}
              >
                <span className={styles.arch}>
                  <span className={styles.glass}>
                    <EventIcon kind={eventKind(event.title)} className={styles.glassIcon} />
                    <span className={styles.glassDay}>{formatDay(event.date, 'weekday')}</span>
                    <span className={styles.glassDate}>{formatDay(event.date, 'short')}</span>
                    {event.time ? <span className={styles.glassTime}>{formatTime(event.time)}</span> : null}
                    {event.venue ? <span className={styles.glassPlace}>{event.venue}</span> : null}
                  </span>
                  <span className={`${styles.shutter} ${styles.shutterLeft}`} />
                  <span className={`${styles.shutter} ${styles.shutterRight}`} />
                </span>
                <span className={styles.sill} />
                <span className={styles.plate}>
                  <span className={styles.plateNumber}>{formatDay(event.date, 'dayNumber')}</span>
                  <span className={styles.plateTitle}>{event.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
