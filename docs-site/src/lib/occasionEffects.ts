/**
 * Keep in sync with `src/features/create/domain/occasionEffects.ts`.
 */

export type ScreenEffectId =
  | 'balloons'
  | 'hearts'
  | 'confetti'
  | 'sparkles'
  | 'celebration';

const OCCASION_EFFECTS: Record<string, ScreenEffectId> = {
  birthday: 'balloons',
  anniversary: 'hearts',
  congratulations: 'confetti',
  thank_you: 'sparkles',
  just_because: 'celebration',
  mothers_day: 'balloons',
  fathers_day: 'balloons',
  sorry: 'celebration',
  proposal: 'hearts',
};

export function effectForTemplateType(templateType: string): ScreenEffectId {
  return OCCASION_EFFECTS[templateType] ?? 'balloons';
}

export function lottiePublicPath(effectId: ScreenEffectId): string {
  return `/lottie/${effectId}.json`;
}
