import { splitRevealLine } from './splitRevealLine';
import type {
  ExperienceCardInput,
  ExperienceMode,
  ResolvedExperience,
  SceneId,
} from './types';

/** All five create-flow moments get the interactive story by default. */
const STORY_TYPES = new Set([
  'birthday',
  'anniversary',
  'thank_you',
  'congratulations',
  'just_because',
]);

/** Candle/cake beat fits birthday + anniversary; other moments skip it. */
const CANDLE_TYPES = new Set(['birthday', 'anniversary']);

export function defaultExperienceMode(templateType: string): ExperienceMode {
  return STORY_TYPES.has(templateType) ? 'story' : 'classic';
}

/**
 * Story pack by moment:
 * birthday / anniversary — balloons → candle → gift → photos? → envelope → letter
 * thank you / congratulations / just because — balloons → gift → photos? → envelope → letter
 */
export function resolveExperience(
  card: ExperienceCardInput,
): ResolvedExperience {
  const mode =
    card.experienceMode === 'story' || card.experienceMode === 'classic'
      ? card.experienceMode
      : defaultExperienceMode(card.templateType);

  const revealLine = splitRevealLine(
    card.message,
    card.recipientName,
    card.balloonLine,
  );

  if (mode === 'classic') {
    return { mode, scenes: [], revealLine };
  }

  const photos = (card.mediaUrls ?? []).map((u) => u.trim()).filter(Boolean);
  const scenes: SceneId[] = ['balloons'];
  if (CANDLE_TYPES.has(card.templateType)) {
    scenes.push('candle');
  }
  scenes.push('gift');
  if (photos.length > 0) scenes.push('photo_deck');
  scenes.push('envelope', 'letter_write', 'letter');

  return { mode, scenes, revealLine };
}
