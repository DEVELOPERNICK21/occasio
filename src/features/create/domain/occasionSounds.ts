import type { ScreenEffectId } from './occasionEffects';

/**
 * Sound clip id matches screen effect id.
 * balloons → birthday bed · hearts → anniversary · sparkles → thank-you
 */
export type CelebrationSoundId = ScreenEffectId;

export function soundForEffect(effectId: ScreenEffectId): CelebrationSoundId {
  return effectId;
}

/** Public web path extension per effect (mp3 beds vs wav chimes). */
export function soundExtForEffect(effectId: ScreenEffectId): 'mp3' | 'wav' {
  if (
    effectId === 'balloons' ||
    effectId === 'hearts' ||
    effectId === 'sparkles'
  ) {
    return 'mp3';
  }
  return 'wav';
}
