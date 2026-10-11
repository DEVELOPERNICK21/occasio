/**
 * Phone shake detection for "shake it open". Pure so it can be tested without a
 * device: feed it accelerometer samples (with gravity) and it says when a
 * deliberate shake happens. Walking or setting the phone down changes the
 * reading far less than a shake does.
 */

export type MotionSample = {
  x: number | null;
  y: number | null;
  z: number | null;
};

export type ShakeOptions = {
  /** Summed change across the three axes between two samples (m/s²). */
  threshold?: number;
  /** Quiet time after a shake before the next one can count (ms). */
  cooldownMs?: number;
};

export const SHAKE_THRESHOLD = 18;
export const SHAKE_COOLDOWN_MS = 650;

export function createShakeDetector(
  options: ShakeOptions = {},
): (sample: MotionSample, now: number) => boolean {
  const threshold = options.threshold ?? SHAKE_THRESHOLD;
  const cooldownMs = options.cooldownMs ?? SHAKE_COOLDOWN_MS;
  let last: { x: number; y: number; z: number } | null = null;
  let lastShakeAt = Number.NEGATIVE_INFINITY;

  return (sample, now) => {
    const { x, y, z } = sample;
    if (x === null || y === null || z === null) return false;

    const previous = last;
    last = { x, y, z };
    if (!previous) return false;

    const change = Math.abs(x - previous.x) + Math.abs(y - previous.y) + Math.abs(z - previous.z);
    if (change < threshold) return false;
    if (now - lastShakeAt < cooldownMs) return false;

    lastShakeAt = now;
    return true;
  };
}

export type ShakeSupport = 'unsupported' | 'needs-permission' | 'ready';

type MotionEventConstructor = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * What this device can do. iPhones need a tap-triggered permission request
 * before they send motion events; Android sends them freely; a laptop or desktop
 * has no motion sensor worth offering.
 */
export function shakeSupport(): ShakeSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('DeviceMotionEvent' in window)) return 'unsupported';
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints < 1) return 'unsupported';
  const ctor = window.DeviceMotionEvent as unknown as MotionEventConstructor;
  return typeof ctor.requestPermission === 'function' ? 'needs-permission' : 'ready';
}

/** Must be called from a tap. Resolves true when motion events are allowed. */
export async function requestShakePermission(): Promise<boolean> {
  const ctor = (typeof window !== 'undefined'
    ? (window.DeviceMotionEvent as unknown as MotionEventConstructor | undefined)
    : undefined);
  if (!ctor || typeof ctor.requestPermission !== 'function') return true;
  try {
    return (await ctor.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}
