import type { Occasion } from './templateSchema';
import type { TemplateType } from './types';

/** iMessage-style screen effect ids (Lottie packs). */
export type ScreenEffectId =
  | 'balloons'
  | 'hearts'
  | 'confetti'
  | 'sparkles'
  | 'celebration';

const OCCASION_EFFECTS: Record<Occasion, ScreenEffectId> = {
  birthday: 'balloons',
  anniversary: 'hearts',
  congratulations: 'confetti',
  thank_you: 'sparkles',
  just_because: 'celebration',
};

const LEGACY_FALLBACK: Record<string, Occasion> = {
  mothers_day: 'birthday',
  fathers_day: 'birthday',
  sorry: 'just_because',
  proposal: 'anniversary',
};

export function effectForMoment(
  occasion: Occasion | null | undefined,
  templateType?: TemplateType | string | null,
): ScreenEffectId {
  if (occasion && OCCASION_EFFECTS[occasion]) {
    return OCCASION_EFFECTS[occasion];
  }
  if (templateType && templateType in OCCASION_EFFECTS) {
    return OCCASION_EFFECTS[templateType as Occasion];
  }
  if (templateType && LEGACY_FALLBACK[templateType]) {
    return OCCASION_EFFECTS[LEGACY_FALLBACK[templateType]];
  }
  return 'balloons';
}
