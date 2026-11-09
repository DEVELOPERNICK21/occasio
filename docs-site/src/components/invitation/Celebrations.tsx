'use client';

import type { CSSProperties } from 'react';
import {
  calendarEntries,
  formatDay,
  formatTime,
  type Invitation,
} from '@/lib/invitation';
import { eventKind } from '@/lib/invitationTheme';
import { Divider, EventIcon, StarToken } from './ornaments';
import { useScene } from './scroll';
import { useInvitationTheme } from './theme';
import styles from './invitation.module.css';

type Props = {
  invitation: Invitation;
  /** Which events have their lamp lit (or star collected). */
  lit: ReadonlySet<number>;
  onToggle: (index: number, element: HTMLElement) => void;
};

/**
 * The events down a golden thread that draws itself as you scroll. Each has a lamp (or a star) to
 * light: a small game that fills the guest pass and rewards finishing with a glow. Nothing here is
 * needed to RSVP.
 */
export function Celebrations({ invitation, lit, onToggle }: Props) {
  const { copy } = useInvitationTheme();
  const list = useScene<HTMLDivElement>('pass');
  const entries = calendarEntries(invitation);
  const total = entries.length;
  const done = lit.size >= total && total > 0;

  return (
    <section
      className={`${styles.section} ${styles.celebrations}`}
      aria-labelledby="celebrations-title"
    >
      <Divider className={styles.divider} />
      <h2 className={styles.heading} id="celebrations-title" data-reveal="up">
        {total > 1 ? 'The plan' : 'The day'}
      </h2>
      <p
        className={styles.tokenIntro}
        data-reveal="up"
        style={{ '--i': 1 } as CSSProperties}
      >
        {done ? copy.tokenDone : copy.tokenIntro}
      </p>
      <p
        className={styles.tokenCount}
        data-reveal="up"
        style={{ '--i': 2 } as CSSProperties}
        aria-live="polite"
      >
        <span className={styles.tokenCountNumber}>{lit.size}</span> of {total}{' '}
        {total === 1 ? copy.token : copy.tokens}
      </p>

      <div ref={list} className={styles.timelineWrap}>
        <span className={styles.thread} aria-hidden>
          <span className={styles.threadFill} />
          <span className={styles.threadTip} />
        </span>
        <ol className={styles.timeline}>
          {entries.map((event, index) => {
            const isLit = lit.has(index);
            const kind = eventKind(event.title);
            return (
              <li
                key={`${event.title}-${event.date}-${event.time}`}
                className={styles.event}
                data-reveal={index % 2 === 0 ? 'left' : 'right'}
                data-lit={isLit ? '' : undefined}
                style={{ '--i': Math.min(index, 3) } as CSSProperties}
              >
                <div className={styles.eventDay}>
                  <span className={styles.eventNumber}>
                    {formatDay(event.date, 'dayNumber')}
                  </span>
                  <span className={styles.eventMonth}>
                    {formatDay(event.date, 'monthShort')}
                  </span>
                </div>
                <div className={styles.eventBody}>
                  <EventIcon kind={kind} className={styles.eventIcon} />
                  <div className={styles.eventText}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.eventMeta}>
                      {[
                        formatDay(event.date, 'weekday'),
                        formatTime(event.time),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {event.venue ? (
                      <p className={styles.eventPlace}>{event.venue}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.tokenButton}
                  aria-pressed={isLit}
                  aria-label={`${isLit ? copy.tokenUndo : copy.tokenDo} the ${copy.token} for ${event.title}`}
                  onClick={(click) => onToggle(index, click.currentTarget)}
                >
                  <StarToken className={styles.tokenArt} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {invitation.dressCode ? (
        <p className={styles.dress} data-reveal="up">
          Dress code: {invitation.dressCode}
        </p>
      ) : null}
    </section>
  );
}
