'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { isSfxMuted, playStar, setSfxMuted } from '@/lib/experience/sfx';

type Popup = { id: number; x: number; y: number; text: string; bonus: boolean };

type JoyValue = {
  stars: number;
  max: number;
  /** Idempotent per key, so replaying a scene cannot farm stars. */
  award: (key: string, n?: number, at?: { x: number; y: number }) => void;
  muted: boolean;
  toggleMute: () => void;
};

const JoyContext = createContext<JoyValue | null>(null);

const BONUS_CHANCE = 0.12;
const POPUP_MS = 1100;

export function JoyProvider({ max, children }: { max: number; children: ReactNode }) {
  const [stars, setStars] = useState(0);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [muted, setMuted] = useState(false);
  const awarded = useRef<Set<string>>(new Set());
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMuted(isSfxMuted());
    const pending = timers.current;
    return () => {
      for (const t of pending) window.clearTimeout(t);
    };
  }, []);

  const award = useCallback((key: string, n = 1, at?: { x: number; y: number }) => {
    if (awarded.current.has(key)) return;
    awarded.current.add(key);

    // A small chance of a surprise extra star: a variable reward, never a loss.
    const bonus = Math.random() < BONUS_CHANCE;
    const gained = n + (bonus ? 1 : 0);
    setStars((s) => s + gained);
    playStar(bonus);

    const id = nextId.current++;
    const popup: Popup = {
      id,
      x: at?.x ?? window.innerWidth / 2,
      y: at?.y ?? window.innerHeight * 0.42,
      text: bonus ? `Lucky! +${gained}` : `+${gained}`,
      bonus,
    };
    setPopups((list) => [...list, popup]);
    timers.current.push(
      window.setTimeout(() => setPopups((list) => list.filter((p) => p.id !== id)), POPUP_MS),
    );
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      setSfxMuted(!current);
      return !current;
    });
  }, []);

  const value = useMemo(
    () => ({ stars, max, award, muted, toggleMute }),
    [stars, max, award, muted, toggleMute],
  );

  return (
    <JoyContext.Provider value={value}>
      {children}
      <div className="joy-popups" aria-hidden>
        {popups.map((p) => (
          <span
            key={p.id}
            className={`joy-popup${p.bonus ? ' is-bonus' : ''}`}
            style={{ left: p.x, top: p.y }}
          >
            {p.text} <i>★</i>
          </span>
        ))}
      </div>
    </JoyContext.Provider>
  );
}

const NOOP: JoyValue = {
  stars: 0,
  max: 1,
  award: () => undefined,
  muted: false,
  toggleMute: () => undefined,
};

/** Safe outside a provider (classic cards, tests): awards simply do nothing. */
export function useJoy(): JoyValue {
  return useContext(JoyContext) ?? NOOP;
}

export function JoyHud() {
  const { stars, max, muted, toggleMute } = useJoy();
  const pct = Math.min(100, Math.round((stars / max) * 100));

  return (
    <div className="joy-hud">
      <button
        type="button"
        className="joy-hud__mute"
        onClick={toggleMute}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        aria-pressed={muted}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
          {muted ? (
            <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </button>
      <div className="joy-hud__stars" role="status" aria-label={`${stars} of ${max} stars`}>
        <span key={stars} className="joy-hud__count">
          <i>★</i> {stars}
        </span>
        <span className="joy-hud__bar">
          <span style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}
