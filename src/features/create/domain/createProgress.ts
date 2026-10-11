/**
 * Progress through creating a card — derived from what the person has actually
 * done, not just which screen they are on. Copy stays calm and concrete: it
 * says what comes next and why it is worth doing, never how excited to feel.
 */

export type CreateStage = 'who' | 'occasion' | 'photos' | 'frame' | 'details' | 'preview';

/** Screens a full create shows, in order. */
const FULL_FLOW: readonly CreateStage[] = [
  'who',
  'occasion',
  'photos',
  'frame',
  'details',
  'preview',
];

/** Quick Create preselects the moment and frame, so it shows fewer screens. */
const QUICK_FLOW: readonly CreateStage[] = ['photos', 'details', 'preview'];

export const STAGE_LABELS: Record<CreateStage, string> = {
  who: 'Who',
  occasion: 'Moment',
  photos: 'Photos',
  frame: 'Frame',
  details: 'Words',
  preview: 'Preview',
};

/** Rough seconds a person spends on each screen — only used for the time hint. */
const STAGE_SECONDS: Record<CreateStage, number> = {
  who: 5,
  occasion: 6,
  photos: 25,
  frame: 12,
  details: 45,
  preview: 8,
};

export type CreateProgressInput = {
  stage: CreateStage;
  isQuickCreate: boolean;
  photoCount: number;
  hasRecipient: boolean;
  hasFrom: boolean;
  hasMessage: boolean;
};

export type StageState = 'done' | 'current' | 'todo';

export type CreateProgress = {
  /** 1-based position in the flow this person is walking. */
  current: number;
  total: number;
  stageLabel: string;
  stages: { id: CreateStage; label: string; state: StageState }[];
  /** 0–1, counts partial work inside the current screen. */
  fraction: number;
  percent: number;
  timeLeft: string;
  nudge: string;
};

export function flowFor(isQuickCreate: boolean): readonly CreateStage[] {
  return isQuickCreate ? QUICK_FLOW : FULL_FLOW;
}

/** Position in the flow the user is actually walking, so a skipped screen never leaves a gap. */
export function getCreateStep(
  stage: CreateStage,
  isQuickCreate: boolean,
): { current: number; total: number } {
  const flow = flowFor(isQuickCreate);
  const index = flow.indexOf(stage);
  return { current: index === -1 ? 1 : index + 1, total: flow.length };
}

/** 0–1 of the current screen already done. */
function innerProgress(input: CreateProgressInput): number {
  switch (input.stage) {
    case 'photos':
      if (input.photoCount >= 3) return 1;
      if (input.photoCount === 2) return 0.8;
      return input.photoCount === 1 ? 0.6 : 0;
    case 'details':
      return (
        (input.hasRecipient ? 0.4 : 0) +
        (input.hasMessage ? 0.45 : 0) +
        (input.hasFrom ? 0.15 : 0)
      );
    case 'preview':
      return 0.5;
    default:
      return 0;
  }
}

function timeLeftLabel(input: CreateProgressInput, inner: number): string {
  if (input.stage === 'preview') return 'One tap to share';
  const flow = flowFor(input.isQuickCreate);
  const index = flow.indexOf(input.stage);
  const remaining = flow.reduce((sum, stage, i) => {
    if (i < index) return sum;
    return sum + STAGE_SECONDS[stage] * (i === index ? 1 - inner : 1);
  }, 0);
  if (remaining <= 30) return 'Under 30 seconds left';
  if (remaining <= 75) return 'About a minute left';
  return `About ${Math.max(2, Math.round(remaining / 60))} minutes left`;
}

function nudgeFor(input: CreateProgressInput): string {
  switch (input.stage) {
    case 'who':
      return 'Start with who it is for. The rest follows from there.';
    case 'occasion':
      return 'Pick the moment. It shapes the frames you will see.';
    case 'photos':
      if (input.photoCount === 0) return 'One photo is enough to begin.';
      if (input.photoCount < 3) return 'Good start. More photos open up more frames.';
      if (input.photoCount < 5) return 'That is a card with a story in it.';
      return 'A full set. Nicely chosen.';
    case 'frame':
      return 'Tap a frame to see it with your own photo.';
    case 'details':
      if (!input.hasRecipient) return 'Whose name goes at the top?';
      if (!input.hasMessage) return 'Now your words. One honest sentence is enough.';
      return 'That is the heart of it. Preview is next.';
    case 'preview':
      return 'Almost there. One tap makes your private link.';
  }
}

export function getCreateProgress(input: CreateProgressInput): CreateProgress {
  const flow = flowFor(input.isQuickCreate);
  const rawIndex = flow.indexOf(input.stage);
  const index = rawIndex === -1 ? 0 : rawIndex;
  const inner = innerProgress(input);
  const fraction = Math.min(1, (index + inner) / flow.length);

  return {
    current: index + 1,
    total: flow.length,
    stageLabel: STAGE_LABELS[input.stage],
    stages: flow.map((id, i) => ({
      id,
      label: STAGE_LABELS[id],
      state: i < index ? 'done' : i === index ? 'current' : 'todo',
    })),
    fraction,
    percent: Math.round(fraction * 100),
    timeLeft: timeLeftLabel(input, inner),
    nudge: nudgeFor(input),
  };
}
