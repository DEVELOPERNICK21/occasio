'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** True once the scene's job is done and moving on makes sense. */
  active: boolean;
  onContinue: () => void;
  label?: string;
};

const ARM_DELAY_MS = 700;

/**
 * "Tap anywhere to continue". Arms shortly after the scene finishes so the tap
 * that completed the interaction cannot also skip the payoff. The scene keeps
 * its real Continue button, so this is an extra path, not the only one.
 */
export function TapToContinue({ active, onContinue, label = 'Tap anywhere to continue' }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!active) {
      setArmed(false);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <>
      <button
        type="button"
        className="tap-zone"
        tabIndex={-1}
        aria-hidden
        onClick={() => {
          if (armed) onContinue();
        }}
      />
      {armed ? (
        <p className="tap-hint" aria-hidden>
          {label}
        </p>
      ) : null}
    </>
  );
}
