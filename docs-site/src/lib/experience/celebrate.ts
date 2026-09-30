import type { FxPreset } from './momentTheme';

/**
 * Framework-free particle engine for the finale. Each moment gets its own show
 * (cannons, petals + hearts, fireworks, lanterns, stars) driven by simple
 * physics, so it reads as real objects and not a looping sticker. Everything
 * draws with normal blending, so it stays visible on the light backgrounds. Shows play
 * once; more bursts only happen when the recipient taps.
 */
export type Vec = { x: number; y: number };

type Shape =
  | 'rect'
  | 'circle'
  | 'heart'
  | 'star'
  | 'petal'
  | 'streamer'
  | 'spark'
  | 'lantern'
  | 'sparkle'
  | 'rocket';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  flip: number;
  vflip: number;
  size: number;
  color: string;
  shape: Shape;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  sway: number;
  swayPhase: number;
  swaySpeed: number;
  delay: number;
  glow: boolean;
  trail: Vec[];
  trailLen: number;
  /** Rockets explode when they reach their apex. */
  explodeColor?: string;
};

export type Celebration = {
  burst: (preset: FxPreset, colors: string[], origin?: Vec, intensity?: number) => void;
  resize: () => void;
  clear: () => void;
  destroy: () => void;
};

const MAX_PARTICLES = 700;
const HEART_D =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const PETAL_D = 'M12 2C7 6 5 12 8 18c2 3 6 3 8 0 3-6 1-12-4-16z';

// Path2D does not exist during server rendering, so build these on first use.
let heartPath: Path2D | null = null;
let petalPath: Path2D | null = null;
const getHeart = () => (heartPath ??= new Path2D(HEART_D));
const getPetal = () => (petalPath ??= new Path2D(PETAL_D));

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;

function base(over: Partial<Particle>): Particle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: rand(0, Math.PI * 2),
    vr: 0,
    flip: rand(0, Math.PI * 2),
    vflip: 0,
    size: 10,
    color: '#fff',
    shape: 'rect',
    life: 200,
    maxLife: 200,
    gravity: 0.2,
    drag: 0.99,
    sway: 0,
    swayPhase: rand(0, Math.PI * 2),
    swaySpeed: 0.04,
    delay: 0,
    glow: false,
    trail: [],
    trailLen: 0,
    ...over,
  };
}

export function createCelebration(canvas: HTMLCanvasElement): Celebration {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles: Particle[] = [];
  let raf = 0;
  let last = 0;
  let destroyed = false;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const scale = () => Math.max(0.6, height / 800);

  function add(list: Particle[]) {
    particles = particles.concat(list).slice(-MAX_PARTICLES);
    if (!raf && !destroyed) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function explode(p: Particle): Particle[] {
    const color = p.explodeColor ?? '#FFD166';
    const sc = scale();
    const sparks: Particle[] = [];
    const count = Math.round(rand(70, 100));
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
      const speed = (1.5 + Math.pow(Math.random(), 0.55) * 6.5) * sc;
      sparks.push(
        base({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.6, 2.8),
          color: i % 5 === 0 ? '#FFD166' : color,
          shape: 'spark',
          life: rand(70, 115),
          maxLife: 115,
          gravity: 0.045 * sc,
          drag: 0.962,
          glow: true,
          trailLen: 7,
        }),
      );
    }
    // Late crackle: tiny sparks that pop out after the main bloom.
    for (let i = 0; i < 16; i += 1) {
      const angle = rand(0, Math.PI * 2);
      sparks.push(
        base({
          x: p.x + Math.cos(angle) * rand(10, 50) * sc,
          y: p.y + Math.sin(angle) * rand(10, 50) * sc,
          vx: Math.cos(angle) * rand(0.2, 1),
          vy: Math.sin(angle) * rand(0.2, 1),
          size: 1.6,
          color: '#F2A900',
          shape: 'sparkle',
          life: rand(30, 55),
          maxLife: 55,
          gravity: 0.02,
          drag: 0.96,
          glow: true,
          delay: rand(35, 60),
        }),
      );
    }
    return sparks;
  }

  function cannons(colors: string[], per: number, size = 1): Particle[] {
    const sc = scale();
    const out: Particle[] = [];
    for (const side of [0, 1]) {
      const x = side === 0 ? width * 0.02 : width * 0.98;
      const y = height * 1.0;
      for (let i = 0; i < per; i += 1) {
        // Straight up is -90deg; lean each cannon toward the middle of the screen.
        const angle = -Math.PI / 2 + (side === 0 ? 1 : -1) * rand(0.32, 0.95);
        const speed = rand(12, 23) * sc;
        const roll = Math.random();
        const isStreamer = roll > 0.86;
        out.push(
          base({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vr: rand(-0.25, 0.25),
            vflip: rand(0.12, 0.34),
            size: (isStreamer ? rand(34, 60) : rand(7, 13)) * size,
            color: pick(colors),
            shape: isStreamer ? 'streamer' : roll > 0.72 ? 'circle' : 'rect',
            life: rand(230, 330),
            maxLife: 330,
            gravity: 0.3 * sc,
            drag: 0.982,
            delay: rand(0, 8),
          }),
        );
      }
    }
    return out;
  }

  function confettiRain(colors: string[], count: number, delayBase: number): Particle[] {
    const sc = scale();
    return Array.from({ length: count }, () =>
      base({
        x: rand(0, width),
        y: rand(-height * 0.25, -10),
        vx: rand(-0.6, 0.6),
        vy: rand(1.2, 3.2) * sc,
        vr: rand(-0.1, 0.1),
        vflip: rand(0.08, 0.22),
        size: rand(6, 11),
        color: pick(colors),
        shape: Math.random() > 0.8 ? 'circle' : 'rect',
        life: 480,
        maxLife: 480,
        gravity: 0.012,
        drag: 0.998,
        sway: rand(0.5, 1.4),
        swaySpeed: rand(0.03, 0.06),
        delay: delayBase + rand(0, 90),
      }),
    );
  }

  function radial(
    origin: Vec,
    colors: string[],
    count: number,
    shapes: Shape[],
    speed: [number, number],
    gravity: number,
  ): Particle[] {
    const sc = scale();
    return Array.from({ length: count }, () => {
      const a = rand(0, Math.PI * 2);
      const v = rand(speed[0], speed[1]) * sc;
      return base({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 2,
        vr: rand(-0.2, 0.2),
        vflip: rand(0.1, 0.3),
        size: rand(7, 14),
        color: pick(colors),
        shape: pick(shapes),
        life: rand(90, 150),
        maxLife: 150,
        gravity: gravity * sc,
        drag: 0.965,
      });
    });
  }

  function burst(preset: FxPreset, colors: string[], origin?: Vec, intensity = 1) {
    if (!ctx) return;
    const sc = scale();
    const n = (count: number) => Math.max(4, Math.round(count * intensity));

    if (origin) {
      // Tap burst: a small, local pop in the moment's style.
      if (preset === 'fireworks') {
        const rocket = base({
          x: origin.x,
          y: origin.y,
          size: 1,
          shape: 'spark',
          life: 1,
          maxLife: 1,
          explodeColor: pick(colors),
        });
        add(explode(rocket));
        return;
      }
      const shapes: Shape[] =
        preset === 'petals'
          ? ['heart', 'petal', 'petal']
          : preset === 'stars'
            ? ['star', 'circle', 'heart']
            : preset === 'lanterns'
              ? ['sparkle', 'circle', 'star']
              : ['rect', 'rect', 'circle', 'star'];
      add(radial(origin, colors, n(46), shapes, [4, 13], preset === 'petals' ? 0.12 : 0.24));
      return;
    }

    switch (preset) {
      case 'confetti':
        add(cannons(colors, n(64)));
        add(confettiRain(colors, n(46), 40));
        break;
      case 'petals': {
        const petals = Array.from({ length: n(52) }, () =>
          base({
            x: rand(0, width),
            y: rand(-height * 0.3, -10),
            vx: rand(-0.4, 0.4),
            vy: rand(1.1, 2.3) * sc,
            vr: rand(-0.05, 0.05),
            vflip: rand(0.04, 0.1),
            size: rand(12, 22),
            color: pick(colors),
            shape: 'petal',
            life: 620,
            maxLife: 620,
            gravity: 0.008,
            drag: 0.999,
            sway: rand(0.8, 1.9),
            swaySpeed: rand(0.025, 0.05),
            delay: rand(0, 90),
          }),
        );
        const hearts = Array.from({ length: n(18) }, () =>
          base({
            x: rand(width * 0.05, width * 0.95),
            y: height + rand(10, 120),
            vx: 0,
            vy: -rand(1.4, 2.8) * sc,
            size: rand(14, 26),
            color: pick(['#FF6F91', '#FF4F7B', '#FFB3C7', '#FF86A8']),
            shape: 'heart',
            life: 420,
            maxLife: 420,
            gravity: -0.002,
            drag: 1,
            sway: rand(0.6, 1.4),
            swaySpeed: rand(0.03, 0.06),
            glow: true,
            delay: rand(0, 120),
          }),
        );
        const sparkles = Array.from({ length: n(30) }, () =>
          base({
            x: rand(0, width),
            y: rand(0, height),
            size: rand(3, 6),
            color: '#F2A93B',
            shape: 'sparkle',
            life: rand(90, 200),
            maxLife: 200,
            gravity: 0,
            drag: 1,
            glow: true,
            delay: rand(0, 180),
          }),
        );
        add([...petals, ...hearts, ...sparkles]);
        break;
      }
      case 'fireworks': {
        const rockets = n(7);
        const list: Particle[] = [];
        for (let i = 0; i < rockets; i += 1) {
          const targetY = height * rand(0.16, 0.42);
          const g = 0.16 * sc;
          const vy0 = -Math.sqrt(2 * g * (height - targetY));
          list.push(
            base({
              x: width * rand(0.12, 0.88),
              y: height + 8,
              vx: rand(-0.6, 0.6),
              vy: vy0,
              size: 2.4,
              color: '#F2A900',
              shape: 'rocket',
              life: 400,
              maxLife: 400,
              gravity: g,
              drag: 1,
              glow: true,
              trailLen: 10,
              delay: i * rand(16, 30),
              explodeColor: pick(colors),
            }),
          );
        }
        add(list);
        add(cannons(['#F2A900', '#EF476F', '#3557E8', '#06D6A0'], n(22), 0.9));
        break;
      }
      case 'lanterns': {
        const lanterns = Array.from({ length: n(13) }, () =>
          base({
            x: rand(width * 0.06, width * 0.94),
            y: height + rand(20, height * 0.5),
            vx: 0,
            vy: -rand(0.7, 1.5) * sc,
            size: rand(22, 38),
            color: pick(['#FFB347', '#FFC857', '#FF9F68']),
            shape: 'lantern',
            life: 900,
            maxLife: 900,
            gravity: -0.0008,
            drag: 1,
            sway: rand(0.3, 0.7),
            swaySpeed: rand(0.02, 0.035),
            glow: true,
            delay: rand(0, 100),
          }),
        );
        const sparkles = Array.from({ length: n(60) }, () =>
          base({
            x: rand(0, width),
            y: rand(0, height),
            size: rand(2.5, 6),
            color: pick(['#F2A93B', '#FFB84D', '#FF8A3D']),
            shape: 'sparkle',
            life: rand(80, 220),
            maxLife: 220,
            gravity: 0,
            drag: 1,
            glow: true,
            delay: rand(0, 240),
          }),
        );
        add([...lanterns, ...sparkles]);
        break;
      }
      case 'stars':
      default: {
        const c = { x: width / 2, y: height * 0.42 };
        add(radial(c, colors, n(70), ['star', 'star', 'circle', 'heart', 'rect'], [5, 15], 0.2));
        add(
          Array.from({ length: n(34) }, () =>
            base({
              x: rand(0, width),
              y: rand(-height * 0.2, -10),
              vy: rand(1.4, 3) * sc,
              vr: rand(-0.06, 0.06),
              vflip: rand(0.05, 0.14),
              size: rand(8, 15),
              color: pick(colors),
              shape: 'star',
              life: 400,
              maxLife: 400,
              gravity: 0.01,
              drag: 0.999,
              sway: rand(0.4, 1),
              swaySpeed: rand(0.03, 0.06),
              delay: rand(20, 130),
            }),
          ),
        );
        break;
      }
    }
  }

  function draw(p: Particle, alpha: number) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(p.x, p.y);

    switch (p.shape) {
      case 'rect': {
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
        break;
      }
      case 'circle': {
        ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.6 + 0.4);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'streamer': {
        ctx.rotate(p.rot);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const segs = 6;
        for (let i = 0; i <= segs; i += 1) {
          const t = i / segs;
          const px = (t - 0.5) * p.size;
          const py = Math.sin(t * 6 + p.flip * 3) * p.size * 0.12;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      }
      case 'heart': {
        if (p.glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 14;
        }
        ctx.rotate(Math.sin(p.swayPhase) * 0.25);
        const s = p.size / 24;
        ctx.scale(s, s);
        ctx.translate(-12, -12);
        ctx.fillStyle = p.color;
        ctx.fill(getHeart());
        break;
      }
      case 'petal': {
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.75 + 0.25);
        const s = p.size / 24;
        ctx.scale(s, s);
        ctx.translate(-12, -12);
        ctx.fillStyle = p.color;
        ctx.fill(getPetal());
        break;
      }
      case 'star': {
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.7 + 0.3);
        ctx.fillStyle = p.color;
        starPath(ctx, p.size * 0.5);
        ctx.fill();
        break;
      }
      case 'sparkle': {
        const tw = 0.55 + 0.45 * Math.sin((p.maxLife - p.life) * 0.25);
        ctx.globalAlpha *= tw;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        starPath(ctx, p.size * 1.6 * tw);
        ctx.fill();
        break;
      }
      case 'lantern': {
        const flicker = 0.85 + 0.15 * Math.sin((p.maxLife - p.life) * 0.18 + p.swayPhase);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.7);
        glow.addColorStop(0, `${p.color}CC`);
        glow.addColorStop(1, `${p.color}00`);
        ctx.fillStyle = glow;
        ctx.globalAlpha *= flicker;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.95;
        ctx.fillStyle = p.color;
        roundRect(ctx, -p.size * 0.32, -p.size * 0.42, p.size * 0.64, p.size * 0.84, p.size * 0.18);
        ctx.fill();
        ctx.fillStyle = '#FFF6D6';
        roundRect(ctx, -p.size * 0.2, -p.size * 0.3, p.size * 0.4, p.size * 0.6, p.size * 0.12);
        ctx.fill();
        break;
      }
      case 'rocket':
      case 'spark': {
        ctx.restore();
        ctx.save();
        // Trail: fading line through recent positions.
        if (p.trail.length > 1) {
          ctx.lineCap = 'round';
          for (let i = 1; i < p.trail.length; i += 1) {
            const a = (i / p.trail.length) * alpha * 0.9;
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, a));
            ctx.lineWidth = p.size * (0.4 + (i / p.trail.length) * 0.9);
            ctx.beginPath();
            ctx.moveTo(p.trail[i - 1]!.x, p.trail[i - 1]!.y);
            ctx.lineTo(p.trail[i]!.x, p.trail[i]!.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      default:
        break;
    }
    ctx.restore();
  }

  function frame(time: number) {
    raf = 0;
    if (destroyed || !ctx) return;
    const dt = last ? Math.min((time - last) / 16.667, 3) : 1;
    last = time;

    ctx.clearRect(0, 0, width, height);
    const survivors: Particle[] = [];
    const born: Particle[] = [];

    for (const p of particles) {
      if (p.delay > 0) {
        p.delay -= dt;
        survivors.push(p);
        continue;
      }

      if (p.trailLen > 0) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.trailLen) p.trail.shift();
      }

      const drag = Math.pow(p.drag, dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.swayPhase += p.swaySpeed * dt;
      p.x += (p.vx + Math.sin(p.swayPhase) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vflip * dt;
      p.life -= dt;

      if (p.shape === 'rocket' && p.vy >= -0.6) {
        born.push(...explode(p));
        continue;
      }
      const fellOff = p.y > height + 80 && p.vy > 0;
      const flewOff = p.y < -200 && p.vy < 0;
      const strayed = p.x < -200 || p.x > width + 200;
      if (p.life <= 0 || fellOff || flewOff || strayed) continue;

      const fade = Math.min(1, p.life / (p.maxLife * 0.28));
      const fadeIn = Math.min(1, (p.maxLife - p.life) / 12);
      draw(p, fade * fadeIn);
      survivors.push(p);
    }

    particles = survivors.concat(born).slice(-MAX_PARTICLES);
    if (particles.length > 0) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }

  return {
    burst,
    resize,
    clear() {
      particles = [];
      ctx?.clearRect(0, 0, width, height);
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      particles = [];
    },
  };
}

function starPath(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
  ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
  ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
  ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
