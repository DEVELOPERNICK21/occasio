'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  playGlassShatter,
  playLampClang,
  playLampClick,
  playSlingshot,
} from '@/lib/experience/lampSounds';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  recipientName: string;
  templateType: string;
  step: number;
  total: number;
  onComplete: () => void;
  onSkip: () => void;
};

type Geometry = {
  w: number;
  h: number;
  ax: number;
  cord: number;
  shadeW: number;
  yTop: number;
  yRim: number;
  bulbR: number;
  /** Distance from the anchor to the glass globe centre. */
  bulbCy: number;
  slingX: number;
  slingY: number;
  forkY: number;
  restX: number;
  restY: number;
  sw: { x: number; y: number; w: number; h: number };
  contentTop: number;
};

type Shard = { id: number; x: number; y: number; dx: number; dy: number; r: number };

const GRAVITY = 2600;
const DAMPING = 0.5;
const MAX_FLING = 5;
const PEBBLE_GRAVITY = 900;
const PEBBLE_R = 8;
const MAX_PULL = 100;
const LAUNCH = 14;
const MAX_SWING = 1.3;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function computeGeometry(w: number, h: number): Geometry {
  const mobile = w < 640;
  const cord = clamp(h * 0.2, 70, 200);
  const shadeW = clamp(Math.min(w * 0.24, h * 0.2), 84, 140);
  const yTop = cord + 8;
  const yRim = yTop + shadeW * 0.46;
  const bulbR = shadeW * 0.115;
  const bulbCy = yRim + bulbR * 1.35;
  const slingX = clamp(w * 0.14, 52, 170);
  const slingY = h - 36;
  const forkY = slingY - 118;
  const swW = 56;
  const swH = 90;
  return {
    w,
    h,
    ax: w / 2,
    cord,
    shadeW,
    yTop,
    yRim,
    bulbR,
    bulbCy,
    slingX,
    slingY,
    forkY,
    restX: slingX,
    restY: forkY + 6,
    sw: {
      x: w - swW - clamp(w * 0.06, 16, 80),
      y: mobile ? 76 : h * 0.42 - swH / 2,
      w: swW,
      h: swH,
    },
    contentTop: bulbCy + bulbR + (mobile ? 24 : 14),
  };
}

/** World position of a point on the lamp's axis at distance `d` from the anchor. */
function lampPoint(g: Geometry, theta: number, d: number) {
  return { x: g.ax + d * Math.sin(theta), y: d * Math.cos(theta) };
}

/** A19-style bulb in lamp-local coordinates (x = 0 on the cord axis). */
function Bulb({ g, broken, flicker }: { g: Geometry; broken: boolean; flicker: number }) {
  const R = g.bulbR;
  const c = g.bulbCy;
  const collarTop = g.yRim - 3;
  const neckY = g.yRim + R * 0.32;
  const n = R * 0.42;
  const glass = `M ${-n} ${neckY} C ${-n} ${neckY + R * 0.3}, ${-R} ${c - R * 0.7}, ${-R} ${c} A ${R} ${R} 0 0 0 ${R} ${c} C ${R} ${c - R * 0.7}, ${n} ${neckY + R * 0.3}, ${n} ${neckY} Z`;

  const coilY = c - R * 0.08;
  const coil = Array.from({ length: 7 }, (_, i) => {
    const x = -R * 0.3 + (i * R * 0.6) / 6;
    return `${i === 0 ? 'M' : 'L'} ${x} ${coilY + (i % 2 === 0 ? -R * 0.1 : R * 0.1)}`;
  }).join(' ');

  const stump = `M ${-n} ${neckY} L ${-n * 1.25} ${neckY + R * 0.55} L ${-R * 0.22} ${neckY + R * 0.3} L ${-R * 0.05} ${neckY + R * 0.75} L ${R * 0.2} ${neckY + R * 0.38} L ${n * 1.3} ${neckY + R * 0.62} L ${n} ${neckY} Z`;

  return (
    <g>
      <rect
        x={-n - 1}
        y={collarTop}
        width={2 * n + 2}
        height={neckY - collarTop + 1}
        rx={1.5}
        fill="url(#lamp-metal)"
      />
      {[0.3, 0.55, 0.8].map((t) => (
        <line
          key={t}
          x1={-n - 1}
          x2={n + 1}
          y1={collarTop + (neckY - collarTop) * t - 1}
          y2={collarTop + (neckY - collarTop) * t + 1}
          stroke="#4d4a45"
          strokeWidth={0.8}
          opacity={0.7}
        />
      ))}

      {broken ? (
        <g>
          <path d={stump} fill="url(#lamp-glass-off)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
          <path
            d={`M ${-R * 0.12} ${neckY} L ${-R * 0.28} ${neckY + R * 0.9} M ${R * 0.12} ${neckY} L ${R * 0.34} ${neckY + R * 0.8}`}
            stroke="#8e8984"
            strokeWidth={0.7}
            fill="none"
          />
        </g>
      ) : (
        <g>
          <path d={glass} fill="url(#lamp-glass-off)" stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
          <path
            key={`g-${flicker}`}
            className={`lamp-glass--lit${flicker > 0 ? ' is-flicker' : ''}`}
            d={glass}
            fill="url(#lamp-glass-lit)"
          />
          <path
            d={`M ${-R * 0.1} ${neckY} L ${-R * 0.06} ${c - R * 0.38} L ${R * 0.06} ${c - R * 0.38} L ${R * 0.1} ${neckY} Z`}
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d={`M ${-R * 0.06} ${c - R * 0.38} L ${-R * 0.3} ${coilY} M ${R * 0.06} ${c - R * 0.38} L ${R * 0.3} ${coilY}`}
            stroke="#a09a93"
            strokeWidth={0.6}
            fill="none"
          />
          <path className="lamp-filament" d={coil} fill="none" strokeLinejoin="round" />
          <path
            d={`M ${-R * 0.64} ${c - R * 0.3} Q ${-R * 0.74} ${c + R * 0.22} ${-R * 0.34} ${c + R * 0.64}`}
            stroke="#fff"
            strokeOpacity={0.55}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={R * 0.44} cy={c - R * 0.46} r={R * 0.09} fill="#fff" opacity={0.55} />
        </g>
      )}
    </g>
  );
}

/** Static wooden frame — bands and pouch are animated separately. */
function SlingshotFrame({ g }: { g: Geometry }) {
  const sx = g.slingX;
  const fy = g.forkY;
  const sy = g.slingY;
  const frame = `M ${sx - 6} ${sy + 40} L ${sx - 7} ${fy + 62} C ${sx - 8} ${fy + 44}, ${sx - 20} ${fy + 30}, ${sx - 29} ${fy + 4} Q ${sx - 31} ${fy - 5}, ${sx - 23} ${fy - 4} C ${sx - 18} ${fy + 18}, ${sx - 8} ${fy + 32}, ${sx} ${fy + 36} C ${sx + 8} ${fy + 32}, ${sx + 18} ${fy + 18}, ${sx + 23} ${fy - 4} Q ${sx + 31} ${fy - 5}, ${sx + 29} ${fy + 4} C ${sx + 20} ${fy + 30}, ${sx + 8} ${fy + 44}, ${sx + 7} ${fy + 62} L ${sx + 6} ${sy + 40} Z`;
  const wrapTop = fy + 80;
  const wraps = 10;

  return (
    <g>
      <defs>
        <clipPath id="lamp-frame-clip">
          <path d={frame} />
        </clipPath>
      </defs>
      <path d={frame} fill="url(#lamp-wood)" />
      <g clipPath="url(#lamp-frame-clip)" fill="none" stroke="#3d2512" strokeWidth={0.8}>
        <path d={`M ${sx - 3} ${sy + 40} C ${sx - 2} ${fy + 90}, ${sx - 5} ${fy + 50}, ${sx - 22} ${fy + 6}`} opacity={0.35} />
        <path d={`M ${sx + 2} ${sy + 40} C ${sx + 3} ${fy + 90}, ${sx + 4} ${fy + 50}, ${sx + 21} ${fy + 4}`} opacity={0.3} />
        <path d={`M ${sx} ${sy + 40} C ${sx + 1} ${fy + 100}, ${sx - 1} ${fy + 70}, ${sx} ${fy + 40}`} opacity={0.25} />
        <path d={`M ${sx - 26} ${fy + 2} C ${sx - 20} ${fy + 26}, ${sx - 12} ${fy + 40}, ${sx - 5} ${fy + 60}`} opacity={0.3} />
        <path d={`M ${sx + 26} ${fy + 2} C ${sx + 20} ${fy + 26}, ${sx + 12} ${fy + 40}, ${sx + 5} ${fy + 60}`} opacity={0.3} />
        <rect x={sx - 40} y={fy - 10} width={20} height={200} fill="#000" stroke="none" opacity={0.18} />
      </g>
      <ellipse cx={sx + 2} cy={fy + 66} rx={2} ry={3.2} fill="#4a2d15" opacity={0.7} />
      <ellipse cx={sx + 2} cy={fy + 66} rx={3.2} ry={4.6} fill="none" stroke="#4a2d15" strokeWidth={0.6} opacity={0.4} />

      <rect x={sx - 7.5} y={wrapTop} width={15} height={wraps * 4 + 2} rx={2} fill="#8a6134" />
      {Array.from({ length: wraps }, (_, i) => (
        <g key={i}>
          <line
            x1={sx - 7.5}
            y1={wrapTop + 2 + i * 4}
            x2={sx + 7.5}
            y2={wrapTop + 4 + i * 4}
            stroke="#d6b27a"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={sx - 7.5}
            y1={wrapTop + 3.8 + i * 4}
            x2={sx + 7.5}
            y2={wrapTop + 5.8 + i * 4}
            stroke="#6d4a22"
            strokeWidth={0.7}
          />
        </g>
      ))}

      {[-1, 1].map((side) => (
        <rect
          key={side}
          x={sx + side * 26 - 4.5}
          y={fy - 2}
          width={9}
          height={7}
          rx={1.5}
          fill="#3b2a1d"
          transform={`rotate(${side * -12} ${sx + side * 26} ${fy + 1})`}
        />
      ))}
    </g>
  );
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function LampScene({
  recipientName,
  templateType,
  step,
  total,
  onComplete,
  onSkip,
}: Props) {
  const title = storyCopyFor(templateType).lampTitle(recipientName);

  const [geo, setGeo] = useState<Geometry | null>(null);
  const [on, setOn] = useState(true);
  const [broken, setBroken] = useState(false);
  const [shots, setShots] = useState(0);
  const [bulbs, setBulbs] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [flicker, setFlicker] = useState(0);
  const [shards, setShards] = useState<Shard[]>([]);
  const [clock, setClock] = useState('');

  const geoRef = useRef<Geometry | null>(null);
  const live = useRef({ on: true, broken: false, soundOn: true });
  const sim = useRef({
    theta: 0,
    omega: 0,
    drag: 'none' as 'none' | 'shade' | 'pebble',
    lastMoveT: 0,
    pebble: { x: 0, y: 0, vx: 0, vy: 0, flying: false, armed: false },
  });

  const lampRef = useRef<SVGGElement>(null);
  const pebbleRef = useRef<SVGCircleElement>(null);
  const bandBackRef = useRef<SVGPathElement>(null);
  const bandFrontRef = useRef<SVGPathElement>(null);
  const pouchRef = useRef<SVGGElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const rects = useRef({ title: { left: 0, top: 0 }, hl: { left: 0, top: 0 } });

  const lit = on && !broken;

  useEffect(() => {
    live.current = { on, broken, soundOn };
  }, [on, broken, soundOn]);

  useEffect(() => {
    const measure = () => {
      const g = computeGeometry(window.innerWidth, window.innerHeight);
      geoRef.current = g;
      setGeo(g);
    };
    measure();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) sim.current.omega = 0.9;
    setClock(formatClock(new Date()));
    const tick = window.setInterval(() => setClock(formatClock(new Date())), 30_000);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearInterval(tick);
    };
  }, []);

  // Heading light is positioned relative to each text box; cache their offsets.
  useEffect(() => {
    if (!geo) return;
    const cache = () => {
      const t = titleRef.current?.getBoundingClientRect();
      const s = hlRef.current?.getBoundingClientRect();
      if (t) rects.current.title = { left: t.left, top: t.top };
      if (s) rects.current.hl = { left: s.left, top: s.top };
    };
    cache();
    const late = window.setTimeout(cache, 400);
    void document.fonts?.ready.then(cache);
    return () => window.clearTimeout(late);
  }, [geo, title.lead, title.highlight]);

  const sound = useCallback((play: () => void) => {
    if (live.current.soundOn) play();
  }, []);

  const toggleSwitch = useCallback(() => {
    sound(playLampClick);
    setOn((v) => !v);
  }, [sound]);

  const breakBulb = useCallback(
    (x: number, y: number) => {
      if (live.current.broken) return;
      live.current.broken = true;
      setBroken(true);
      setBulbs((b) => b + 1);
      sound(playGlassShatter);
      const base = Date.now();
      setShards(
        Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
          const dist = 40 + Math.random() * 70;
          return {
            id: base + i,
            x,
            y,
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist + 60,
            r: Math.random() * 540 - 270,
          };
        }),
      );
      window.setTimeout(() => setShards([]), 1000);
    },
    [sound],
  );

  const hitShade = useCallback(
    (vx: number, vy: number) => {
      const s = sim.current;
      const g = geoRef.current;
      if (!g) return;
      const tangential = vx * Math.cos(s.theta) - vy * Math.sin(s.theta);
      s.omega = clamp(s.omega + (tangential / g.yRim) * 0.7, -MAX_FLING, MAX_FLING);
      sound(playLampClang);
      setFlicker((f) => f + 1);
    },
    [sound],
  );

  useEffect(() => {
    if (!geo) return;
    let raf = 0;
    let last = performance.now();

    const render = () => {
      const g = geoRef.current;
      if (!g) return;
      const s = sim.current;
      const p = s.pebble;
      lampRef.current?.setAttribute(
        'transform',
        `translate(${g.ax} 0) rotate(${(-s.theta * 180) / Math.PI})`,
      );
      pebbleRef.current?.setAttribute('cx', `${p.x}`);
      pebbleRef.current?.setAttribute('cy', `${p.y}`);
      // Pouch cups the pebble, facing away from the fork; bands meet its edges.
      const pouchX = p.flying ? g.restX : p.x;
      const pouchY = p.flying ? g.restY : p.y;
      const midY = g.forkY + 1;
      const ux0 = pouchX - g.slingX;
      const uy0 = pouchY - midY;
      const ulen = Math.hypot(ux0, uy0);
      const a = ulen > 1 ? Math.atan2(uy0, ux0) - Math.PI / 2 : 0;
      const edge = (lx: number, ly: number) => [
        pouchX + lx * Math.cos(a) - ly * Math.sin(a),
        pouchY + lx * Math.sin(a) + ly * Math.cos(a),
      ];
      const [e1x, e1y] = edge(-11, -1);
      const [e2x, e2y] = edge(11, -1);
      const leftFirst = e1x! <= e2x!;
      const [lx, ly] = leftFirst ? [e1x, e1y] : [e2x, e2y];
      const [rx, ry] = leftFirst ? [e2x, e2y] : [e1x, e1y];
      bandBackRef.current?.setAttribute('d', `M ${g.slingX - 26} ${midY} L ${lx} ${ly}`);
      bandFrontRef.current?.setAttribute('d', `M ${rx} ${ry} L ${g.slingX + 26} ${midY}`);
      pouchRef.current?.setAttribute(
        'transform',
        `translate(${pouchX} ${pouchY}) rotate(${(a * 180) / Math.PI})`,
      );

      const bulb = lampPoint(g, s.theta, g.bulbCy);
      const { title, hl } = rects.current;
      titleRef.current?.style.setProperty('--lx', `${bulb.x - title.left}px`);
      titleRef.current?.style.setProperty('--ly', `${bulb.y - title.top}px`);
      hlRef.current?.style.setProperty('--lx', `${bulb.x - hl.left}px`);
      hlRef.current?.style.setProperty('--ly', `${bulb.y - hl.top}px`);
    };

    const collide = (g: Geometry) => {
      const s = sim.current;
      const p = s.pebble;
      if (!p.armed) return;

      const bulbC = lampPoint(g, s.theta, g.bulbCy);
      if (!live.current.broken && Math.hypot(p.x - bulbC.x, p.y - bulbC.y) < g.bulbR + PEBBLE_R) {
        breakBulb(bulbC.x, bulbC.y);
        p.armed = false;
        p.vx *= 0.3;
        p.vy = Math.abs(p.vy) * 0.25;
        return;
      }

      // Shade: half-ellipse in lamp-local coordinates.
      const dx = p.x - g.ax;
      const dy = p.y;
      const lx = dx * Math.cos(s.theta) - dy * Math.sin(s.theta);
      const ly = dx * Math.sin(s.theta) + dy * Math.cos(s.theta);
      const rx = g.shadeW / 2 + PEBBLE_R;
      const ry = g.yRim - g.yTop + PEBBLE_R;
      if (ly <= g.yRim + PEBBLE_R && (lx / rx) ** 2 + ((ly - g.yRim) / ry) ** 2 <= 1) {
        hitShade(p.vx, p.vy);
        p.armed = false;
        p.vx *= -0.35;
        p.vy = Math.abs(p.vy) * 0.3;
        return;
      }

      const sw = g.sw;
      if (
        p.x > sw.x - PEBBLE_R &&
        p.x < sw.x + sw.w + PEBBLE_R &&
        p.y > sw.y - PEBBLE_R &&
        p.y < sw.y + sw.h + PEBBLE_R
      ) {
        toggleSwitch();
        p.armed = false;
        p.vx *= -0.3;
        p.vy *= 0.3;
      }
    };

    const frame = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;
      const g = geoRef.current;
      const s = sim.current;
      if (g) {
        if (s.drag !== 'shade') {
          const alpha = -(GRAVITY / g.yRim) * Math.sin(s.theta) - DAMPING * s.omega;
          s.omega += alpha * dt;
          const next = s.theta + s.omega * dt;
          if (Math.abs(next) > MAX_SWING) {
            s.theta = Math.sign(next) * MAX_SWING;
            s.omega *= -0.3;
          } else {
            s.theta = next;
          }
        }
        const p = s.pebble;
        if (p.flying) {
          const steps = 4;
          const h = dt / steps;
          for (let i = 0; i < steps; i += 1) {
            p.vy += PEBBLE_GRAVITY * h;
            p.x += p.vx * h;
            p.y += p.vy * h;
            collide(g);
          }
          if (p.x < -40 || p.x > g.w + 40 || p.y > g.h + 40) {
            p.flying = false;
            p.armed = false;
          }
        } else if (s.drag !== 'pebble') {
          p.x = g.restX;
          p.y = g.restY;
        }
        render();
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [geo, breakBulb, hitShade, toggleSwitch]);

  const pointer = (e: ReactPointerEvent) => ({ x: e.clientX, y: e.clientY });

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const g = geoRef.current;
    if (!g || (e.target as HTMLElement).closest('button, a')) return;
    const s = sim.current;
    const pt = pointer(e);

    if (!s.pebble.flying && Math.hypot(pt.x - s.pebble.x, pt.y - s.pebble.y) < 40) {
      s.drag = 'pebble';
    } else {
      const dx = pt.x - g.ax;
      const dy = pt.y;
      const lx = dx * Math.cos(s.theta) - dy * Math.sin(s.theta);
      const ly = dx * Math.sin(s.theta) + dy * Math.cos(s.theta);
      if (Math.abs(lx) < g.shadeW / 2 + 16 && ly > g.yTop - 20 && ly < g.bulbCy + g.bulbR + 16) {
        s.drag = 'shade';
        s.omega = 0;
        s.lastMoveT = performance.now();
      }
    }
    if (s.drag !== 'none') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer already released (fast taps); move/up still reach the stage.
      }
      e.preventDefault();
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const g = geoRef.current;
    const s = sim.current;
    if (!g || s.drag === 'none') return;
    const pt = pointer(e);

    if (s.drag === 'pebble') {
      let dx = pt.x - g.restX;
      let dy = pt.y - g.restY;
      const len = Math.hypot(dx, dy);
      if (len > MAX_PULL) {
        dx = (dx / len) * MAX_PULL;
        dy = (dy / len) * MAX_PULL;
      }
      s.pebble.x = g.restX + dx;
      s.pebble.y = g.restY + dy;
      return;
    }

    const now = performance.now();
    const next = clamp(Math.atan2(pt.x - g.ax, Math.max(pt.y, 20)), -MAX_SWING, MAX_SWING);
    const dt = Math.max(0.008, (now - s.lastMoveT) / 1000);
    s.omega = clamp((next - s.theta) / dt, -MAX_FLING, MAX_FLING);
    s.theta = next;
    s.lastMoveT = now;
  };

  const onPointerUp = () => {
    const g = geoRef.current;
    const s = sim.current;
    if (!g) return;
    if (s.drag === 'pebble') {
      const p = s.pebble;
      const dx = p.x - g.restX;
      const dy = p.y - g.restY;
      if (Math.hypot(dx, dy) > 12) {
        p.vx = -dx * LAUNCH;
        p.vy = -dy * LAUNCH;
        p.flying = true;
        p.armed = true;
        setShots((n) => n + 1);
        sound(playSlingshot);
      }
    } else if (s.drag === 'shade' && performance.now() - s.lastMoveT > 80) {
      s.omega = 0;
    }
    s.drag = 'none';
  };

  const replaceBulb = () => {
    live.current.broken = false;
    setBroken(false);
    sound(playLampClick);
  };

  const g = geo;
  const stageStyle = g ? ({ '--content-top': `${g.contentTop}px` } as CSSProperties) : undefined;

  return (
    <section
      className={`lamp-stage ${lit ? 'is-lit' : 'is-dark'}`}
      style={stageStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="A lamp in a dark room. Flip the switch, swing the shade, or use the slingshot."
    >
      <div className="lamp-grid" aria-hidden />

      <div className="lamp-hud lamp-hud--left">
        <p>
          occasio-lamp · <b>{lit ? 'on' : 'off'}</b>
        </p>
        <p>
          shots <b>{shots}</b> · bulbs <b>{bulbs}</b>
        </p>
        {broken ? (
          <button type="button" className="lamp-pill lamp-pill--replace" onClick={replaceBulb}>
            replace bulb
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="lamp-pill lamp-hud--right"
        onClick={() => setSoundOn((v) => !v)}
        aria-pressed={soundOn}
      >
        sound: {soundOn ? 'on' : 'off'}
      </button>

      <div className="lamp-copy">
        <h1
          key={`t-${flicker}`}
          ref={titleRef}
          className={`lamp-title${flicker > 0 ? ' is-flicker' : ''}`}
        >
          {title.lead}
          <br />
          <span ref={hlRef} className="lamp-title__hl">
            {title.highlight}
          </span>
          .
        </h1>
        <p className="lamp-sub">
          Use the switch to turn the bulb on and off.
          <br />
          Use the slingshot to hit the shade, the bulb or the switch.
        </p>
      </div>

      {g ? (
        <svg
          className="lamp-svg"
          width={g.w}
          height={g.h}
          viewBox={`0 0 ${g.w} ${g.h}`}
          aria-hidden
        >
          <defs>
            <radialGradient
              id="lamp-cone"
              gradientUnits="userSpaceOnUse"
              cx={0}
              cy={g.yRim}
              r={g.h * 1.05}
            >
              <stop offset="0%" stopColor="#ffdca0" stopOpacity="0.26" />
              <stop offset="45%" stopColor="#ffd08a" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#ffd08a" stopOpacity="0" />
            </radialGradient>
            <filter id="lamp-soft" x="-50%" y="-10%" width="200%" height="130%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id="lamp-halo">
              <stop offset="0%" stopColor="#ffe6b5" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#ffcf80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffcf80" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lamp-shade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3a3835" />
              <stop offset="35%" stopColor="#8a8680" />
              <stop offset="55%" stopColor="#b9b4ac" />
              <stop offset="100%" stopColor="#2f2d2a" />
            </linearGradient>
            <linearGradient id="lamp-wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f311a" />
              <stop offset="28%" stopColor="#9c6b3c" />
              <stop offset="48%" stopColor="#caa06a" />
              <stop offset="70%" stopColor="#95633a" />
              <stop offset="100%" stopColor="#452a15" />
            </linearGradient>
            <linearGradient id="lamp-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5f5c57" />
              <stop offset="35%" stopColor="#d9d5ce" />
              <stop offset="55%" stopColor="#f4f1eb" />
              <stop offset="100%" stopColor="#6a665f" />
            </linearGradient>
            <radialGradient id="lamp-glass-off" cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#c8d2dc" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#e6ecf2" stopOpacity="0.16" />
            </radialGradient>
            <radialGradient id="lamp-glass-lit" cx="50%" cy="58%" r="60%">
              <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ffe2a3" stopOpacity="0.88" />
              <stop offset="75%" stopColor="#ffd08a" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#f2b55a" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id="lamp-leather" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a5a31" />
              <stop offset="100%" stopColor="#4d2f16" />
            </linearGradient>
            <radialGradient id="lamp-stone" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#d4cfc7" />
              <stop offset="55%" stopColor="#8a857d" />
              <stop offset="100%" stopColor="#47433e" />
            </radialGradient>
          </defs>

          <text className="lamp-clock" x={g.ax} y={g.cord * 0.72} textAnchor="middle">
            {clock}
          </text>

          <g ref={lampRef} transform={`translate(${g.ax} 0)`}>
            <polygon
              className={`lamp-cone${flicker > 0 ? ' is-flicker' : ''}`}
              key={`c-${flicker}`}
              points={`${-g.shadeW * 0.4},${g.yRim} ${g.shadeW * 0.4},${g.yRim} ${g.h * 0.6},${g.h * 1.25} ${-g.h * 0.6},${g.h * 1.25}`}
              fill="url(#lamp-cone)"
              filter="url(#lamp-soft)"
            />
            <line x1={0} y1={0} x2={0} y2={g.cord} stroke="#4a4744" strokeWidth={1.5} />
            <rect x={-8} y={g.cord - 4} width={16} height={14} rx={3} fill="#2b2a28" />
            <path
              d={`M ${-g.shadeW / 2} ${g.yRim} C ${-g.shadeW / 2} ${g.yTop - 6}, ${g.shadeW / 2} ${g.yTop - 6}, ${g.shadeW / 2} ${g.yRim} Z`}
              fill="url(#lamp-shade)"
            />
            <ellipse className="lamp-rim" cx={0} cy={g.yRim} rx={g.shadeW / 2} ry={5} />
            <circle
              className="lamp-halo"
              cx={0}
              cy={g.bulbCy}
              r={g.shadeW * 0.75}
              fill="url(#lamp-halo)"
            />
            <Bulb g={g} broken={broken} flicker={flicker} />
          </g>

          <g>
            <SlingshotFrame g={g} />
            <defs>
              <path id="lamp-band-back" ref={bandBackRef} d="" />
              <path id="lamp-band-front" ref={bandFrontRef} d="" />
            </defs>
            <use href="#lamp-band-back" fill="none" stroke="#6e4118" strokeWidth={5} strokeLinecap="round" />
            <use href="#lamp-band-back" fill="none" stroke="#c98a45" strokeWidth={3.2} strokeLinecap="round" />
            <g ref={pouchRef} transform={`translate(${g.restX} ${g.restY})`}>
              <path
                d="M -12 -2 Q -11 8 0 9.5 Q 11 8 12 -2 Q 6 1.5 0 1.5 Q -6 1.5 -12 -2 Z"
                fill="url(#lamp-leather)"
                stroke="#34200f"
                strokeWidth={0.8}
              />
              <path
                d="M -9 0.5 Q -8 6.5 0 7.5 Q 8 6.5 9 0.5"
                fill="none"
                stroke="#d9b98a"
                strokeWidth={0.6}
                strokeDasharray="1.6 1.4"
                opacity={0.7}
              />
            </g>
            <circle ref={pebbleRef} cx={g.restX} cy={g.restY} r={PEBBLE_R} fill="url(#lamp-stone)" />
            <use href="#lamp-band-front" fill="none" stroke="#6e4118" strokeWidth={5} strokeLinecap="round" />
            <use href="#lamp-band-front" fill="none" stroke="#d99a52" strokeWidth={3.2} strokeLinecap="round" />
            <use href="#lamp-band-front" fill="none" stroke="#f6d19a" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
          </g>
        </svg>
      ) : null}

      {g ? (
        <div
          className="lamp-switch"
          style={{ left: g.sw.x, top: g.sw.y, width: g.sw.w, height: g.sw.h }}
        >
          <span className="lamp-switch__label">ON</span>
          <button
            type="button"
            className={`lamp-switch__toggle${on ? ' is-on' : ''}`}
            onClick={toggleSwitch}
            aria-pressed={on}
            aria-label="Light switch"
          >
            <span className="lamp-switch__dot" aria-hidden />
          </button>
          <span className="lamp-switch__label">OFF</span>
        </div>
      ) : null}

      {shards.map((s) => (
        <span
          key={s.id}
          className="lamp-shard"
          style={
            {
              left: s.x,
              top: s.y,
              '--dx': `${s.dx}px`,
              '--dy': `${s.dy}px`,
              '--r': `${s.r}deg`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}

      <div className="lamp-bottom">
        <button type="button" className="landing-btn-primary lamp-continue" onClick={onComplete}>
          Continue
        </button>
        <div className="lamp-progress" aria-label={`Step ${step} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`story-progress__dot${i < step ? ' is-on' : ''}`} />
          ))}
        </div>
        <button type="button" className="lamp-skip" onClick={onSkip}>
          Skip to message
        </button>
        <p className="lamp-hint">
          flip the switch · pull the pebble back and let go · grab the shade to swing it
        </p>
      </div>
    </section>
  );
}
