'use client';

import { useId } from 'react';

type IconProps = { accent: string; secondary: string };

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export function CameraIcon({ accent, secondary }: IconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 100" width="116" height="97" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={accent} stopOpacity=".78" />
        </linearGradient>
        <radialGradient id={`${uid}-g`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#9fd4ff" />
          <stop offset=".55" stopColor="#2c5f9e" />
          <stop offset="1" stopColor="#0f2547" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="94" rx="44" ry="5" fill="#000" opacity=".16" />
      <rect x="38" y="12" width="46" height="18" rx="7" fill={secondary} />
      <rect x="10" y="24" width="100" height="66" rx="14" fill={`url(#${uid}-b)`} />
      <rect x="10" y="66" width="100" height="24" rx="12" fill="#FFF8EE" />
      <rect x="84" y="30" width="16" height="9" rx="3" fill="#FFF3B0" />
      <rect x="18" y="32" width="14" height="9" rx="3" fill="#2B1B2E" opacity=".25" />
      <circle cx="60" cy="58" r="27" fill="#2B1B2E" />
      <circle cx="60" cy="58" r="21" fill="#4a3a52" />
      <circle cx="60" cy="58" r="16" fill={`url(#${uid}-g)`} />
      <ellipse cx="53" cy="51" rx="6" ry="4" fill="#fff" opacity=".75" transform="rotate(-30 53 51)" />
      <circle cx="98" cy="76" r="4" fill={secondary} />
    </svg>
  );
}

export function JarIcon({ accent, secondary }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const hearts: Array<[number, number, number, string]> = [
    [40, 92, 20, accent],
    [66, 98, 22, secondary],
    [52, 74, 18, '#FF8FA3'],
    [72, 78, 16, accent],
    [36, 68, 14, '#FFD3DC'],
    [60, 58, 15, secondary],
  ];
  return (
    <svg viewBox="0 0 110 130" width="100" height="118" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <ellipse cx="55" cy="124" rx="38" ry="5" fill="#000" opacity=".16" />
      <path
        d="M22 36h66c8 4 12 12 12 22v48c0 10-8 16-18 16H28c-10 0-18-6-18-16V58c0-10 4-18 12-22z"
        fill={`url(#${uid}-glass)`}
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="2"
      />
      {hearts.map(([cx, cy, s, c], i) => (
        <g key={i} transform={`translate(${cx - s / 2} ${cy - s / 2}) scale(${s / 24}) rotate(${(i - 2) * 9} 12 12)`}>
          <path d={HEART} fill={c} />
        </g>
      ))}
      <rect x="26" y="10" width="58" height="18" rx="6" fill={secondary} />
      <rect x="30" y="26" width="50" height="10" rx="3" fill="#D9B98A" />
      <path d="M22 50c-2 14-2 34 0 52" stroke="#fff" strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function EnvelopeIcon({ accent, secondary }: IconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 130 100" width="120" height="92" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#F2E3CF" />
        </linearGradient>
      </defs>
      <ellipse cx="65" cy="94" rx="48" ry="5" fill="#000" opacity=".16" />
      <rect x="8" y="22" width="114" height="68" rx="9" fill={`url(#${uid}-e)`} stroke="#D8C3A5" strokeWidth="2" />
      <path d="M8 26L65 64L122 26" fill="#F7EBDA" stroke="#D8C3A5" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 88L52 54M122 88L78 54" stroke="#E3D2B8" strokeWidth="2" />
      <circle cx="65" cy="62" r="15" fill={accent} />
      <circle cx="65" cy="62" r="10.5" fill={secondary} opacity=".55" />
      <g transform="translate(57.5 54.5) scale(0.62)">
        <path d={HEART} fill="#fff" />
      </g>
    </svg>
  );
}
