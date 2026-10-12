/**
 * What Pip says while the app waits on the network. The line changes with how
 * long it has been, so a slow connection never looks like a frozen screen. The
 * wording stays honest: it says what is happening in general, never invents
 * progress, and never promises a time.
 */
export type BusyKind =
  | 'deleteCard'
  | 'deleteAccount'
  | 'deletePerson'
  | 'creating'
  | 'saving'
  | 'working';

type Stage = {
  /** This line is shown from this many milliseconds on. */
  fromMs: number;
  line: string;
};

export const BUSY_STAGES: Record<BusyKind, readonly Stage[]> = {
  deleteCard: [
    { fromMs: 0, line: 'Turning off the link.' },
    { fromMs: 2500, line: 'Taking it out of History.' },
    { fromMs: 7000, line: 'Still working. A slow connection can take a moment.' },
  ],
  deleteAccount: [
    { fromMs: 0, line: 'Removing your cards and Vault.' },
    { fromMs: 4000, line: 'This takes a few seconds.' },
    { fromMs: 9000, line: 'Nearly done. Please keep the app open.' },
    { fromMs: 20000, line: 'Still working. A slow connection can take a minute.' },
  ],
  deletePerson: [
    { fromMs: 0, line: 'Taking them out of your Vault.' },
    { fromMs: 6000, line: 'Still working. A slow connection can take a moment.' },
  ],
  creating: [
    { fromMs: 0, line: 'Wrapping it up.' },
    { fromMs: 3000, line: 'Making a private link.' },
    { fromMs: 8000, line: 'Nearly there.' },
    { fromMs: 20000, line: 'Still working. A slow connection can take a moment.' },
  ],
  saving: [
    { fromMs: 0, line: 'Saving your changes.' },
    { fromMs: 3000, line: 'Keeping the same link.' },
    { fromMs: 8000, line: 'Still working. A slow connection can take a moment.' },
  ],
  working: [
    { fromMs: 0, line: 'One moment.' },
    { fromMs: 8000, line: 'Still working.' },
  ],
};

/**
 * Waits where Pip should stay quiet: something is being removed for good. He is
 * there so the wait is not a frozen screen, but he floats gently instead of
 * hopping, and never carries a gift.
 */
const CALM_KINDS: readonly BusyKind[] = ['deleteCard', 'deleteAccount', 'deletePerson'];

export function isCalmBusy(kind: BusyKind): boolean {
  return CALM_KINDS.includes(kind);
}

/** The line for `kind` after `elapsedMs` of waiting. */
export function busyLine(kind: BusyKind, elapsedMs: number): string {
  const stages = BUSY_STAGES[kind];
  let line = stages[0].line;
  for (const stage of stages) {
    if (elapsedMs >= stage.fromMs) line = stage.line;
  }
  return line;
}

/** When the last line appears, so the clock can stop ticking after it. */
export function lastBusyStageMs(kind: BusyKind): number {
  const stages = BUSY_STAGES[kind];
  return stages[stages.length - 1].fromMs;
}
