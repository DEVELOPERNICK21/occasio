type CreateStep = {
  current: number;
  total: number;
};

/** Screens a full create actually shows, in order. */
const FULL_FLOW = ['occasion', 'photos', 'frame', 'details', 'preview'] as const;

/** Quick Create preselects occasion and frame, so it shows fewer screens. */
const QUICK_FLOW = ['photos', 'details', 'preview'] as const;

export type CreateStepName = (typeof FULL_FLOW)[number];

/**
 * Position in the flow the user is actually walking. Derived from one ordered
 * list so a skipped screen can never leave a gap in the progress bar.
 */
export function getCreateStep(
  step: CreateStepName,
  isQuickCreate: boolean,
): CreateStep {
  const flow: readonly string[] = isQuickCreate ? QUICK_FLOW : FULL_FLOW;
  const index = flow.indexOf(step);
  if (index === -1) {
    return { current: 1, total: flow.length };
  }
  return { current: index + 1, total: flow.length };
}
