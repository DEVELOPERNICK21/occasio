import { useId } from 'react';

type Props = {
  color: string;
};

/**
 * A latex balloon, drawn to look like one. Rubber is see-through: the middle lets the page
 * show through, the rim is deeper in colour because the light crosses more rubber there, a soft
 * window reflection sits top left, a faint glow of transmitted light bottom right, and the neck
 * ends in a tied knot with a curling string. Where two overlap you can see one through the other.
 *
 * `color` is the balloon's rubber. Everything else is white or a dark tint of it, so any colour works.
 */
export function BalloonArt({ color }: Props) {
  const uid = useId().replace(/:/g, '');
  const body = 'M24 2C11 2 2 13 2 27C2 43 14 55 22 60H26C34 55 46 43 46 27C46 13 37 2 24 2Z';

  return (
    <svg viewBox="0 0 48 84" width="100%" height="100%" aria-hidden>
      <defs>
        <radialGradient id={`${uid}-rubber`} cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor={color} stopOpacity="0.26" />
          <stop offset="55%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.86" />
        </radialGradient>
        <radialGradient id={`${uid}-rim`} cx="50%" cy="46%" r="56%">
          <stop offset="58%" stopColor="#2A1020" stopOpacity="0" />
          <stop offset="100%" stopColor="#2A1020" stopOpacity="0.26" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="66%" cy="72%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-window`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={body} fill={`url(#${uid}-rubber)`} />
      <path d={body} fill={`url(#${uid}-rim)`} />
      <path d={body} fill={`url(#${uid}-glow)`} />

      <ellipse cx="15.5" cy="17" rx="5" ry="9.5" fill={`url(#${uid}-window)`} transform="rotate(-24 15.5 17)" />
      <ellipse cx="12.6" cy="10.6" rx="1.7" ry="2.9" fill="#ffffff" opacity="0.92" transform="rotate(-24 12.6 10.6)" />
      <path
        d="M41 33C39.6 42 34 50 27 55"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.38"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path d="M22 59.4C23.4 58.4 24.6 58.4 26 59.4L27.4 64.6C25.4 66.2 22.6 66.2 20.6 64.6Z" fill={color} fillOpacity="0.9" />
      <path d="M22 59.4C23.4 58.4 24.6 58.4 26 59.4L27.4 64.6C25.4 66.2 22.6 66.2 20.6 64.6Z" fill="#2A1020" fillOpacity="0.2" />
      <path d="M22.6 61C23.6 60.5 24.4 60.5 25.4 61" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.7" strokeLinecap="round" />

      <path
        d="M24 66C20 70.5 28.5 74 23.5 78.5C21.5 80.5 24 82 24.6 83"
        fill="none"
        stroke="#5B4A57"
        strokeOpacity="0.55"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
