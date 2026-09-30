'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * "Blow into your mic": listens for a sustained loud breath and calls `onBlow`
 * once. The microphone is only opened when the recipient asks, and is closed
 * as soon as a blow is heard or the scene goes away. Audio never leaves the device.
 */
export function useMicBlow(onBlow: () => void) {
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const blowRef = useRef(onBlow);
  blowRef.current = onBlow;

  useEffect(() => () => stopRef.current?.(), []);

  const start = useCallback(async () => {
    if (listening) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setBlocked(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let loudFrames = 0;
      let raf = 0;

      const stop = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
        stopRef.current = null;
        setListening(false);
      };
      stopRef.current = stop;
      setListening(true);

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) sum += buf[i]! * buf[i]!;
        const rms = Math.sqrt(sum / buf.length);
        loudFrames = rms > 0.12 ? loudFrames + 1 : Math.max(0, loudFrames - 1);
        if (loudFrames > 6) {
          blowRef.current();
          stop();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setBlocked(true);
    }
  }, [listening]);

  return { listening, blocked, start };
}
