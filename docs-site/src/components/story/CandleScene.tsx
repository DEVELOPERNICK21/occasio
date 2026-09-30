'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CakeStage, type CakeStageHandle } from '@/components/story/gift3d/CakeStage';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { useMicBlow } from '@/components/story/fx/useMicBlow';
import { momentThemeFor } from '@/lib/experience/momentTheme';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import { playCakeSlice, playCandleBlow } from '@/lib/experience/playBalloonPop';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  recipientName: string;
  templateType?: string;
  onComplete: () => void;
};

type CandleState = 'lit' | 'blowing' | 'out';
type Phase = 'candles' | 'cut' | 'done';
type Trail = { x1: number; y1: number; x2: number; y2: number };

const AIR_STREAKS = Array.from({ length: 14 }, (_, i) => i);

const CANDLES = [
  { x: 92, band: '#8FC7E8' },
  { x: 116, band: '#F6A6C1' },
  { x: 140, band: '#B9DE8A' },
];

const CUT_X = 160;
const MIN_SWIPE = 50;

const CONFETTI_COLORS = ['#F25C88', '#F6D35A', '#8FC7E8', '#B9DE8A', '#FF9F43'];
const CONFETTI = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2;
  const dist = 80 + (i % 3) * 32;
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist - 36),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rot: (i * 67) % 360,
    delay: (i % 4) * 0.03,
  };
});

const SPRINKLES = [
  { x: 58, y: 206, r: 20, c: '#F6D35A' },
  { x: 80, y: 228, r: -30, c: '#8FC7E8' },
  { x: 176, y: 204, r: 40, c: '#FFFFFF' },
  { x: 188, y: 226, r: -12, c: '#B9DE8A' },
  { x: 150, y: 230, r: 60, c: '#F6D35A' },
  { x: 72, y: 150, r: -40, c: '#F25C88' },
  { x: 166, y: 150, r: 25, c: '#8FC7E8' },
];

function dripPath(x0: number, x1: number, y: number, depth: number): string {
  const n = Math.max(2, Math.round((x1 - x0) / 20));
  const step = (x1 - x0) / n;
  let d = `M${x0} ${y + 10} L${x0} ${y + 7} Q${x0} ${y} ${x0 + 8} ${y} L${x1 - 8} ${y} Q${x1} ${y} ${x1} ${y + 7} L${x1} ${y + 10}`;
  for (let i = 0; i < n; i += 1) {
    const xa = x1 - step * i;
    const xb = xa - step;
    const deep = i % 2 === 0 ? depth : depth * 0.5;
    d += ` Q${xa - step / 2} ${y + 10 + deep} ${xb} ${y + 10}`;
  }
  return `${d} Z`;
}

function CakeBody() {
  return (
    <g>
      <rect x="28" y="238" width="184" height="12" rx="6" fill="#F0C94A" stroke="#1A1A1A" strokeWidth="3.5" />

      <rect x="36" y="170" width="168" height="70" rx="12" fill="#F25C88" stroke="#1A1A1A" strokeWidth="3.5" />
      <path d="M42 196 L52 192 L52 232 L42 228 Z" fill="#FF8AAD" opacity="0.85" />
      <path d={dripPath(36, 204, 170, 12)} fill="#FFF8F0" stroke="#1A1A1A" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="120" y="224" textAnchor="middle" fill="#1A1A1A" fontSize="24" className="story-cake-art__label">
        LOVE
      </text>

      <rect x="60" y="120" width="120" height="52" rx="12" fill="#F6D35A" stroke="#1A1A1A" strokeWidth="3.5" />
      <path d="M66 140 L74 136 L74 166 L66 162 Z" fill="#FFF0A0" opacity="0.9" />
      <path d={dripPath(60, 180, 120, 10)} fill="#FFF8F0" stroke="#1A1A1A" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="120" y="162" textAnchor="middle" fill="#1A1A1A" fontSize="20" className="story-cake-art__label">
        WISH
      </text>

      {SPRINKLES.map((s) => (
        <rect
          key={`${s.x}-${s.y}`}
          x={s.x - 4}
          y={s.y - 1.5}
          width="8"
          height="3"
          rx="1.5"
          fill={s.c}
          stroke="#1A1A1A"
          strokeWidth="0.8"
          transform={`rotate(${s.r} ${s.x} ${s.y})`}
        />
      ))}
    </g>
  );
}

function CandleSceneSvg({
  recipientName,
  templateType = 'birthday',
  onComplete,
}: Props) {
  const name = recipientName.trim() || 'you';
  const copy = storyCopyFor(templateType);
  const { award } = useJoy();
  const [candles, setCandles] = useState<CandleState[]>(() => CANDLES.map(() => 'lit'));
  const [smoke, setSmoke] = useState<boolean[]>(() => CANDLES.map(() => false));
  const [phase, setPhase] = useState<Phase>('candles');
  const [blowing, setBlowing] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [listening, setListening] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const candlesRef = useRef(candles);
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);
  const micStopRef = useRef<(() => void) | null>(null);
  const timersRef = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      micStopRef.current?.();
    },
    [],
  );

  const allOut = candles.every((s) => s === 'out');
  useEffect(() => {
    if (!allOut || phase !== 'candles') return;
    const t = window.setTimeout(() => {
      setPhase('cut');
      setBurstKey((k) => k + 1);
    }, 450);
    return () => window.clearTimeout(t);
  }, [allOut, phase]);

  const blowCandle = useCallback(
    (i: number) => {
      award(`candle:${i}`);
      setCandles((prev) => prev.map((s, j) => (j === i ? 'blowing' : s)));
      later(() => {
        setCandles((prev) => prev.map((s, j) => (j === i ? 'out' : s)));
        setSmoke((prev) => prev.map((s, j) => (j === i ? true : s)));
      }, 320);
      later(() => setSmoke((prev) => prev.map((s, j) => (j === i ? false : s))), 1600);
    },
    [later, award],
  );

  const puff = useCallback(() => {
    playCandleBlow();
    setBlowing(true);
    later(() => setBlowing(false), 900);
  }, [later]);

  const blowNext = useCallback(() => {
    const i = candlesRef.current.indexOf('lit');
    if (i < 0) return;
    puff();
    blowCandle(i);
  }, [blowCandle, puff]);

  const blowAll = useCallback(() => {
    const lit = candlesRef.current
      .map((s, i) => (s === 'lit' ? i : -1))
      .filter((i) => i >= 0);
    if (lit.length === 0) return;
    puff();
    lit.forEach((i, n) => later(() => blowCandle(i), n * 140));
  }, [blowCandle, later, puff]);

  const listen = useCallback(async () => {
    if (listening) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicBlocked(true);
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
        micStopRef.current = null;
        setListening(false);
      };
      micStopRef.current = stop;
      setListening(true);

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        loudFrames = rms > 0.12 ? loudFrames + 1 : Math.max(0, loudFrames - 1);
        if (loudFrames > 6) {
          blowAll();
          stop();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicBlocked(true);
    }
  }, [blowAll, listening]);

  const cutCake = useCallback(() => {
    playCakeSlice();
    award('cake:cut');
    setTrail(null);
    setPhase('done');
    later(() => setBurstKey((k) => k + 1), 380);
  }, [later, award]);

  const toSvg = (e: ReactPointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'cut') return;
    const p = toSvg(e);
    if (!p) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer may already be released
    }
    setTrail({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'cut' || !trail) return;
    const p = toSvg(e);
    if (p) setTrail({ ...trail, x2: p.x, y2: p.y });
  };

  const onPointerUp = () => {
    if (phase !== 'cut' || !trail) return;
    if (trail.y2 - trail.y1 >= MIN_SWIPE) cutCake();
    else setTrail(null);
  };

  const onClick = () => {
    if (phase === 'candles') blowNext();
    else if (phase === 'cut' && !trail) cutCake();
  };

  const litCount = candles.filter((s) => s !== 'out').length;
  const sub =
    phase === 'candles'
      ? copy.candleSubLit
      : phase === 'cut'
        ? copy.candleSubOut
        : 'A slice, just for you';

  return (
    <section
      className={`story-candle${blowing ? ' is-blowing' : ''}${phase !== 'candles' ? ' is-out' : ''}`}
      aria-label="Blow the candles"
    >
      <h2 className="story-scene-title">{copy.candleTitle(name)}</h2>
      <p className="story-scene-sub">{sub}</p>

      {blowing ? (
        <div className="story-air" aria-hidden>
          {AIR_STREAKS.map((i) => (
            <span
              key={i}
              className="story-air__streak"
              style={{
                top: `${12 + (i % 7) * 11}%`,
                animationDelay: `${i * 0.03}s`,
                opacity: 0.25 + (i % 4) * 0.1,
              }}
            />
          ))}
          <div className="story-air__haze" />
        </div>
      ) : null}

      <button
        type="button"
        className={`story-cake-art is-${phase}${blowing ? ' is-blowing' : ''}`}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setTrail(null)}
        disabled={phase === 'done'}
        aria-label={
          phase === 'candles'
            ? `Blow out a candle, ${litCount} left`
            : phase === 'cut'
              ? 'Cut the cake'
              : 'Cake cut'
        }
      >
        {burstKey > 0 ? (
          <span key={burstKey} className="story-burst" aria-hidden>
            {CONFETTI.map((p, i) => (
              <span
                key={i}
                className="story-burst__piece"
                style={
                  {
                    '--dx': `${p.dx}px`,
                    '--dy': `${p.dy}px`,
                    '--rot': `${p.rot}deg`,
                    background: p.color,
                    animationDelay: `${p.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ) : null}

        <svg
          ref={svgRef}
          viewBox="0 34 240 222"
          width="240"
          height="222"
          className="story-cake-art__svg"
          aria-hidden
        >
          <defs>
            <clipPath id="cake-left">
              <rect x="0" y="0" width={CUT_X} height="270" />
            </clipPath>
            <clipPath id="cake-right">
              <rect x={CUT_X} y="0" width={240 - CUT_X} height="270" />
            </clipPath>
          </defs>

          <g clipPath={phase === 'done' ? 'url(#cake-left)' : undefined}>
            <CakeBody />
            {CANDLES.map((c, i) => (
              <g key={c.x}>
                <rect x={c.x} y="84" width="10" height="38" rx="3" fill="#FFF8E8" stroke="#1A1A1A" strokeWidth="2.5" />
                <rect x={c.x + 1.5} y="92" width="7" height="4" fill={c.band} />
                <rect x={c.x + 1.5} y="102" width="7" height="4" fill={c.band} />
                <rect x={c.x + 1.5} y="112" width="7" height="4" fill={c.band} />
                <line x1={c.x + 5} y1="78" x2={c.x + 5} y2="84" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" />
                {candles[i] !== 'out' ? (
                  <g
                    className={`story-cake-art__flame${candles[i] === 'blowing' ? ' is-leaning' : ''}`}
                    style={{ transformOrigin: `${c.x + 5}px 80px` }}
                  >
                    <ellipse cx={c.x + 5} cy="66" rx="7" ry="12" fill="#FF9F43" />
                    <ellipse cx={c.x + 5} cy="69" rx="3.2" ry="6" fill="#FFEAA7" />
                  </g>
                ) : null}
                {smoke[i] ? (
                  <g className="story-cake-art__smoke" opacity="0.55">
                    <path d={`M${c.x + 5} 76 Q${c.x - 1} 64 ${c.x + 3} 50`} fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round" />
                    <path d={`M${c.x + 7} 76 Q${c.x + 13} 62 ${c.x + 9} 48`} fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" />
                  </g>
                ) : null}
              </g>
            ))}
          </g>

          {phase === 'done' ? (
            <g>
              <rect x={CUT_X - 6} y="122" width="6" height="48" fill="#FCE7B2" />
              <rect x={CUT_X - 6} y="142" width="6" height="5" fill="#F25C88" />
              <rect x={CUT_X - 6} y="172" width="6" height="66" fill="#FCE7B2" />
              <rect x={CUT_X - 6} y="196" width="6" height="6" fill="#F25C88" />
              <rect x={CUT_X - 6} y="218" width="6" height="6" fill="#F25C88" />
              <line x1={CUT_X} y1="120" x2={CUT_X} y2="240" stroke="#1A1A1A" strokeWidth="2.5" />
            </g>
          ) : null}

          {phase === 'done' ? (
            <g className="story-cake-art__slice">
              <g clipPath="url(#cake-right)">
                <CakeBody />
              </g>
              <rect x={CUT_X} y="122" width="6" height="48" fill="#FCE7B2" />
              <rect x={CUT_X} y="142" width="6" height="5" fill="#F25C88" />
              <rect x={CUT_X} y="172" width="6" height="66" fill="#FCE7B2" />
              <rect x={CUT_X} y="196" width="6" height="6" fill="#F25C88" />
              <rect x={CUT_X} y="218" width="6" height="6" fill="#F25C88" />
              <line x1={CUT_X} y1="120" x2={CUT_X} y2="240" stroke="#1A1A1A" strokeWidth="2.5" />
            </g>
          ) : null}

          {phase === 'cut' && !trail ? (
            <line
              className="story-cake-art__guide"
              x1={CUT_X}
              y1="108"
              x2={CUT_X}
              y2="246"
              stroke="#1A1A1A"
              strokeWidth="2"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
          ) : null}

          {trail ? (
            <line
              x1={trail.x1}
              y1={trail.y1}
              x2={trail.x2}
              y2={trail.y2}
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.9"
              className="story-cake-art__trail"
            />
          ) : null}
        </svg>
      </button>

      <div className="story-hint-row" aria-live="polite">
        {phase === 'candles' ? (
          <>
            <span className="story-hint-chip">
              {litCount} {litCount === 1 ? 'candle' : 'candles'} left · tap the cake
            </span>
            {!micBlocked ? (
              <button
                type="button"
                className="story-hint-chip story-hint-chip--action"
                onClick={listen}
                disabled={listening}
              >
                {listening ? 'Listening… blow now' : 'Or blow into your mic'}
              </button>
            ) : null}
          </>
        ) : null}
        {phase === 'cut' ? (
          <span className="story-hint-chip">Swipe down the line to cut a slice</span>
        ) : null}
      </div>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={phase === 'candles'}
          onClick={onComplete}
        >
          Continue
        </button>
      </div>
      <TapToContinue active={phase === 'done'} onContinue={onComplete} />
    </section>
  );
}

const CANDLE_COUNT = 3;

function CandleScene3D({
  recipientName,
  templateType = 'birthday',
  onComplete,
  onFail,
}: Props & { onFail: () => void }) {
  const name = recipientName.trim() || 'you';
  const theme = momentThemeFor(templateType);
  const copy = storyCopyFor(templateType);
  const { award } = useJoy();
  const stage = useRef<CakeStageHandle>(null);
  const [lit, setLit] = useState<boolean[]>(() => Array.from({ length: CANDLE_COUNT }, () => true));
  const litRef = useRef(lit);
  litRef.current = lit;
  const [phase, setPhase] = useState<Phase>('candles');
  const [blowing, setBlowing] = useState(false);
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const litCount = lit.filter(Boolean).length;
  useEffect(() => {
    if (litCount !== 0 || phase !== 'candles') return;
    const t = window.setTimeout(() => {
      setPhase('cut');
      stage.current?.celebrate('out');
    }, 650);
    return () => window.clearTimeout(t);
  }, [litCount, phase]);

  const puff = useCallback(() => {
    playCandleBlow();
    setBlowing(true);
    later(() => setBlowing(false), 900);
  }, [later]);

  const blowIndex = useCallback(
    (i: number) => {
      stage.current?.blow(i);
      setLit((cur) => cur.map((v, j) => (j === i ? false : v)));
      award(`candle:${i}`);
    },
    [award],
  );

  const blowNext = useCallback(() => {
    const i = litRef.current.indexOf(true);
    if (i < 0) return;
    puff();
    blowIndex(i);
  }, [blowIndex, puff]);

  const blowAll = useCallback(() => {
    const remaining = litRef.current.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    if (remaining.length === 0) return;
    puff();
    remaining.forEach((i, n) => later(() => blowIndex(i), n * 140));
  }, [blowIndex, later, puff]);

  const mic = useMicBlow(blowAll);

  const cutCake = useCallback(() => {
    playCakeSlice();
    award('cake:cut');
    stage.current?.cut();
    setPhase('done');
  }, [award]);

  const tap = useCallback(() => {
    if (phase === 'candles') blowNext();
    else if (phase === 'cut') cutCake();
  }, [blowNext, cutCake, phase]);

  const sub =
    phase === 'candles'
      ? copy.candleSubLit
      : phase === 'cut'
        ? copy.candleSubOut
        : 'A slice, just for you';

  return (
    <section
      className={`story-candle story-candle--3d${blowing ? ' is-blowing' : ''}${phase !== 'candles' ? ' is-out' : ''}`}
      aria-label="Blow the candles"
    >
      <h2 className="story-scene-title">{copy.candleTitle(name)}</h2>
      <p className="story-scene-sub">{sub}</p>

      {blowing ? (
        <div className="story-air" aria-hidden>
          {AIR_STREAKS.map((i) => (
            <span
              key={i}
              className="story-air__streak"
              style={{
                top: `${12 + (i % 7) * 11}%`,
                animationDelay: `${i * 0.03}s`,
                opacity: 0.25 + (i % 4) * 0.1,
              }}
            />
          ))}
          <div className="story-air__haze" />
        </div>
      ) : null}

      <CakeStage
        ref={stage}
        theme={theme}
        candles={CANDLE_COUNT}
        disabled={phase === 'done'}
        ariaLabel={
          phase === 'candles'
            ? `Blow out a candle, ${litCount} left`
            : phase === 'cut'
              ? 'Cut the cake'
              : 'Cake cut'
        }
        onTap={tap}
        onFail={onFail}
      />

      <div className="story-hint-row" aria-live="polite">
        {phase === 'candles' ? (
          <>
            <span className="story-hint-chip">
              {litCount} {litCount === 1 ? 'candle' : 'candles'} left · tap the cake
            </span>
            {!mic.blocked ? (
              <button
                type="button"
                className="story-hint-chip story-hint-chip--action"
                onClick={mic.start}
                disabled={mic.listening}
              >
                {mic.listening ? 'Listening… blow now' : 'Or blow into your mic'}
              </button>
            ) : null}
          </>
        ) : null}
        {phase === 'cut' ? <span className="story-hint-chip">Tap the cake to cut a slice</span> : null}
      </div>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={phase === 'candles'}
          onClick={onComplete}
        >
          Continue
        </button>
      </div>
      <TapToContinue active={phase === 'done'} onContinue={onComplete} />
    </section>
  );
}

/** Real 3D cake where WebGL works; the flat SVG cake everywhere else. */
export function CandleScene(props: Props) {
  const [flat, setFlat] = useState(false);
  const fail = useCallback(() => setFlat(true), []);
  if (flat) return <CandleSceneSvg {...props} />;
  return <CandleScene3D {...props} onFail={fail} />;
}
