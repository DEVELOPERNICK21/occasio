import type { ScreenEffectId } from '../domain/occasionEffects';

/** Android plays the copies in `res/raw`, so nothing is bundled here. See `celebrationAssets.ts`. */
export const BUNDLED_SOUNDS: Partial<Record<ScreenEffectId, number>> = {};
