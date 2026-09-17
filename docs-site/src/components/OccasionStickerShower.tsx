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
  }, [effectId, replayKey, cycleKey]);

  useEffect(() => {
    if (!ready || reduceMotion) return;
    return playWebSound(effectId);
  }, [effectId, ready, reduceMotion, replayKey]);

  useEffect(() => {
    return () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
      if (startTimer.current) clearTimeout(startTimer.current);
    };
  }, []);

  if (reduceMotion || !ready || !src) {
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
