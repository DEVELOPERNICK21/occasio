import { Image, Platform } from 'react-native';
import Sound from 'react-native-sound';
import type { ScreenEffectId } from '../domain/occasionEffects';
import { soundForEffect } from '../domain/occasionSounds';

/**
 * Occasion soundtrack / chimes — Ambient so iOS silent switch is respected.
 *
 * Birthday / anniversary / thank-you use longer MP3 beds.
 * Congrats / just-because keep short WAV chimes.
 *
 * Android: res/raw. iOS: Metro-resolved asset URI.
 */
Sound.setCategory('Ambient', true);

const BUNDLE: Record<ScreenEffectId, number> = {
  balloons: require('../assets/sounds/balloons.mp3'),
  hearts: require('../assets/sounds/hearts.mp3'),
  confetti: require('../assets/sounds/confetti.wav'),
  sparkles: require('../assets/sounds/sparkles.mp3'),
  celebration: require('../assets/sounds/celebration.wav'),
};

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
  const asset = BUNDLE[effectId];
  const uri = Image.resolveAssetSource(asset)?.uri;
  if (!uri || typeof uri !== 'string') {
    return;
  }
  playWithFilename(uri, undefined, effectId);
}

/** Play soundtrack / chime for this celebration moment. Safe to call repeatedly. */
export function playCelebrationSound(effectId: ScreenEffectId): void {
  try {
    releaseActive();
    const id = soundForEffect(effectId);
    if (Platform.OS === 'android') {
      playFromAndroidRaw(id);
      return;
    }
    playFromResolvedAsset(id);
  } catch {
    // Never crash Preview over audio.
  }
}

export function stopCelebrationSound(): void {
  releaseActive();
}
