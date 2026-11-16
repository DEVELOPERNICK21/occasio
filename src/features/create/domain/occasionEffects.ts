import { holidayById, type HolidayEffect } from './holidays';
import type { Occasion } from './templateSchema';
import type { TemplateType } from './types';

/** Screen effect ids: the celebration drawn over a card, and the sound that goes with it. */
export type ScreenEffectId = HolidayEffect;

const OCCASION_EFFECTS: Record<Occasion, ScreenEffectId> = {
  birthday: 'balloons',
  anniversary: 'hearts',
  congratulations: 'confetti',
  thank_you: 'sparkles',
  just_because: 'celebration',
};

const LEGACY_FALLBACK: Record<string, Occasion> = {
  sorry: 'just_because',
  proposal: 'anniversary',
};

export function effectForMoment(
  occasion: Occasion | null | undefined,
  templateType?: TemplateType | string | null,
): ScreenEffectId {
  // A festival's own effect first: its frame occasion (usually "just because") is only a stand-in.
  const holiday = holidayById(templateType);
  if (holiday) return holiday.effect;
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
