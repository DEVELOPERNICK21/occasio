'use client';

import type { CSSProperties, MouseEvent, RefObject } from 'react';
import { formatDay, type Invitation } from '@/lib/invitation';
import { Bunting, Sunburst } from './ornaments';
import styles from './invitation.module.css';

type Props = {
  stageRef: RefObject<HTMLDivElement | null>;
  invitation: Invitation;
  photo: string | undefined;
  initials: string;
  title: string;
  hostLine: string;
  /** The line between the host line and the names: "to celebrate". */
  lead: string;
  /** What the portrait does when tapped, for people who cannot see it. */
  tapLabel: string;
  /** The small note under the portrait: the hint, then the running count. */
  note: string;
  onTap: (event: MouseEvent<HTMLElement>) => void;
};

const rise = (order: number) => ({ '--r': order }) as CSSProperties;

/**
 * The party hero: one screen that stays put while the scroll assembles it. The portrait grows, the
 * names arrive and the day settles, over a sunburst, under a string of bunting.
 */
export function Hero({ stageRef, invitation, photo, initials, title, hostLine, lead, tapLabel, note, onTap }: Props) {
  return (
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.stageInner}>
        <div className={styles.backdrop} aria-hidden>
          <Sunburst className={styles.mandala} />
        </div>
        <Bunting className={styles.topper} />

        <div className={styles.wrap}>
          <div className={styles.lead}>
            {hostLine ? (
              <p className={`${styles.rise} ${styles.eyebrow}`} style={rise(2)}>
                {hostLine}
              </p>
            ) : null}
            <p className={`${styles.rise} ${styles.leadLine}`} style={rise(3)}>
              {lead}
            </p>
          </div>

          <button type="button" className={`${styles.frame} ${styles.rise}`} style={rise(4)} onClick={onTap} aria-label={tapLabel}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" draggable={false} />
            ) : (
              <span className={styles.monogram}>{initials}</span>
            )}
            <span className={styles.frameRing} aria-hidden />
          </button>
          <p className={`${styles.rise} ${styles.showerNote}`} style={rise(5)} aria-live="polite">
            {note}
          </p>

          <h1 className={`${styles.rise} ${styles.names}`} style={rise(6)} aria-label={title}>
            <span className={styles.nameOne} aria-hidden>
              {invitation.nameOne}
            </span>
          </h1>
          {invitation.tagline ? (
            <p className={`${styles.rise} ${styles.tagline}`} style={rise(7)}>
              {invitation.tagline}
            </p>
          ) : null}

          <div className={styles.details}>
            <p className={`${styles.rise} ${styles.when}`} style={rise(8)}>
              {formatDay(invitation.date, 'weekday')}, {formatDay(invitation.date)}
            </p>
            <p className={styles.where}>{invitation.venueName}</p>
          </div>
        </div>

        <div className={styles.cue} aria-hidden>
          <span className={styles.cueText}>Scroll</span>
          <span className={styles.cueArrow} />
        </div>
      </div>
    </div>
  );
}
