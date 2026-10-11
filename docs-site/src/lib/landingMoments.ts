/**
 * The five moments the landing page can play a real sample of. Each id is a
 * valid demo slug moment (see `parseDemoSlug`), so a sample is just a normal
 * recipient link that needs no account and no network.
 */
export const LANDING_MOMENTS = [
  { id: 'birthday', label: 'Birthday', line: 'Make them feel remembered' },
  { id: 'anniversary', label: 'Anniversary', line: 'Honor a chapter you share' },
  { id: 'thank_you', label: 'Thank you', line: 'Let them know it mattered' },
  { id: 'congratulations', label: 'Congratulations', line: 'Celebrate what they achieved' },
  { id: 'just_because', label: 'Just because', line: 'Small gestures stay with people' },
] as const;

export type LandingMomentId = (typeof LANDING_MOMENTS)[number]['id'];

const SAMPLE_NAME = 'maya';
const SAMPLE_CODE = 'abc123';

/** Path of the sample wish for a moment. */
export function sampleWishPath(moment: LandingMomentId): string {
  return `/c/demo-${moment}-${SAMPLE_NAME}-${SAMPLE_CODE}`;
}
