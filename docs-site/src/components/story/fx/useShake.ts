'use client';

import { useEffect, useRef, useState } from 'react';
import { createShakeDetector, shakeSupport, type ShakeSupport } from '@/lib/experience/shake';

export type ShakeState = ShakeSupport;

function buzz(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported: silently skip
  }
}

/**
 * Calls `onShake` each time the phone is shaken, while `enabled`. It never asks for
 * a permission (see `shakeSupport`): where shaking needs one, the state is
 * 'unsupported' and nothing is listened for.
 */
export function useShake(onShake: () => void, enabled: boolean) {
  const [state, setState] = useState<ShakeState>('unsupported');
  const callback = useRef(onShake);

  useEffect(() => {
    callback.current = onShake;
  }, [onShake]);

  useEffect(() => {
    setState(shakeSupport());
  }, []);

  useEffect(() => {
    if (!enabled || state !== 'ready') return undefined;
    const detect = createShakeDetector();
    const onMotion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a) return;
      if (detect({ x: a.x, y: a.y, z: a.z }, performance.now())) {
        buzz(25);
        callback.current();
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [enabled, state]);

  return { state };
}
