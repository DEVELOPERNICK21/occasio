'use client';

import { useId } from 'react';
import type { EventKind } from '@/lib/invitationTheme';
import styles from './invitation.module.css';
import { useInvitationTheme } from './theme';

/**
 * The artwork of the invitations, drawn in SVG so nothing is downloaded and it stays sharp at any
 * size. Original shapes: marigold flowers on a string, bunting, a mandala, clay lamps, stars, a
 * little map. Colours come from the occasion's palette, so one drawing serves every look.
 */

/** A line of flags hung along a gentle curve, in the colours of the occasion. */
export function Bunting({ className }: { className?: string }) {
  const { palette } = useInvitationTheme();
  const flags = 11;
  const width = 440;
  const colours = [palette.pop, palette.alert, palette.primary, ...palette.confetti.slice(0, 2)];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} 64`}
      preserveAspectRatio="xMidYMin slice"
      width="100%"
      aria-hidden
      focusable="false"
    >
      <path d={`M0 4 Q${width / 2} 34 ${width} 4`} fill="none" stroke="#8A6B2F" strokeWidth="1.4" />
      {Array.from({ length: flags }, (_, i) => {
        const t = (i + 0.5) / flags;
        const x = t * width;
        const y = 4 + 30 * t * (1 - t) * 2;
        return (
          <path
            key={i}
            d={`M${x - 14} ${y} L${x + 14} ${y} L${x} ${y + 30} Z`}
            fill={colours[i % colours.length]}
            stroke="#fff"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />
        );
      })}
    </svg>
  );
}

/** Two lines and a small ornament between them, drawn for the look: lotus, dots and a star, sprig, or arch. */
export function Divider({ className }: { className?: string }) {
  const { palette, look } = useInvitationTheme();
  return (
    <svg className={className} viewBox="0 0 220 24" width="220" height="24" aria-hidden focusable="false" data-reveal="draw">
      <path d="M0 12 H86" stroke={palette.accent} strokeWidth="1" pathLength="1" />
      <path d="M134 12 H220" stroke={palette.accent} strokeWidth="1" pathLength="1" />
      {look === 'regal' ? (
        <g transform="translate(110 12)">
          {[-50, 0, 50].map((turn) => (
            <ellipse key={turn} cx="0" cy="-5" rx="3.2" ry="7" fill={palette.pop} transform={`rotate(${turn})`} />
          ))}
          <circle r="2.2" fill={palette.alert} />
        </g>
      ) : null}
      {look === 'party' ? (
        <g transform="translate(110 12)">
          <circle cx="-14" cy="2" r="3.2" fill={palette.confetti[1]} />
          <path d="M0 -8 L2.4 -2.6 L8 -2 L3.8 1.8 L5 7.4 L0 4.6 L-5 7.4 L-3.8 1.8 L-8 -2 L-2.4 -2.6 Z" fill={palette.pop} />
          <circle cx="14" cy="2" r="3.2" fill={palette.confetti[2]} />
        </g>
      ) : null}
      {look === 'sage' ? (
        <g transform="translate(110 12)">
          <path d="M-14 4 C -8 2, -4 0, 0 -6" stroke={palette.primary} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M14 4 C 8 2, 4 0, 0 -6" stroke={palette.primary} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <ellipse cx="-9" cy="-1" rx="5" ry="2.4" transform="rotate(-30 -9 -1)" fill={palette.pop} fillOpacity="0.85" />
          <ellipse cx="9" cy="-1" rx="5" ry="2.4" transform="rotate(30 9 -1)" fill={palette.pop} fillOpacity="0.85" />
          <circle cx="0" cy="-7" r="2" fill={palette.accent} />
        </g>
      ) : null}
      {look === 'palace' ? (
        <g transform="translate(110 12)">
          <path d="M-12 8 V0 C-12 -7 -4 -10 0 -12 C4 -10 12 -7 12 0 V8" fill="none" stroke={palette.accent} strokeWidth="1.4" />
          <path d="M-6 8 V1 C-6 -3 -2 -5 0 -6 C2 -5 6 -3 6 1 V8" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="1" />
          <circle cx="0" cy="-13" r="1.8" fill={palette.pop} />
        </g>
      ) : null}
    </svg>
  );
}

/** A large ring of petals that turns slowly behind the portrait as the page scrolls. */
export function Mandala({ className }: { className?: string }) {
  const { palette } = useInvitationTheme();
  return (
    <svg className={className} viewBox="-100 -100 200 200" aria-hidden focusable="false">
      <circle r="97" fill="none" stroke={palette.accent} strokeWidth="0.6" />
      <circle r="90" fill="none" stroke={palette.accent} strokeWidth="0.4" strokeDasharray="1 3" />
      {Array.from({ length: 24 }, (_, i) => (
        <ellipse
          key={`o${i}`}
          cx="0"
          cy="-76"
          rx="6.5"
          ry="19"
          fill={i % 2 === 0 ? palette.accentSoft : 'none'}
          fillOpacity="0.5"
          stroke={palette.accent}
          strokeWidth="0.6"
          transform={`rotate(${i * 15})`}
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse
          key={`i${i}`}
          cx="0"
          cy="-48"
          rx="5"
          ry="14"
          fill="none"
          stroke={palette.pop}
          strokeWidth="0.7"
          strokeOpacity="0.8"
          transform={`rotate(${i * 22.5})`}
        />
      ))}
      <circle r="30" fill="none" stroke={palette.accent} strokeWidth="0.6" />
      <circle r="22" fill="none" stroke={palette.accent} strokeWidth="0.4" strokeDasharray="2 2" />
    </svg>
  );
}

/** The party's version of the mandala: rays of light that turn behind the photo. */
export function Sunburst({ className }: { className?: string }) {
  const { palette } = useInvitationTheme();
  const rays = 20;
  return (
    <svg className={className} viewBox="-100 -100 200 200" aria-hidden focusable="false">
      {Array.from({ length: rays }, (_, i) => {
        const a = ((i * 360) / rays) * (Math.PI / 180);
        const b = (((i + 0.5) * 360) / rays) * (Math.PI / 180);
        return (
          <path
            key={i}
            d={`M0 0 L${(Math.sin(a) * 100).toFixed(2)} ${(-Math.cos(a) * 100).toFixed(2)} L${(Math.sin(b) * 100).toFixed(2)} ${(-Math.cos(b) * 100).toFixed(2)} Z`}
            fill={i % 2 === 0 ? palette.accentSoft : palette.pop}
            fillOpacity={i % 2 === 0 ? 0.55 : 0.18}
          />
        );
      })}
    </svg>
  );
}

/** The party's token: an outline star that fills in and sparkles when collected. */
export function StarToken({ className }: { className?: string }) {
  const { palette } = useInvitationTheme();
  const star = 'M24 4 L29.4 17.2 L43.6 18.2 L32.7 27.4 L36.2 41.2 L24 33.6 L11.8 41.2 L15.3 27.4 L4.4 18.2 L18.6 17.2 Z';
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden focusable="false">
      <circle className={styles.lampGlow} cx="24" cy="24" r="23" fill={palette.accent} opacity="0" />
      <path d={star} fill="none" stroke={palette.accent} strokeWidth="2" strokeLinejoin="round" />
      <path d={star} className={styles.starFill} fill={palette.pop} stroke={palette.pop} strokeWidth="2" strokeLinejoin="round" />
      <circle className={styles.lampFlame} cx="36" cy="9" r="2.2" fill={palette.accent} />
      <circle className={styles.lampFlame} cx="10" cy="40" r="1.6" fill={palette.accent} />
    </svg>
  );
}

/** A small picture for each kind of event, in one stroke weight so they read as a set. */
export function EventIcon({ kind, className }: { kind: EventKind; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {kind === 'henna' ? (
        <>
          <path d="M7 24 L13 8 L18 13 Z" />
          <path d="M19 25c2-3 4-3 6 0M21 19c2-2 4-2 6 0" />
          <circle cx="24" cy="10" r="2" />
        </>
      ) : null}
      {kind === 'music' ? (
        <>
          <path d="M12 24V8l12-3v16" />
          <circle cx="9" cy="24" r="3" />
          <circle cx="21" cy="21" r="3" />
        </>
      ) : null}
      {kind === 'turmeric' ? (
        <>
          <circle cx="16" cy="16" r="5" />
          <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M24.5 7.5l-2 2M9.5 22.5l-2 2" />
        </>
      ) : null}
      {kind === 'ceremony' ? (
        <>
          <path d="M16 4c4 5 6 8 3 13a5 5 0 0 1-6 0c-3-5-1-8 3-13z" />
          <path d="M8 27h16M11 23l-2 4M21 23l2 4" />
        </>
      ) : null}
      {kind === 'ring' ? (
        <>
          <circle cx="12" cy="20" r="6" />
          <circle cx="20" cy="20" r="6" />
          <path d="M13 8l2-3h2l2 3-3 3z" />
        </>
      ) : null}
      {kind === 'puja' || kind === 'other' ? (
        <>
          <path d="M16 26c-6 0-9-4-10-9 4 0 8 2 10 9 2-7 6-9 10-9-1 5-4 9-10 9z" />
          <path d="M16 26c-3-3-4-8 0-14 4 6 3 11 0 14z" />
        </>
      ) : null}
      {kind === 'dinner' ? (
        <>
          <circle cx="16" cy="17" r="8" />
          <circle cx="16" cy="17" r="3.5" />
          <path d="M4 6v8M7 6v8M4 10h3M5.5 14v12M28 6v20" />
        </>
      ) : null}
      {kind === 'cake' ? (
        <>
          <path d="M6 27h20v-9H6zM6 22c4 3 6-3 10 0s6-3 10 0" />
          <path d="M16 13v5M16 6c2 2 2 4 0 6-2-2-2-4 0-6z" />
        </>
      ) : null}
      {kind === 'games' ? (
        <>
          <rect x="6" y="6" width="20" height="20" rx="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="20" cy="12" r="1" fill="currentColor" />
          <circle cx="16" cy="16" r="1" fill="currentColor" />
          <circle cx="12" cy="20" r="1" fill="currentColor" />
          <circle cx="20" cy="20" r="1" fill="currentColor" />
        </>
      ) : null}
      {kind === 'drinks' ? (
        <>
          <path d="M9 5h14l-2 10a5 5 0 0 1-10 0z" />
          <path d="M16 20v7M11 27h10" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * A made-up little map: streets, a park, a route that draws itself as the page scrolls, and a pin
 * that drops. It is a picture of "somewhere to go", not the real map: the button opens the real one.
 */
export function MapArt({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const { palette } = useInvitationTheme();
  const route = 'M34 178 C 78 150, 96 112, 148 112 S 214 104, 244 70';
  return (
    <svg className={className} viewBox="0 0 320 200" aria-hidden focusable="false">
      <defs>
        <mask id={`${id}-reveal`}>
          <path className={styles.routeReveal} d={route} stroke="#fff" strokeWidth="14" fill="none" pathLength="1" />
        </mask>
      </defs>
      <rect width="320" height="200" fill={palette.accentSoft} fillOpacity="0.45" />
      <path d="M-10 40 C 60 70, 120 20, 200 54 S 300 40, 340 70" stroke={palette.primary} strokeOpacity="0.2" strokeWidth="26" fill="none" />
      <ellipse cx="258" cy="150" rx="46" ry="30" fill={palette.primary} fillOpacity="0.14" />
      <ellipse cx="62" cy="64" rx="34" ry="22" fill={palette.primary} fillOpacity="0.1" />
      <g stroke={palette.paper} strokeLinecap="round" fill="none">
        <path d="M0 120 H320" strokeWidth="9" />
        <path d="M110 0 V200" strokeWidth="9" />
        <path d="M0 176 L320 90" strokeWidth="6" />
        <path d="M210 0 L180 200" strokeWidth="7" />
        <path d="M0 22 H320" strokeWidth="4" />
        <path d="M0 150 H320" strokeWidth="3" />
        <path d="M280 0 V200" strokeWidth="3" />
        <path d="M60 0 V200" strokeWidth="3" />
      </g>
      <path
        d={route}
        mask={`url(#${id}-reveal)`}
        stroke={palette.primary}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="1 7"
        fill="none"
      />
      <circle cx="34" cy="178" r="6" fill={palette.paper} stroke={palette.primary} strokeWidth="2.4" />
      <g transform="translate(244 70)">
        <ellipse className={styles.pinShadow} cx="0" cy="3" rx="9" ry="3" fill="#000" opacity="0.18" />
        <g className={styles.pinBody}>
          <path d="M0 0 C-13 -17 -17 -24 -17 -31 A17 17 0 0 1 17 -31 C17 -24 13 -17 0 0 Z" fill={palette.alert} />
          <circle cx="0" cy="-31" r="6.6" fill={palette.paper} />
        </g>
      </g>
    </svg>
  );
}

/** An ink stamp that thumps onto the pass: words round the edge, a star in the middle. */
export function Stamp({ text, className }: { text: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  // The words go once round the ring; a short phrase is said twice so the ring never looks empty.
  const unit = `${text} \u2022 `;
  const ring = (text.length + 3 >= 18 ? unit : unit + unit).trim();
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden focusable="false">
      <defs>
        <path id={`${id}-ring`} d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text fill="currentColor" fontSize="10.5" fontWeight="700">
        <textPath href={`#${id}-ring`} startOffset="0" textLength="250" lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <path
        d="M60 42 L65 54 L78 55 L68 63.5 L71.5 76 L60 69 L48.5 76 L52 63.5 L42 55 L55 54 Z"
        fill="currentColor"
      />
    </svg>
  );
}
