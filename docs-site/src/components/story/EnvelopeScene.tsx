'use client';

import { useCallback, useState } from 'react';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  recipientName: string;
  templateType?: string;
  onComplete: () => void;
};

export function EnvelopeScene({
  recipientName,
  templateType = 'birthday',
  onComplete,
}: Props) {
  const name = recipientName.trim() || 'you';
  const copy = storyCopyFor(templateType);
  const [opened, setOpened] = useState(false);

  const open = useCallback(() => {
    if (opened) return;
    setOpened(true);
    window.setTimeout(() => onComplete(), 720);
  }, [opened, onComplete]);

  return (
    <section
      className={`story-envelope-scene${opened ? ' is-open' : ''}`}
      aria-label="Open the letter"
    >
      <h2 className="story-scene-title">{copy.envelopeTitle(name)}</h2>
      <p className="story-scene-sub">
        {opened ? 'Opening…' : 'Tap the envelope to open'}
      </p>

      <button
        type="button"
        className={`story-envelope${opened ? ' is-opening' : ''}`}
        onClick={open}
        disabled={opened}
        aria-label="Open the letter"
      >
        <span className="story-envelope__glow" aria-hidden />
        <svg
          className="story-envelope__svg"
          viewBox="0 0 240 160"
          width="220"
          height="148"
          aria-hidden
        >
          <defs>
            <linearGradient id="env-face" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF8F2" />
              <stop offset="100%" stopColor="#F5E6DC" />
            </linearGradient>
            <linearGradient id="env-flap" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCEEE8" />
              <stop offset="100%" stopColor="#E8D0C4" />
            </linearGradient>
          </defs>
          <rect
            x="16"
            y="48"
            width="208"
            height="100"
            rx="6"
            fill="url(#env-face)"
            stroke="#C9A99A"
            strokeWidth="2"
          />
          <g className="story-envelope__flap">
            <path
              d="M16 48 L120 118 L224 48 Z"
              fill="url(#env-flap)"
              stroke="#C9A99A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
          <circle cx="120" cy="92" r="18" fill="#E8615D" />
          <circle cx="120" cy="92" r="12" fill="#C94E4A" opacity="0.85" />
          <path
            d="M120 100 C112 94 108 90 108 86 C108 83 110 81 113 81 C115 81 117 82 120 85 C123 82 125 81 127 81 C130 81 132 83 132 86 C132 90 128 94 120 100 Z"
            fill="#FFF8F2"
          />
        </svg>
        {!opened ? <span className="story-envelope__hint">Open me</span> : null}
      </button>
    </section>
  );
}
