'use client';

import { useRef, useState } from 'react';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import { classifyGesture } from '@/lib/experience/gesture';
import { playTap } from '@/lib/experience/sfx';

type Props = {
  urls: string[];
  title?: string;
  captions?: string[];
  fromName?: string | null;
  onComplete: () => void;
};

const TILTS = [-4, 3, -2, 5, -3];

/**
 * Photos pegged on a line. Tap a photo, or slide a finger across it, to flip it
 * over and read the note on the back. Every flip is a tiny discovery, so it earns
 * a star.
 */
export function PhotoLineScene({
  urls,
  title = 'Sweet moments',
  captions,
  fromName,
  onComplete,
}: Props) {
  const { award } = useJoy();
  const photos = urls.map((u) => u.trim()).filter(Boolean).slice(0, 5);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const press = useRef<{ i: number; x: number; y: number; at: number } | null>(null);
  // A slide ends in a click on some browsers; that click must not flip the photo back.
  const slid = useRef(false);
  const allFlipped = flipped.size >= photos.length;

  const flip = (i: number, at: { x: number; y: number }) => {
    playTap();
    setFlipped((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    award(`photo:${i}`, 1, at);
  };

  return (
    <section className="photoline" aria-label={title}>
      <h2 className="story-scene-title">{title}</h2>
      <p className="story-scene-sub">
        {allFlipped ? 'Every note read' : 'Tap or slide a photo to turn it over'}
      </p>

      <div className="photoline__rope" aria-hidden />
      <ul className="photoline__row">
        {photos.map((url, i) => {
          const isFlipped = flipped.has(i);
          const note = captions?.[i % (captions?.length || 1)] ?? 'This one';
          return (
            <li key={`${i}-${url.slice(-10)}`} style={{ ['--tilt' as string]: `${TILTS[i % TILTS.length]}deg`, ['--i' as string]: i }}>
              <button
                type="button"
                className={`photoline__card${isFlipped ? ' is-flipped' : ''}`}
                onPointerDown={(e) => {
                  press.current = { i, x: e.clientX, y: e.clientY, at: performance.now() };
                }}
                onPointerUp={(e) => {
                  const start = press.current;
                  press.current = null;
                  if (!start || start.i !== i) return;
                  const gesture = classifyGesture({
                    dx: e.clientX - start.x,
                    dy: e.clientY - start.y,
                    ms: performance.now() - start.at,
                  });
                  if (gesture === 'slide-left' || gesture === 'slide-right') {
                    slid.current = true;
                    window.setTimeout(() => {
                      slid.current = false;
                    }, 60);
                    flip(i, { x: e.clientX, y: e.clientY });
                  }
                }}
                onPointerCancel={() => {
                  press.current = null;
                }}
                onClick={(e) => {
                  if (slid.current) {
                    slid.current = false;
                    return;
                  }
                  flip(i, { x: e.clientX, y: e.clientY });
                }}
                aria-label={isFlipped ? `Photo ${i + 1}, showing note` : `Photo ${i + 1}, tap or slide to read the note`}
              >
                <span className="photoline__peg" aria-hidden />
                <span className="photoline__face photoline__face--front">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" draggable={false} />
                </span>
                <span className="photoline__face photoline__face--back">
                  <span className="photoline__note">{note}</span>
                  {fromName?.trim() ? (
                    <span className="photoline__sig">— {fromName.trim()}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="story-cta">
        <button type="button" className="landing-btn-primary" onClick={onComplete}>
          Continue
        </button>
      </div>
      <TapToContinue active={allFlipped} onContinue={onComplete} />
    </section>
  );
}
