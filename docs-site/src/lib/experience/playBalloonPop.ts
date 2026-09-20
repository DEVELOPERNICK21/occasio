/** Short synthesized balloon-pop (no asset file). Safe to call from tap handlers. */
export function playBalloonPop(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const duration = 0.12;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.1);
    filter.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    oscGain.gain.setValueAtTime(0.28, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    window.setTimeout(() => {
      void ctx.close();
    }, 250);
  } catch {
    // ignore
  }
}

/**
 * Soft sustained breath / whoosh — airy, not a pop or blast.
 * Longer low-passed noise with a slow pitch sweep.
 */
export function playCandleBlow(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const duration = 0.85;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / data.length;
      // Soft envelope: swell then fade (breath shape)
      const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35);
      data[i] = (Math.random() * 2 - 1) * env * 0.55;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.setValueAtTime(520, now);
    low.frequency.linearRampToValueAtTime(220, now + 0.7);
    low.Q.value = 0.4;

    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.setValueAtTime(80, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.82);

    noise.connect(high);
    high.connect(low);
    low.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    window.setTimeout(() => {
      void ctx.close();
    }, 1000);
  } catch {
    // ignore
  }
}

/** Paper / ribbon rustle for unwrapping a gift. */
export function playGiftUnwrap(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const duration = 0.7;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / data.length;
      const flutter = 0.55 + 0.45 * Math.sin(t * Math.PI * 18);
      const env = Math.exp(-t * 2.2) * (0.4 + 0.6 * flutter);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.55);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    window.setTimeout(() => {
      void ctx.close();
    }, 900);
  } catch {
    // ignore
  }
}
