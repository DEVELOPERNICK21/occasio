'use client';

/**
 * What is drawn in the palace invitation: the gold-lined arch. The gate, the wall and the terrace are
 * photographs (PalaceGate, palace.module.css). Everything sits on one 400 by 800 stage so the pieces
 * line up at any screen size.
 */

const GOLD = '#d4a840';

const ARCH_D =
  'M 20 640 V 270 C 20 150 80 90 142 60 C 170 48 186 30 200 6 C 214 30 230 48 258 60 C 320 90 380 150 380 270 V 640';

/** The same outline with x and y divided by the 400 by 640 box, which is what a clip in box units wants. */
const ARCH_UNIT =
  'M 0.05 1 V 0.421875 C 0.05 0.234375 0.2 0.140625 0.355 0.09375 C 0.425 0.075 0.465 0.046875 0.5 0.009375 C 0.535 0.046875 0.575 0.075 0.645 0.09375 C 0.8 0.140625 0.95 0.234375 0.95 0.421875 V 1 Z';

/**
 * The arch of the room. It is a pale pane at first, then plum satin fills it as you scroll (the
 * `--b` variable, see `.plum`), with a cream and gold frame round it. The same outline, in box
 * units, is the clip for the satin.
 */
export function ArchFrame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 640" preserveAspectRatio="none" aria-hidden focusable="false">
      <defs>
        <clipPath id="palaceArch" clipPathUnits="objectBoundingBox">
          <path d={ARCH_UNIT} />
        </clipPath>
      </defs>
      <path d={`${ARCH_D} Z`} fill="#f7fbfd" fillOpacity="0.74" />
      <path d={ARCH_D} fill="none" stroke="#fbf6e9" strokeWidth="9" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={ARCH_D} fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
