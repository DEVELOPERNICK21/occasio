import { splitRevealLine } from './splitRevealLine';
import type {
  ExperienceCardInput,
  ExperienceMode,
  ResolvedExperience,
  SceneId,
} from './types';

const STORY_TYPES = new Set(['birthday', 'anniversary']);

export function defaultExperienceMode(templateType: string): ExperienceMode {
  return STORY_TYPES.has(templateType) ? 'story' : 'classic';
}

/**
 * Phase B pack: balloons → candle → gift → photos? → letter
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
  const scenes: SceneId[] = ['balloons', 'candle', 'gift'];
  if (photos.length > 0) scenes.push('photo_deck');
  scenes.push('letter');

  return { mode, scenes, revealLine };
}
