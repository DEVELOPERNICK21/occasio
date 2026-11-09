/**
 * Keep in sync with `src/features/create/domain/occasionEffects.ts`.
 */

import { webHolidayFor, type HolidayEffect } from './holidays';

export type ScreenEffectId = HolidayEffect;

const OCCASION_EFFECTS: Record<string, ScreenEffectId> = {
  birthday: 'balloons',
  anniversary: 'hearts',
  congratulations: 'confetti',
  thank_you: 'sparkles',
  just_because: 'celebration',
  sorry: 'celebration',
  proposal: 'hearts',
};

export function effectForTemplateType(templateType: string): ScreenEffectId {
  return webHolidayFor(templateType)?.effect ?? OCCASION_EFFECTS[templateType] ?? 'balloons';
}

export function lottiePublicPath(effectId: ScreenEffectId): string {
  return `/lottie/${effectId}.json`;
}
