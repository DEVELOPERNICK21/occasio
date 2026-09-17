'use client';

import { useState } from 'react';

type Props = {
  urls: string[];
  onComplete: () => void;
};

export function PhotoDeckScene({ urls, onComplete }: Props) {
  const photos = urls.map((u) => u.trim()).filter(Boolean);
  const [top, setTop] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const current = photos[top];
  const done = top >= photos.length;

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

  return (
    <section className="story-photos">
      <h2 className="story-scene-title">Sweet moments</h2>
      <p className="story-scene-sub">Swipe the cards</p>
      <div
        className="story-polaroid-stack"
        onPointerDown={(e) => {
          setDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setDx((d) => d + e.movementX);
        }}
        onPointerUp={() => {
          setDragging(false);
          if (Math.abs(dx) > 80) {
            setTop((t) => t + 1);
          }
          setDx(0);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt=""
          className="story-polaroid"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)` }}
          draggable={false}
          onError={() => setTop((t) => t + 1)}
        />
      </div>
      <button type="button" className="landing-btn-primary" onClick={onComplete}>
        Continue
      </button>
    </section>
  );
}
