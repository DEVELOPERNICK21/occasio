'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Lottie } from 'lottie-react';
import {
  effectForTemplateType,
  type ScreenEffectId,
} from '@/lib/occasionEffects';

type Props = {
  templateType: string;
  /** Restart by remounting. */
  replayKey?: number;
  /** Wait for letter reveal before celebration (ms). */
  startDelayMs?: number;
};

const REPLAY_GAP_MS = 4000;
const DEFAULT_START_DELAY_MS = 2600;
const CACHE: Partial<Record<ScreenEffectId, object>> = {};

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

const HEART_COLORS = ['#E8615D', '#F072A0', '#FF8A9A', '#C94E4A', '#FF6B8A'];

type HeartParticle = {
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  sway: number;
};

function seedHearts(count: number, seed: number): HeartParticle[] {
  const out: HeartParticle[] = [];
  let s = seed + 1;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i += 1) {
    out.push({
      left: 6 + rand() * 88,
      size: 14 + rand() * 18,
      delay: rand() * 2.4,
      duration: 3.2 + rand() * 2.4,
      color: HEART_COLORS[i % HEART_COLORS.length]!,
      sway: 8 + rand() * 16,
    });
  }
  return out;
}

async function loadEffect(id: ScreenEffectId): Promise<object> {
  const cached = CACHE[id];
  if (cached) return cached;
  const res = await fetch(`/lottie/${id}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load Lottie effect: ${id}`);
  }
  const json = (await res.json()) as object;
  CACHE[id] = json;
  return json;
}

function soundExt(effectId: ScreenEffectId): 'mp3' | 'wav' {
  if (
    effectId === 'balloons' ||
    effectId === 'hearts' ||
    effectId === 'sparkles'
  ) {
    return 'mp3';
  }
  return 'wav';
}

function playWebSound(effectId: ScreenEffectId): () => void {
  const audio = new Audio(`/sounds/${effectId}.${soundExt(effectId)}`);
  const isMusic =
    effectId === 'balloons' ||
    effectId === 'hearts' ||
    effectId === 'sparkles';
  audio.volume = isMusic ? 0.45 : 0.7;
  void audio.play().catch(() => {
    // Autoplay may be blocked until a user gesture — ignore.
  });
  return () => {
    audio.pause();
    audio.src = '';
  };
}

function HeartShower({ replayKey }: { replayKey: number }) {
  const hearts = useMemo(() => seedHearts(14, replayKey), [replayKey]);
  return (
    <div className="wish-heart-shower" aria-hidden>
      {hearts.map((h, i) => (
        <span
          key={`${replayKey}-${i}`}
          className="wish-heart-shower__item"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            ['--heart-sway' as string]: `${h.sway}px`,
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <defs>
              <radialGradient id={`wh-${replayKey}-${i}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="45%" stopColor={h.color} />
                <stop offset="100%" stopColor={h.color} />
              </radialGradient>
            </defs>
            <path d={HEART_PATH} fill={`url(#wh-${replayKey}-${i})`} />
          </svg>
        </span>
      ))}
    </div>
  );
}

/** Celebration visuals + soft occasion chime after letter reveal. */
export function OccasionStickerShower({
  templateType,
  replayKey = 0,
  startDelayMs = DEFAULT_START_DELAY_MS,
}: Props) {
  const effectId = useMemo(
    () => effectForTemplateType(templateType),
    [templateType],
  );
  const [src, setSrc] = useState<object | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [ready, setReady] = useState(startDelayMs <= 0);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useSvgHearts = effectId === 'hearts';

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setCycleKey(0);
    if (gapTimer.current) {
      clearTimeout(gapTimer.current);
      gapTimer.current = null;
    }
    if (startTimer.current) {
      clearTimeout(startTimer.current);
      startTimer.current = null;
    }
    if (startDelayMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    startTimer.current = setTimeout(() => setReady(true), startDelayMs);
    return () => {
      if (startTimer.current) clearTimeout(startTimer.current);
    };
  }, [effectId, replayKey, startDelayMs]);

  useEffect(() => {
    if (useSvgHearts) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setSrc(null);
    void loadEffect(effectId)
      .then((data) => {
        if (!cancelled) setSrc(data);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [effectId, replayKey, cycleKey, useSvgHearts]);

  useEffect(() => {
    if (!ready || reduceMotion) return;
    return playWebSound(effectId);
  }, [effectId, ready, reduceMotion, replayKey]);

  useEffect(() => {
    if (!useSvgHearts || !ready || reduceMotion) return;
    gapTimer.current = setTimeout(() => {
      setCycleKey((k) => k + 1);
    }, 7200);
    return () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
    };
  }, [useSvgHearts, ready, reduceMotion, replayKey, cycleKey]);

  useEffect(() => {
    return () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
      if (startTimer.current) clearTimeout(startTimer.current);
    };
  }, []);

  if (reduceMotion || !ready) {
    return null;
  }

  if (useSvgHearts) {
    return (
      <div className="wish-screen-effect wish-screen-effect--hearts" aria-hidden>
        <HeartShower replayKey={replayKey + cycleKey} />
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <div
      key={`${effectId}-${replayKey}-${cycleKey}`}
      className="wish-screen-effect"
      aria-hidden
    >
      <Lottie
        src={src}
        loop={false}
        autoplay
        className="wish-screen-effect__lottie"
        subscriptions={{
          complete: () => {
            if (gapTimer.current) clearTimeout(gapTimer.current);
            gapTimer.current = setTimeout(() => {
              setCycleKey((k) => k + 1);
            }, REPLAY_GAP_MS);
          },
        }}
      />
    </div>
  );
}
