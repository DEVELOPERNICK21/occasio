'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { haptic, prefersReducedMotion } from '../../scroll';
import { foilLeft, heartPath, isRevealed, scratchedShare } from './scratch';
import styles from './garden.module.css';

type Props = {
  /** What is underneath: shown inside the heart once the foil is gone. */
  children: ReactNode;
  /** Called once, the moment the date is revealed. */
  onReveal: (heart: HTMLElement) => void;
  /** Words for the button that does it without scratching. */
  skipLabel: string;
};

const BRUSH = 46;
/** How many moves between two checks of how much foil is left: reading the canvas is the costly part. */
const CHECK_EVERY = 28;

/**
 * A heart of green foil with the date underneath. Scratch it with a finger (or a mouse) and the foil
 * comes away; once more than half has gone the rest fades and the date is shown. It is a real
 * canvas, so what you scratch is what comes off. There is always a button to reveal it without
 * scratching, and with reduced motion it is shown straight away.
 */
export function ScratchHeart({ children, onReveal, skipLabel }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const original = useRef(0);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);
  const done = useRef(false);

  const reveal = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setRevealed(true);
    haptic(20);
    if (wrap.current) onReveal(wrap.current);
  }, [onReveal]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      reveal();
      return;
    }
    const element = canvas.current;
    if (!element) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = element.clientWidth;
    const height = element.clientHeight;
    element.width = Math.round(width * ratio);
    element.height = Math.round(height * ratio);
    const context = element.getContext('2d', { willReadFrequently: true });
    if (!context) {
      reveal();
      return;
    }
    context.scale(ratio, ratio);

    // The foil: a green gradient inside the heart, with glitter and a few sparkles.
    context.save();
    context.clip(new Path2D(heartPath(width, height)));
    const foil = context.createLinearGradient(0, 0, width, height);
    foil.addColorStop(0, '#b7cda9');
    foil.addColorStop(0.45, '#85a577');
    foil.addColorStop(1, '#5f8053');
    context.fillStyle = foil;
    context.fillRect(0, 0, width, height);
    for (let i = 0; i < 1600; i += 1) {
      const light = Math.random() > 0.5;
      context.fillStyle = light ? `rgba(255,255,240,${0.1 + Math.random() * 0.4})` : `rgba(30,60,30,${0.08 + Math.random() * 0.22})`;
      context.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    context.strokeStyle = 'rgba(255,255,255,0.8)';
    context.lineWidth = 1;
    for (let i = 0; i < 70; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const arm = 1.5 + Math.random() * 3;
      context.beginPath();
      context.moveTo(x - arm, y);
      context.lineTo(x + arm, y);
      context.moveTo(x, y - arm);
      context.lineTo(x, y + arm);
      context.stroke();
    }
    const sheen = context.createLinearGradient(0, 0, width, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = sheen;
    context.fillRect(0, 0, width, height);
    context.restore();

    original.current = foilLeft(context.getImageData(0, 0, element.width, element.height).data);
  }, [reveal]);

  const check = useCallback(() => {
    const element = canvas.current;
    const context = element?.getContext('2d', { willReadFrequently: true });
    if (!element || !context || done.current) return;
    const left = foilLeft(context.getImageData(0, 0, element.width, element.height).data);
    if (isRevealed(scratchedShare(original.current, left))) reveal();
  }, [reveal]);

  const erase = (event: PointerEvent<HTMLCanvasElement>) => {
    const element = canvas.current;
    const context = element?.getContext('2d', { willReadFrequently: true });
    if (!element || !context) return;
    const box = element.getBoundingClientRect();
    const point = { x: event.clientX - box.left, y: event.clientY - box.top };
    const from = last.current ?? point;
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = BRUSH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    last.current = point;
  };

  const width = 300;
  const height = 270;

  return (
    <div ref={wrap} className={styles.heartWrap} data-revealed={revealed ? '' : undefined}>
      <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="gardenHeartClip" clipPathUnits="objectBoundingBox">
            <path d={heartPath(1, 1, 4)} />
          </clipPath>
        </defs>
      </svg>
      <div className={styles.heartPane}>{children}</div>
      <svg className={styles.heartLine} viewBox={`0 0 ${width} ${height}`} aria-hidden focusable="false">
        <path d={heartPath(width, height)} fill="none" stroke="#c9a646" strokeWidth="3" />
        <path d={heartPath(width, height)} fill="none" stroke="rgba(255,248,214,0.8)" strokeWidth="1" transform="translate(0 -1.5)" />
      </svg>
      <canvas
        ref={canvas}
        className={styles.foil}
        aria-hidden
        onPointerDown={(event) => {
          if (done.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          last.current = null;
          erase(event);
        }}
        onPointerMove={(event) => {
          if (!drawing.current || done.current) return;
          erase(event);
          moves.current += 1;
          if (moves.current % CHECK_EVERY === 0) check();
        }}
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
          check();
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
        }}
      />
      {revealed ? null : (
        <button type="button" className={styles.skip} onClick={reveal}>
          {skipLabel}
        </button>
      )}
    </div>
  );
}
