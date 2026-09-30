/**
 * Tiny synthesized sound effects (no asset files). One shared AudioContext,
 * created lazily from a user gesture, and a mute switch the recipient controls.
 */
let ctx: AudioContext | null = null;
let muted = false;

try {
  muted =
    typeof window !== 'undefined' && window.localStorage.getItem('occasio.muted') === '1';
} catch {
  muted = false;
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(value: boolean): void {
  muted = value;
  try {
    window.localStorage.setItem('occasio.muted', value ? '1' : '0');
  } catch {
    // private mode: mute still applies for this visit
  }
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; to?: number; lowpass?: number } = {},
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, start);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, start + dur);
  const peak = opts.gain ?? 0.18;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  let node: AudioNode = osc;
  if (opts.lowpass) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.lowpass;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Bright rising arpeggio: "yes!" and the finale. */
export function playTada(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone(c, f, t + i * 0.07, 0.35, { type: 'triangle', gain: 0.16 });
  });
  tone(c, 2093, t + 0.3, 0.5, { type: 'sine', gain: 0.06 });
}

/** Quick two-note chime when a star is earned. */
export function playStar(bonus = false): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const base = bonus ? 880 : 660;
  tone(c, base, t, 0.16, { type: 'sine', gain: 0.13 });
  tone(c, base * 1.5, t + 0.08, 0.22, { type: 'sine', gain: 0.11 });
  if (bonus) tone(c, base * 2, t + 0.17, 0.3, { type: 'sine', gain: 0.09 });
}

/** Cartoon "boing" for a shocked reaction. */
export function playBoing(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 180, t, 0.32, { type: 'sine', to: 620, gain: 0.22 });
  tone(c, 620, t + 0.3, 0.22, { type: 'sine', to: 240, gain: 0.16 });
}

/** Descending "wah wah wah wahhh". */
export function playSadTrombone(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const notes: Array<[number, number, number]> = [
    [233, 0, 0.28],
    [220, 0.3, 0.28],
    [208, 0.6, 0.28],
    [185, 0.9, 0.7],
  ];
  for (const [f, at, d] of notes) {
    tone(c, f, t + at, d, { type: 'sawtooth', gain: 0.13, lowpass: 900, to: f * 0.96 });
  }
}

/** Soft low thump + crackle for a firework. */
export function playBoom(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 110, t, 0.35, { type: 'sine', to: 42, gain: 0.3 });
  const dur = 0.5;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = 0.16;
  src.connect(g);
  g.connect(c.destination);
  src.start(t);
}

/** Paper-and-glitter shimmer used when something opens. */
export function playShimmer(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 6; i += 1) {
    tone(c, 1400 + i * 260 + Math.random() * 120, t + i * 0.05, 0.25, {
      type: 'sine',
      gain: 0.05,
    });
  }
}

/** Soft "thunk" for tapping a box or card. */
export function playTap(): void {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 220, t, 0.09, { type: 'sine', to: 120, gain: 0.16 });
}
