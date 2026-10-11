import { effectForTemplateType, type ScreenEffectId } from '../occasionEffects';

export type Song = { file: string; loop: boolean };

/** The longer tracks are real songs and loop; the short ones are one-off chimes. */
const SONGS: Record<ScreenEffectId, Song> = {
  balloons: { file: '/sounds/balloons.mp3', loop: true },
  hearts: { file: '/sounds/hearts.mp3', loop: true },
  sparkles: { file: '/sounds/sparkles.mp3', loop: true },
  // The chimes for these moments only last a second, so they borrow a song that suits them.
  confetti: { file: '/sounds/balloons.mp3', loop: true },
  celebration: { file: '/sounds/sparkles.mp3', loop: true },
};

export function songFor(templateType: string): Song {
  return SONGS[effectForTemplateType(templateType)];
}
