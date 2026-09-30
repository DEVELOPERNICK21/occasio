'use client';

import { useId } from 'react';
import type { Costume, MomentTheme } from '@/lib/experience/momentTheme';

export type PipMood = 'hopeful' | 'shocked' | 'cry' | 'sassy' | 'joy' | 'wink';

type Props = {
  mood: PipMood;
  theme: MomentTheme;
  /** Rendered width in px; height follows the artwork's aspect ratio. */
  size?: number;
  /** Show the wrapped gift Pip hides behind its back (hopeful/wink). */
  holdsGift?: boolean;
  className?: string;
};

const INK = '#2B1B2E';
const MOUTH = '#5B1F2E';
const TONGUE = '#FF7A93';

function Eyes({ mood, uid, lid }: { mood: PipMood; uid: string; lid: string }) {
  switch (mood) {
    case 'shocked':
      return (
        <g>
          <ellipse cx="86" cy="120" rx="23" ry="29" fill="#fff" />
          <ellipse cx="154" cy="120" rx="23" ry="29" fill="#fff" />
          <circle cx="86" cy="122" r="5.5" fill={INK} />
          <circle cx="154" cy="122" r="5.5" fill={INK} />
          <path d="M62 82Q86 66 110 80" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M130 80Q154 66 178 82" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'cry':
      return (
        <g>
          <ellipse cx="86" cy="122" rx="19" ry="22" fill="#fff" />
          <ellipse cx="154" cy="122" rx="19" ry="22" fill="#fff" />
          <circle cx="86" cy="126" r="14" fill={INK} />
          <circle cx="154" cy="126" r="14" fill={INK} />
          <circle cx="91" cy="119" r="6" fill="#fff" />
          <circle cx="149" cy="119" r="6" fill="#fff" />
          <circle cx="82" cy="133" r="3" fill="#fff" opacity=".85" />
          <circle cx="158" cy="133" r="3" fill="#fff" opacity=".85" />
          <path d="M66 134Q86 152 106 134Q86 143 66 134Z" fill="#8FD3FF" opacity=".9" />
          <path d="M134 134Q154 152 174 134Q154 143 134 134Z" fill="#8FD3FF" opacity=".9" />
          <path d="M64 100Q84 100 108 88" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M132 88Q156 100 176 100" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'sassy':
      return (
        <g>
          <clipPath id={`${uid}-eyes`}>
            <ellipse cx="86" cy="122" rx="19" ry="23" />
            <ellipse cx="154" cy="122" rx="19" ry="23" />
          </clipPath>
          <ellipse cx="86" cy="122" rx="19" ry="23" fill="#fff" />
          <ellipse cx="154" cy="122" rx="19" ry="23" fill="#fff" />
          <circle cx="96" cy="124" r="11" fill={INK} />
          <circle cx="164" cy="124" r="11" fill={INK} />
          <circle cx="99" cy="120" r="3.6" fill="#fff" />
          <circle cx="167" cy="120" r="3.6" fill="#fff" />
          <g clipPath={`url(#${uid}-eyes)`}>
            <rect x="60" y="90" width="120" height="25" fill={lid} />
          </g>
          <path d="M66 115H106" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M134 115H174" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M64 92Q86 70 108 84" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M134 94L176 100" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      );
    case 'joy':
      return (
        <g>
          <path d="M66 126Q86 96 106 126" stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M134 126Q154 96 174 126" stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <path d="M66 126Q86 96 106 126" stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <ellipse cx="154" cy="122" rx="19" ry="24" fill="#fff" />
          <circle cx="152" cy="126" r="13" fill={INK} />
          <circle cx="147" cy="119" r="5.2" fill="#fff" />
          <circle cx="157" cy="133" r="2.6" fill="#fff" opacity=".9" />
          <path d="M132 92Q154 78 176 90" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'hopeful':
    default:
      return (
        <g className="pip-blink">
          <ellipse cx="86" cy="122" rx="19" ry="24" fill="#fff" />
          <ellipse cx="154" cy="122" rx="19" ry="24" fill="#fff" />
          <circle cx="88" cy="126" r="13.5" fill={INK} />
          <circle cx="152" cy="126" r="13.5" fill={INK} />
          <circle cx="93" cy="119" r="5.4" fill="#fff" />
          <circle cx="147" cy="119" r="5.4" fill="#fff" />
          <circle cx="83" cy="132" r="2.6" fill="#fff" opacity=".9" />
          <circle cx="157" cy="132" r="2.6" fill="#fff" opacity=".9" />
          <path d="M66 94Q86 80 106 92" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M134 92Q154 80 174 94" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: PipMood }) {
  switch (mood) {
    case 'shocked':
      return (
        <g>
          <ellipse cx="120" cy="171" rx="11" ry="15" fill={MOUTH} />
          <ellipse cx="120" cy="179" rx="7" ry="6" fill={TONGUE} />
        </g>
      );
    case 'cry':
      return (
        <g className="pip-wail">
          <path d="M96 182Q120 148 144 182Q120 170 96 182Z" fill={MOUTH} />
          <ellipse cx="120" cy="176" rx="8" ry="4" fill={TONGUE} />
        </g>
      );
    case 'sassy':
      return <path d="M104 166Q124 170 142 154" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />;
    case 'joy':
      return (
        <g>
          <path d="M90 150Q120 200 150 150Z" fill={MOUTH} />
          <path d="M97 152Q120 160 143 152L141 148Q120 155 99 148Z" fill="#fff" />
          <ellipse cx="120" cy="177" rx="12" ry="8" fill={TONGUE} />
        </g>
      );
    case 'wink':
      return (
        <g>
          <path d="M98 156Q120 178 142 156" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <ellipse cx="134" cy="171" rx="7" ry="9" fill={TONGUE} />
        </g>
      );
    case 'hopeful':
    default:
      return <path d="M103 158Q120 174 137 158" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />;
  }
}

function CostumeLayer({ costume, shocked }: { costume: Costume; shocked: boolean }) {
  switch (costume) {
    case 'party_hat':
      return (
        <g transform="rotate(-9 120 44)">
          <path d="M82 46L120 -32L158 46Z" fill="#FF4D6D" />
          <path d="M98 14L142 14L150 32L90 32Z" fill="#FFD166" />
          <path d="M104 -2L136 -2L141 10L99 10Z" fill="#3A86FF" opacity=".85" />
          <ellipse cx="120" cy="46" rx="41" ry="8.5" fill="#FFB703" />
          <circle cx="120" cy="-33" r="10" fill="#fff" />
          <circle cx="117" cy="-36" r="3.5" fill="#fff" opacity=".8" />
        </g>
      );
    case 'rose':
      return (
        <g>
          <g transform="translate(120 204)">
            <path d="M0 0L-24 -12L-24 14Z" fill="#C21F4A" />
            <path d="M0 0L24 -12L24 14Z" fill="#C21F4A" />
            <rect x="-6" y="-8" width="12" height="16" rx="4" fill="#9C1338" />
          </g>
          <g transform="translate(210 112) rotate(14)">
            <path d="M0 8L-4 62" stroke="#3E8E5A" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="9" cy="40" rx="11" ry="5" fill="#4FA96B" transform="rotate(-30 9 40)" />
            <circle cx="0" cy="0" r="17" fill="#C21F4A" />
            <path d="M-11 -4Q0 -18 11 -4Q4 8 -11 -4Z" fill="#E4405F" />
            <path d="M-6 2Q0 -8 8 2Q2 8 -6 2Z" fill="#9C1338" />
            <circle cx="-6" cy="-9" r="2.8" fill="#fff" opacity=".5" />
          </g>
        </g>
      );
    case 'flower_crown':
      return (
        <g>
          <path d="M66 62Q120 22 174 62" stroke="#5FA357" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[
            [68, 60, '#FF8FA3'],
            [92, 44, '#FFD166'],
            [120, 36, '#FFFFFF'],
            [148, 44, '#B49BFF'],
            [172, 60, '#FF8FA3'],
          ].map(([x, y, c]) => (
            <g key={String(x)} transform={`translate(${x} ${y})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={Number((Math.cos((a * Math.PI) / 180) * 7).toFixed(2))} cy={Number((Math.sin((a * Math.PI) / 180) * 7).toFixed(2))} r="5.6" fill={String(c)} />
              ))}
              <circle r="4.2" fill="#FFC233" />
            </g>
          ))}
          <ellipse cx="105" cy="38" rx="8" ry="4" fill="#5FA357" transform="rotate(-20 105 38)" />
          <ellipse cx="136" cy="38" rx="8" ry="4" fill="#5FA357" transform="rotate(20 136 38)" />
        </g>
      );
    case 'medal':
      return (
        <g transform="translate(120 190)">
          <path d="M-18 -8L0 22L18 -8Z" fill="#EF476F" />
          <path d="M-8 -8L0 8L8 -8Z" fill="#FF8FA3" />
          <circle cy="30" r="20" fill="#E0A11A" />
          <circle cy="30" r="16" fill="#FFD166" />
          <path d="M0 18l4.6 9.4 10.2 1.4-7.4 7.2 1.8 10.2L0 40.4l-9.2 4.8 1.8-10.2-7.4-7.2 10.2-1.4z" fill="#FFF3B0" />
        </g>
      );
    case 'shades':
    default:
      return (
        <g className={`pip-shades${shocked ? ' is-slipped' : ''}`}>
          <rect x="58" y="102" width="56" height="38" rx="16" fill="#1B1426" />
          <rect x="126" y="102" width="56" height="38" rx="16" fill="#1B1426" />
          <path d="M114 116Q120 110 126 116" stroke="#1B1426" strokeWidth="5" fill="none" />
          <path d="M66 110L82 110" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
          <path d="M134 110L150 110" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        </g>
      );
  }
}

function Violin() {
  return (
    <g className="pip-violin" transform="translate(198 184) rotate(-28) scale(1.3)">
      <ellipse cx="0" cy="8" rx="15" ry="19" fill="#A0522D" stroke="#6B3418" strokeWidth="2" />
      <ellipse cx="0" cy="-14" rx="11" ry="13" fill="#A0522D" stroke="#6B3418" strokeWidth="2" />
      <rect x="-3" y="-52" width="6" height="30" rx="2" fill="#3A2312" />
      <path d="M-5 6Q-1 10 -5 16M5 6Q1 10 5 16" stroke="#3A2312" strokeWidth="2" fill="none" />
      <g className="pip-bow">
        <line x1="-26" y1="-4" x2="30" y2="20" stroke="#E8D5A3" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

/**
 * Pip: Occasio's original mascot. Six moods, one costume per moment, and a few
 * gag props (tiny violin, steam) for the gate's escalating jokes.
 */
export function Pip({ mood, theme, size = 220, holdsGift = false, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const { light, base, shade, cheek } = theme.mascot;
  const cheekOpacity = mood === 'joy' || mood === 'wink' ? 0.85 : mood === 'sassy' ? 0.35 : 0.6;

  return (
    <svg
      className={`pip${className ? ` ${className}` : ''}`}
      data-mood={mood}
      viewBox="-20 -46 280 310"
      width={size}
      height={(size * 310) / 280}
      role="img"
      aria-label={`Pip looking ${mood}`}
    >
      <defs>
        <radialGradient id={`${uid}-body`} cx="36%" cy="26%" r="82%">
          <stop offset="0%" stopColor={light} />
          <stop offset="58%" stopColor={base} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="247" rx="80" ry="9" fill="#000" opacity=".16" />

      <g className="pip-bob">
        {/* feet */}
        <ellipse cx="84" cy="236" rx="27" ry="12" fill={shade} />
        <ellipse cx="156" cy="236" rx="27" ry="12" fill={shade} />

        {/* sprout when there is no hat or crown */}
        {theme.costume !== 'party_hat' && theme.costume !== 'flower_crown' ? (
          <g className="pip-sprout">
            <path d="M120 30Q116 10 128 -6" stroke="#4FA96B" strokeWidth="5" strokeLinecap="round" fill="none" />
            <ellipse cx="139" cy="-8" rx="15" ry="7.5" fill="#5FBF7E" transform="rotate(-24 139 -8)" />
            <ellipse cx="116" cy="4" rx="12" ry="6" fill="#4FA96B" transform="rotate(28 116 4)" />
          </g>
        ) : null}

        {/* arms: down normally, raised for joy */}
        {mood === 'joy' ? (
          <g className="pip-arms-up">
            <ellipse cx="14" cy="104" rx="15" ry="27" fill={base} transform="rotate(-38 14 104)" />
            <ellipse cx="226" cy="104" rx="15" ry="27" fill={base} transform="rotate(38 226 104)" />
          </g>
        ) : (
          <g>
            <ellipse cx="22" cy="152" rx="15" ry="27" fill={base} transform="rotate(14 22 152)" />
            <ellipse cx="218" cy="152" rx="15" ry="27" fill={base} transform="rotate(-14 218 152)" />
          </g>
        )}

        {/* body */}
        <path
          d="M120 24C178 24 214 76 214 138C214 196 178 232 120 232C62 232 26 196 26 138C26 76 62 24 120 24Z"
          fill={`url(#${uid}-body)`}
        />
        <ellipse cx="78" cy="70" rx="30" ry="17" fill="#fff" opacity=".28" transform="rotate(-24 78 70)" />
        <path d="M44 176Q52 216 96 226" stroke="#000" strokeOpacity=".06" strokeWidth="10" fill="none" strokeLinecap="round" />

        <ellipse cx="56" cy="152" rx="15" ry="9.5" fill={cheek} opacity={cheekOpacity} />
        <ellipse cx="184" cy="152" rx="15" ry="9.5" fill={cheek} opacity={cheekOpacity} />

        <Eyes mood={mood} uid={uid} lid={base} />
        <Mouth mood={mood} />

        {/* wrapped gift held in front */}
        {holdsGift && (mood === 'hopeful' || mood === 'wink') ? (
          <g className="pip-gift">
            <rect x="82" y="182" width="76" height="52" rx="8" fill="#FF6B7A" />
            <rect x="112" y="182" width="16" height="52" fill="#FFD166" />
            <rect x="82" y="200" width="76" height="12" fill="#FFD166" opacity=".9" />
            <ellipse cx="108" cy="178" rx="16" ry="9" fill="#FFD166" transform="rotate(-18 108 178)" />
            <ellipse cx="132" cy="178" rx="16" ry="9" fill="#FFC233" transform="rotate(18 132 178)" />
            <circle cx="120" cy="182" r="6" fill="#FFB703" />
            <ellipse cx="80" cy="214" rx="12" ry="15" fill={base} />
            <ellipse cx="160" cy="214" rx="12" ry="15" fill={base} />
          </g>
        ) : null}

        <CostumeLayer costume={theme.costume} shocked={mood === 'shocked'} />

        {mood === 'shocked' ? (
          <g>
            <path className="pip-sweat" d="M206 76q12 18 0 27q-12-9 0-27z" fill="#8FD3FF" />
            <text className="pip-bang" x="196" y="20" fontSize="46" fontWeight="800" fill={INK} fontFamily="Georgia, serif">!?</text>
            <g className="pip-steam" fill="#fff" opacity=".85">
              <circle cx="-2" cy="88" r="8" />
              <circle cx="-12" cy="70" r="6" />
              <circle cx="242" cy="88" r="8" />
              <circle cx="252" cy="70" r="6" />
            </g>
          </g>
        ) : null}

        {mood === 'cry' ? (
          <g>
            <path className="pip-tear" d="M78 140C70 168 66 198 64 236" stroke="#7CC8FF" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".85" />
            <path className="pip-tear pip-tear--b" d="M162 140C170 168 174 198 176 236" stroke="#7CC8FF" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".85" />
            <Violin />
          </g>
        ) : null}

        {mood === 'joy' ? (
          <g className="pip-sparkles" fill="#FFD166">
            <path d="M-6 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
            <path d="M244 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
            <path d="M232 -10l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
