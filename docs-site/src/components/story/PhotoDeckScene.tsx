'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  urls: string[];
  onComplete: () => void;
  captions?: string[];
};

const BEHIND = [
  { x: -14, y: 10, rot: -7 },
  { x: 16, y: 16, rot: 6 },
  { x: -8, y: 22, rot: -3 },
] as const;

const CAPTIONS = [
  'Happy birthday',
  'Celebrating you',
  'Sweet moments',
  'With love',
] as const;

type ExitDir = 'left' | 'right' | null;

export function PhotoDeckScene({ urls, onComplete, captions }: Props) {
  const photos = urls.map((u) => u.trim()).filter(Boolean);
  const [top, setTop] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [exiting, setExiting] = useState<ExitDir>(null);
  const [entering, setEntering] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  const remaining = photos.slice(top);
  const done = remaining.length === 0;

  useEffect(() => {
    if (top === 0) return;
    setEntering(true);
    const id = window.setTimeout(() => setEntering(false), 380);
    return () => window.clearTimeout(id);
  }, [top]);

  const finishDismiss = useCallback((dir: 'left' | 'right') => {
    setExiting(dir);
    window.setTimeout(() => {
      setTop((t) => t + 1);
      setDx(0);
      setDy(0);
      setExiting(null);
    }, 280);
  }, []);

  const dismissTop = useCallback(
    (dir: 'left' | 'right' = dx >= 0 ? 'right' : 'left') => {
      if (exiting) return;
      finishDismiss(dir);
    },
    [dx, exiting, finishDismiss],
  );

  if (photos.length === 0 || done) {
    return (
      <section className="story-photos">
        <h2 className="story-scene-title">Sweet moments</h2>
        <div className="story-cta">
          <button type="button" className="landing-btn-primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      </section>
    );
  }

  const topUrl = remaining[0]!;
  const behind = remaining.slice(1, 4);
  const caption =
    captions?.[top] ?? CAPTIONS[top % CAPTIONS.length] ?? 'Happy birthday';

  const dragOpacity = Math.max(0.55, 1 - Math.abs(dx) / 220);
  const exitTransform =
    exiting === 'left'
      ? 'translate(-50%, -50%) translate(-120vw, -20px) rotate(-28deg)'
      : exiting === 'right'
        ? 'translate(-50%, -50%) translate(120vw, -20px) rotate(28deg)'
        : null;

  return (
    <section className="story-photos">
      <h2 className="story-scene-title">Sweet moments</h2>
      <p className="story-scene-sub">
        Swipe through · {remaining.length} left
      </p>
      <div
        className="story-polaroid-stack"
        onPointerDown={(e) => {
          if (exiting) return;
          dragging.current = true;
          startX.current = e.clientX;
          startY.current = e.clientY;
          setDx(0);
          setDy(0);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current || exiting) return;
          setDx(e.clientX - startX.current);
          setDy((e.clientY - startY.current) * 0.35);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          if (Math.abs(dx) > 72) {
            dismissTop(dx >= 0 ? 'right' : 'left');
          } else {
            setDx(0);
            setDy(0);
          }
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDx(0);
          setDy(0);
        }}
      >
        {behind.map((url, i) => {
          const layer = behind.length - 1 - i;
          const pose = BEHIND[layer] ?? BEHIND[0]!;
          const lift = Math.min(1, Math.abs(dx) / 120);
          return (
            <figure
              key={`behind-${top + 1 + i}-${url.slice(-12)}`}
              className="story-polaroid story-polaroid--behind"
              style={{
                zIndex: 1 + i,
                transform: `translate(-50%, -50%) translate(${pose.x * (1 - lift * 0.4)}px, ${pose.y * (1 - lift * 0.5)}px) rotate(${pose.rot * (1 - lift * 0.5)}deg) scale(${0.94 + lift * 0.04})`,
              }}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} />
              <figcaption className="story-polaroid__caption"> </figcaption>
            </figure>
          );
        })}

        <figure
          className={`story-polaroid story-polaroid--top${entering ? ' is-entering' : ''}${exiting ? ' is-exiting' : ''}`}
          style={{
            zIndex: 20,
            opacity: exiting ? 0.85 : dragOpacity,
            transform:
              exitTransform ??
              `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${dx / 28}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={topUrl}
            alt=""
            draggable={false}
            onError={() => dismissTop('right')}
          />
          <figcaption className="story-polaroid__caption">{caption}</figcaption>
        </figure>

        {Math.abs(dx) > 40 && !exiting ? (
          <span
            className={`story-swipe-hint${dx > 0 ? ' is-right' : ' is-left'}`}
            aria-hidden
          >
            {dx > 0 ? 'Next →' : '← Next'}
          </span>
        ) : null}
      </div>
      {remaining.length > 1 ? (
        <div className="story-cta">
          <button
            type="button"
            className="story-deck-next"
            onClick={() => dismissTop('right')}
            disabled={!!exiting}
          >
            Next photo
          </button>
          <button type="button" className="landing-btn-primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      ) : (
        <div className="story-cta">
          <button type="button" className="landing-btn-primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      )}
    </section>
  );
}
