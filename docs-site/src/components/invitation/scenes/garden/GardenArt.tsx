/**
 * What is still drawn in the garden invitation: a small icon. The gate, the curtains and the garden
 * are photographs and cloth (GardenGate, garden.module.css).
 */

/** A coat hanger, for the dress code. */
export function Hanger({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M 16 9 V 7 a 3 3 0 1 1 3 3" />
      <path d="M 16 9 L 4 21 a 2 2 0 0 0 1.4 3.4 H 26.6 A 2 2 0 0 0 28 21 Z" />
    </svg>
  );
}
