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

/** The joke "terms" scene suits the light-hearted moments. */
const CONTRACT_TYPES = new Set(['just_because']);

/**
 * Story pack by moment. Every story opens with a YES/NO gate (a tap that also
 * unlocks browser audio) and ends on a finale with Replay + share loop:
 * gate → lamp → balloons → candle (birthday/anniversary) → gift →
 * contract (just because) → hub (photos?, reasons?, letter — any order) → finale
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

  const scenes: SceneId[] = ['gate', 'lamp', 'balloons'];
  if (CANDLE_TYPES.has(card.templateType)) {
    scenes.push('candle');
  }
  scenes.push('gift');
  if (CONTRACT_TYPES.has(card.templateType)) scenes.push('contract');
  scenes.push('hub', 'finale');

  return { mode, scenes, revealLine };
}
