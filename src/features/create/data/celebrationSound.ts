import Sound from 'react-native-sound';
import { appPlatform, resolveAssetUri } from '../../../shared/platform/runtime';
import type { ScreenEffectId } from '../domain/occasionEffects';
import { BUNDLED_SOUNDS } from './celebrationAssets';

/**
 * Occasion soundtrack / chimes — Ambient so iOS silent switch is respected.
 *
 * Birthday / anniversary / thank-you use longer MP3 beds.
 * Congrats / just-because keep short WAV chimes.
 *
 * Android: res/raw. iOS: Metro-resolved asset URI.
 */
Sound.setCategory('Ambient', true);

/** Android res/raw names (library strips extension on Android). */
const RAW_NAME: Record<ScreenEffectId, string> = {
  balloons: 'sfx_balloons.mp3',
  hearts: 'sfx_hearts.mp3',
  confetti: 'sfx_confetti.wav',
  sparkles: 'sfx_sparkles.mp3',
  celebration: 'sfx_celebration.wav',
};

/** Longer music beds sit quieter than short chimes. */
const MUSIC_EFFECTS: ReadonlySet<ScreenEffectId> = new Set([
  'balloons',
  'hearts',
  'sparkles',
]);

let active: Sound | null = null;

function releaseActive(): void {
  if (!active) return;
  try {
    active.stop();
    active.release();
  } catch {
    // ignore release races
  }
  active = null;
}

function playInstance(sound: Sound, effectId: ScreenEffectId): void {
  active = sound;
  sound.setVolume(MUSIC_EFFECTS.has(effectId) ? 0.48 : 0.72);
  sound.play((success) => {
    if (active === sound) {
      sound.release();
      active = null;
    }
    if (!success && __DEV__) {
      // Playback interrupted or decode failed — non-fatal.
    }
  });
}

function playWithFilename(
  filename: string,
  basePath: string | undefined,
  effectId: ScreenEffectId,
): void {
  const sound = new Sound(filename, basePath, (error) => {
    if (error) {
      return;
    }
    playInstance(sound, effectId);
  });
}

function playFromAndroidRaw(effectId: ScreenEffectId): void {
  playWithFilename(RAW_NAME[effectId], Sound.MAIN_BUNDLE, effectId);
}

function playFromResolvedAsset(effectId: ScreenEffectId): void {
  const asset = BUNDLED_SOUNDS[effectId];
  if (asset === undefined) {
    return;
  }
  const uri = resolveAssetUri(asset);
  if (!uri) {
    return;
  }
  playWithFilename(uri, undefined, effectId);
}

/** Play soundtrack / chime for this celebration moment. Safe to call repeatedly. */
export function playCelebrationSound(effectId: ScreenEffectId): void {
  try {
    releaseActive();
    if (appPlatform() === 'android') {
      playFromAndroidRaw(effectId);
      return;
    }
    playFromResolvedAsset(effectId);
  } catch {
    // Never crash Preview over audio.
  }
}

export function stopCelebrationSound(): void {
  releaseActive();
}
