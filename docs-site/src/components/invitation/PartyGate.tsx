'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { BalloonArt } from '@/components/story/fx/BalloonArt';
import { haptic } from './scroll';
import { Bunting } from './ornaments';
import { useScrollLock } from './scenes/useOpenGesture';
import { useInvitationTheme } from './theme';
import type { BurstKind } from './bursts';
import styles from './invitation.module.css';

type Props = {
  title: string;
  initials: string;
  /** Called the moment the entrance starts to open, with the point it opens from. */
  onOpen: (x: number, y: number) => void;
  /** Called once the entrance has left the screen. */
  onGone: () => void;
  burst: (x: number, y: number, kind?: BurstKind, scale?: number) => void;
};

const OPEN_MS = 1250;

const BALLOONS = [
  { x: 15, y: 38, size: 70, tone: 1, delay: 0 },
  { x: 82, y: 36, size: 78, tone: 2, delay: 0.7 },
  { x: 22, y: 76, size: 62, tone: 3, delay: 1.3 },
  { x: 78, y: 74, size: 66, tone: 4, delay: 0.4 },
] as const;

/**
 * A bunch of balloons floating in the middle of the screen. Pop any of them for confetti; pop the
 * big one with the initials on it and the whole screen lifts away like a curtain.
 */
export function PartyGate({ title, initials, onOpen, onGone, burst }: Props) {
  const { palette, copy } = useInvitationTheme();
  const [popped, setPopped] = useState<number[]>([]);
  const [lifting, setLifting] = useState(false);
  const finished = useRef(false);
  useScrollLock();

  const pop = (index: number, element: HTMLElement) => {
    if (popped.includes(index) || finished.current) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setPopped((current) => [...current, index]);
    if (index !== 0) {
      burst(x, y, 'confetti', 0.45);
      haptic(8);
      return;
    }
    finished.current = true;
    burst(x, y, 'confetti', 1.7);
    setLifting(true);
    onOpen(x, y);
    window.setTimeout(onGone, OPEN_MS);
  };

  return (
    <div className={`${styles.gate} ${styles.partyGate}`} data-lift={lifting ? '' : undefined}>
      <Bunting className={styles.gateBunting} />
      <div className={styles.gateText}>
        <p className={styles.gateEyebrow}>{copy.gateEyebrow}</p>
        <p className={styles.gateNames}>{title}</p>
      </div>
      {BALLOONS.map((b, i) => (
        <button
          key={i}
          type="button"
          className={styles.miniBalloon}
          data-popped={popped.includes(i + 1) ? '' : undefined}
          aria-label="Pop a balloon"
          style={
            {
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size * 1.75,
              animationDelay: `${b.delay}s`,
            } as CSSProperties
          }
          onClick={(event) => pop(i + 1, event.currentTarget)}
        >
          <BalloonArt color={palette.confetti[b.tone % palette.confetti.length]!} />
        </button>
      ))}
      <button
        type="button"
        className={styles.bigBalloon}
        data-popped={popped.includes(0) ? '' : undefined}
        aria-label="Open the invitation"
        onClick={(event) => pop(0, event.currentTarget)}
      >
        <BalloonArt color={palette.primary} />
        <span className={styles.bigBalloonText}>{initials}</span>
      </button>
      <p className={styles.partyHint}>{copy.gateHint}</p>
    </div>
  );
}
