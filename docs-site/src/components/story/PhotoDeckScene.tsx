'use client';

import { useRef, useState } from 'react';

type Props = {
  urls: string[];
  onComplete: () => void;
};

/** Fan offsets for cards behind the top Polaroid (HeartCraft-style stack). */
const BEHIND = [
  { x: -14, y: 10, rot: -7 },
  { x: 16, y: 16, rot: 6 },
  { x: -8, y: 22, rot: -3 },
] as const;

export function PhotoDeckScene({ urls, onComplete }: Props) {
  const photos = urls.map((u) => u.trim()).filter(Boolean);
  const [top, setTop] = useState(0);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const remaining = photos.slice(top);
  const done = remaining.length === 0;

  const dismissTop = () => {
    setTop((t) => t + 1);
    setDx(0);
  };

  if (photos.length === 0 || done) {
    return (
      <section className="story-photos">
        <h2 className="story-scene-title">Sweet moments</h2>
        <button type="button" className="landing-btn-primary" onClick={onComplete}>
          Continue
        </button>
      </section>
    );
  }

  const topUrl = remaining[0]!;
  const behind = remaining.slice(1, 4);

  return (
    <section className="story-photos">
      <h2 className="story-scene-title">Sweet moments</h2>
      <p className="story-scene-sub">
        Swipe the cards · {remaining.length} left
      </p>
      <div
        className="story-polaroid-stack"
        onPointerDown={(e) => {
          dragging.current = true;
          startX.current = e.clientX;
          setDx(0);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setDx(e.clientX - startX.current);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          if (Math.abs(dx) > 72) {
            dismissTop();
          } else {
            setDx(0);
          }
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDx(0);
        }}
      >
        {/* Behind cards first (lower z) */}
        {behind.map((url, i) => {
          const layer = behind.length - 1 - i;
          const pose = BEHIND[layer] ?? BEHIND[0];
          return (
            <figure
              key={`behind-${top + 1 + i}-${url.slice(-12)}`}
              className="story-polaroid story-polaroid--behind"
              style={{
                zIndex: 1 + i,
                transform: `translate(-50%, -50%) translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg)`,
              }}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} />
              <figcaption className="story-polaroid__caption"> </figcaption>
            </figure>
          );
        })}

        {/* Top swipable card */}
        <figure
          className="story-polaroid story-polaroid--top"
          style={{
            zIndex: 20,
            transform: `translate(-50%, -50%) translate(${dx}px, 0) rotate(${dx / 36}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={topUrl}
            alt=""
            draggable={false}
            onError={() => dismissTop()}
          />
          <figcaption className="story-polaroid__caption">Happy birthday</figcaption>
        </figure>
      </div>
      {remaining.length > 1 ? (
        <button
          type="button"
          className="story-deck-next"
          onClick={dismissTop}
        >
          Next photo
        </button>
      ) : null}
      <button type="button" className="landing-btn-primary" onClick={onComplete}>
        Continue
      </button>
    </section>
  );
}
