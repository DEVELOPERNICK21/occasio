'use client';

type HeartSpec = {
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
};

const hearts: HeartSpec[] = [
  { left: '8%', top: '18%', size: 14, delay: '0s', duration: '14s', opacity: 0.22 },
  { left: '88%', top: '12%', size: 18, delay: '2s', duration: '16s', opacity: 0.18 },
  { left: '72%', top: '62%', size: 12, delay: '1s', duration: '13s', opacity: 0.2 },
  { left: '14%', top: '72%', size: 16, delay: '3s', duration: '15s', opacity: 0.16 },
  { left: '48%', top: '8%', size: 10, delay: '4s', duration: '12s', opacity: 0.14 },
  { left: '92%', top: '78%', size: 13, delay: '1.5s', duration: '17s', opacity: 0.15 },
];

function HeartIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/** Subtle floating hearts for the hero — decorative only. */
export function LandingFloatingHearts() {
  return (
    <div className="landing-hearts pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {hearts.map((heart, index) => (
        <span
          key={index}
          className="landing-heart"
          style={{
            left: heart.left,
            top: heart.top,
            opacity: heart.opacity,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
          }}
        >
          <HeartIcon size={heart.size} />
        </span>
      ))}
    </div>
  );
}
