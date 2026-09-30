'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import { playShimmer, playTap } from '@/lib/experience/sfx';

type Props = {
  fromName?: string | null;
  recipientName: string;
  onComplete: () => void;
};

const TERMS = [
  'Valid forever, non-refundable, non-transferable.',
  'Includes unlimited hugs on request.',
  'Bad jokes are covered under this agreement.',
];

const PAD_W = 280;
const PAD_H = 92;
/** Total ink (px) before a scribble counts as a signature. */
const MIN_INK = 130;

/**
 * A joke "terms" card. The recipient signs with a finger or mouse and seals it
 * with a stamp. Drawing is optional: "just tap to agree" always works.
 */
export function ContractScene({ fromName, recipientName, onComplete }: Props) {
  const { award } = useJoy();
  const from = fromName?.trim() || 'Me';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const ink = useRef(0);
  const [inked, setInked] = useState(false);
  const [sealed, setSealed] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = PAD_W * dpr;
    c.height = PAD_H * dpr;
    c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * PAD_W,
      y: ((e.clientY - r.top) / r.height) * PAD_H,
    };
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (sealed) return;
    last.current = point(e);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // the pointer already ended; drawing still works without capture
    }
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const from0 = last.current;
    if (!from0 || sealed) return;
    const to = point(e);
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = getComputedStyle(e.currentTarget).color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from0.x, from0.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ink.current += Math.hypot(to.x - from0.x, to.y - from0.y);
    last.current = to;
    if (!inked && ink.current > MIN_INK) setInked(true);
  };
  const up = () => {
    last.current = null;
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, PAD_W, PAD_H);
    ink.current = 0;
    setInked(false);
  };

  const seal = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sealed) return;
      setSealed(true);
      playTap();
      window.setTimeout(playShimmer, 180);
      award('contract', 1, { x: e.clientX, y: e.clientY });
    },
    [award, sealed],
  );

  return (
    <section className="story-contract" aria-label="A small agreement">
      <h2 className="story-scene-title">A small agreement</h2>
      <p className="story-scene-sub">{sealed ? 'Officially official' : 'Please read, then sign'}</p>

      <div className={`story-contract__paper${sealed ? ' is-sealed' : ''}`}>
        <ul className="story-contract__terms">
          {TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>

        <div className="story-contract__sigs">
          <div>
            <p className="story-contract__sig">{from}</p>
            <p className="story-contract__role">issued by</p>
          </div>
          <div>
            <div className="story-contract__pad-wrap">
              <canvas
                ref={canvasRef}
                className="story-contract__pad"
                style={{ width: '100%', aspectRatio: `${PAD_W} / ${PAD_H}` }}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                aria-label="Signature pad"
              />
              {!inked && !sealed ? (
                <span className="story-contract__pad-hint" aria-hidden>
                  Sign here
                </span>
              ) : null}
            </div>
            <p className="story-contract__role">accepted by {recipientName.trim() || 'you'}</p>
          </div>
        </div>

        {sealed ? (
          <span className="story-contract__stamp" aria-hidden>
            Approved
          </span>
        ) : null}
      </div>

      {sealed ? (
        <button type="button" className="landing-btn-primary story-continue" onClick={onComplete}>
          Continue
        </button>
      ) : (
        <div className="story-contract__actions">
          <button
            type="button"
            className="landing-btn-primary story-continue"
            onClick={seal}
            disabled={!inked}
          >
            Seal it
          </button>
          <div className="story-contract__links">
            {inked ? (
              <button type="button" className="story-skip" onClick={clear}>
                Start over
              </button>
            ) : null}
            <button type="button" className="story-skip" onClick={seal}>
              Just tap to agree
            </button>
          </div>
        </div>
      )}
      <TapToContinue active={sealed} onContinue={onComplete} />
    </section>
  );
}
