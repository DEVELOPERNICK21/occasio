/**
 * What happens when the recipient taps a festival drawing in the story.
 *  light   it switches on (a diya's flame, a tree's stars, a pumpkin's glow) and its word appears beneath
 *  burst   it sets off a spray of sparks and gives up its word (crackers, fireworks, stars)
 *  splash  it throws colour (Holi)
 *  pop     it pops with confetti and gives up its word (everything else)
 */
export type TapMode = 'light' | 'burst' | 'splash' | 'pop';

const LIGHT = new Set(['diya', 'lantern', 'lantern_red', 'thali', 'tree', 'pumpkin', 'bonfire', 'menorah']);
const BURST = new Set(['rocket', 'anar', 'burst', 'star', 'sparkle']);
const SPLASH = new Set(['splash', 'gulal']);

export function tapModeFor(motif: string): TapMode {
  if (LIGHT.has(motif)) return 'light';
  if (BURST.has(motif)) return 'burst';
  if (SPLASH.has(motif)) return 'splash';
  return 'pop';
}

/** The scene's heading, by what the first thing to tap does: "Light up Diwali", "Play Holi". */
export function tapTitle(label: string, firstMotif: string): string {
  switch (tapModeFor(firstMotif)) {
    case 'light':
      return `Light up ${label}`;
    case 'burst':
      return `Make ${label} sparkle`;
    case 'splash':
      return `Play ${label}`;
    default:
      return `Pop for ${label}`;
  }
}

/** A plain-words name for a drawing, for screen readers. */
export function motifName(motif: string): string {
  return motif.replace(/_/g, ' ');
}
