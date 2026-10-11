'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createShakeDetector,
  requestShakePermission,
  shakeSupport,
  type ShakeSupport,
} from '@/lib/experience/shake';

export type ShakeState = ShakeSupport | 'denied';

function buzz(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported: silently skip
  }
}

/**
 * Calls `onShake` each time the phone is shaken, while `enabled`. iPhones need
 * `enable()` called from a tap first; everything else is ready straight away.
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

  const enable = useCallback(async () => {
    const granted = await requestShakePermission();
    setState(granted ? 'ready' : 'denied');
    return granted;
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

  return { state, enable };
}
