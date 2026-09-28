/**
 * Synthesized lamp-scene sounds (no asset files). One shared context — the
 * scene can fire many sounds quickly and browsers cap live AudioContexts.
 */

let shared: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!shared) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      shared = new AudioCtx();
    }
    if (shared.state === 'suspended') void shared.resume();
    return shared;
  } catch {
    return null;
  }
}

function noiseSource(ctx: AudioContext, seconds: number, decay = true) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const env = decay ? 1 - i / data.length : 1;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

/** Wall switch — short plastic click. */
export function playLampClick(): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const noise = noiseSource(ctx, 0.03);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    noise.connect(hp).connect(g).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.03);

    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1900, now);
    og.gain.setValueAtTime(0.05, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(og).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // ignore
  }
}

/** Pebble on the metal shade — bright ring that decays. */
export function playLampClang(): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const partials: [number, number, number][] = [
      [640, 0.16, 1.1],
      [1290, 0.08, 0.8],
      [2110, 0.05, 0.5],
      [3240, 0.025, 0.3],
    ];
    for (const [freq, gain, decay] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (0.98 + Math.random() * 0.04), now);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + decay);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay);
    }
    const tick = noiseSource(ctx, 0.02);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.3, now);
    tg.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    tick.connect(tg).connect(ctx.destination);
    tick.start(now);
  } catch {
    // ignore
  }
}

/** Bulb breaking — crack plus tinkling glass bits. */
export function playGlassShatter(): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const crack = noiseSource(ctx, 0.35);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55, now);
    g.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
    crack.connect(hp).connect(g).connect(ctx.destination);
    crack.start(now);

    for (let i = 0; i < 7; i += 1) {
      const t = now + 0.05 + Math.random() * 0.4;
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000 + Math.random() * 3500, t);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.setValueAtTime(0.05, t);
      og.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
      osc.connect(og).connect(ctx.destination);
      osc.start(now);
      osc.stop(t + 0.1);
    }
  } catch {
    // ignore
  }
}

/** Slingshot release — rubber twang with a small whoosh. */
export function playSlingshot(): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);
    og.gain.setValueAtTime(0.18, now);
    og.gain.exponentialRampToValueAtTime(0.002, now + 0.18);
    osc.connect(og).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    const whoosh = noiseSource(ctx, 0.22);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(700, now);
    bp.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.12, now);
    wg.gain.exponentialRampToValueAtTime(0.003, now + 0.22);
    whoosh.connect(bp).connect(wg).connect(ctx.destination);
    whoosh.start(now);
  } catch {
    // ignore
  }
}
