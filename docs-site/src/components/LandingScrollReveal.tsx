'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Variant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
};

/** Fade/slide sections into view as the user scrolls. Respects reduced motion in CSS. */
export function LandingScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal landing-reveal--${variant} ${visible ? 'landing-reveal--visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
