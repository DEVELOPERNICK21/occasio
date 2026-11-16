import type { ScreenEffectId } from '../domain/occasionEffects';

/**
 * The sounds the app bundles through Metro, by effect. iOS plays them from here.
 *
 * Android has its own copies in `android/app/src/main/res/raw` (see `celebrationSound.ts`), and
 * `celebrationAssets.android.ts` leaves this list empty. Metro copies every `require`d file into
 * the Android build, so listing them here as well would ship each sound twice (about 2 MB for the
 * three music beds).
 */
export const BUNDLED_SOUNDS: Partial<Record<ScreenEffectId, number>> = {
  balloons: require('../assets/sounds/balloons.mp3'),
  hearts: require('../assets/sounds/hearts.mp3'),
  confetti: require('../assets/sounds/confetti.wav'),
  sparkles: require('../assets/sounds/sparkles.mp3'),
  celebration: require('../assets/sounds/celebration.wav'),
};
