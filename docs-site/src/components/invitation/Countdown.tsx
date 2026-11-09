'use client';

import { useEffect, useState } from 'react';
import { daysUntil, startsAt, type Invitation } from '@/lib/invitation';
import styles from './invitation.module.css';

const SECOND = 1000;

/** The days, hours, minutes and seconds left, from a number of milliseconds. */
export function splitDuration(milliseconds: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor(milliseconds / SECOND));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function Tile({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? '--' : String(value).padStart(2, '0');
  return (
    <div className={styles.tile}>
      <div className={styles.tileFace}>
        {/* A new key makes the number flip in each time it changes. Seconds change every second, so
            they just change: a flip that often leaves the digit half gone most of the time. */}
        <span key={label === 'Seconds' ? label : text} className={styles.tileNumber}>
          {text}
        </span>
        <span className={styles.tileSeam} aria-hidden />
      </div>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
}

/** The time left to the first event, ticking each second. Null until the page is on the phone. */
export function useCountdown(invitation: Pick<Invitation, 'date' | 'events'>) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), SECOND);
    return () => window.clearInterval(timer);
  }, []);

  const start = startsAt(invitation);
  if (!start) return null;
  const left = now === null ? null : start.getTime() - now;
  if (left !== null && left <= 0) {
    return { over: true as const, today: daysUntil(invitation.date, new Date(now ?? 0)) === 0, parts: null };
  }
  return { over: false as const, today: false, parts: left === null ? null : splitDuration(left) };
}

/**
 * A live countdown to the first event. It starts empty and fills in on the phone, so the server
 * never guesses the time, and it ticks once a second only while the page is open.
 */
export function Countdown({ invitation }: { invitation: Pick<Invitation, 'date' | 'events'> }) {
  const countdown = useCountdown(invitation);
  if (!countdown) return null;

  if (countdown.over) {
    return <p className={styles.countdownDone}>{countdown.today ? 'It is today' : 'Thank you for celebrating with us'}</p>;
  }

  const { parts } = countdown;
  return (
    <div className={styles.countdownTiles} role="timer" aria-label="Time until the celebration begins">
      <Tile value={parts?.days ?? null} label="Days" />
      <Tile value={parts?.hours ?? null} label="Hours" />
      <Tile value={parts?.minutes ?? null} label="Minutes" />
      <Tile value={parts?.seconds ?? null} label="Seconds" />
    </div>
  );
}
