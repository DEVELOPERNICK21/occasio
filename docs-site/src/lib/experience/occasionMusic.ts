/**
 * The song under the closing scenes (the message and the finale).
 *
 * Browsers only let a page start sound after a tap, and iPhones are stricter:
 * each audio element has to be started from a tap before it may be started
 * later on its own. So the gate's "Yes" tap calls `unlockMusic`, which starts
 * the track silently and parks it, and the finale calls `startMusic` with no
 * tap needed. A normal `<audio>` element is used rather than Web Audio because
 * iPhones keep playing it with the ring switch on silent, which is what someone
 * watching a surprise on their phone expects.
 */
import { songFor } from '@/lib/experience/occasionSongs';
import { isSfxMuted, onSfxMuteChange } from '@/lib/experience/sfx';

/** Volume the song settles at: under the message, never over the sound effects. */
export const MUSIC_VOLUME = 0.4;
const FADE_IN_MS = 2200;
const FADE_STEP_MS = 60;

let element: HTMLAudioElement | null = null;
let elementFile = '';
let wanted = false;
/** True once this element has been started from a tap, so later plays are allowed. */
let unlocked = false;
let fade: number | null = null;
let unsubscribe: (() => void) | null = null;

function clearFade(): void {
  if (fade !== null) {
    window.clearInterval(fade);
    fade = null;
  }
}

function setVolume(audio: HTMLAudioElement, volume: number): void {
  try {
    // iPhones ignore this and play at the phone's volume, which is fine.
    audio.volume = Math.min(1, Math.max(0, volume));
  } catch {
    // read-only on some browsers
  }
}

function ensureElement(file: string, loop: boolean): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (element && elementFile === file) return element;
  element?.pause();
  unlocked = false;
  try {
    element = new Audio(file);
  } catch {
    element = null;
    return null;
  }
  element.preload = 'auto';
  element.loop = loop;
  elementFile = file;
  return element;
}

function watchMute(): void {
  if (unsubscribe) return;
  unsubscribe = onSfxMuteChange((nowMuted) => {
    if (nowMuted) {
      clearFade();
      element?.pause();
    } else if (wanted) {
      void play();
    }
  });
}

async function play(): Promise<void> {
  const audio = element;
  if (!audio || isSfxMuted()) return;
  clearFade();
  audio.muted = false;
  setVolume(audio, 0);
  try {
    await audio.play();
  } catch {
    // Blocked: the page has no tap yet, or the browser refused. The visuals carry on silently.
    return;
  }
  const started = performance.now();
  fade = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - started) / FADE_IN_MS);
    setVolume(audio, MUSIC_VOLUME * k);
    if (k >= 1) clearFade();
  }, FADE_STEP_MS);
}

/**
 * Call from a tap (the gate's "Yes"). Loads the song and unlocks playback for
 * later, without making a sound.
 */
export function unlockMusic(templateType: string): void {
  const song = songFor(templateType);
  const audio = ensureElement(song.file, song.loop);
  if (!audio) return;
  watchMute();
  // Already unlocked, or already playing: muting it again would silence the song.
  if (unlocked || !audio.paused) return;
  audio.muted = true;
  void audio
    .play()
    .then(() => {
      unlocked = true;
      // Only park it if the finale has not already asked for it in the meantime.
      if (!wanted) {
        audio.pause();
        audio.currentTime = 0;
      }
      audio.muted = false;
    })
    .catch(() => {
      audio.muted = false;
    });
}

/** Fades the song in. Safe to call again while it is already playing. */
export function startMusic(templateType: string): void {
  const song = songFor(templateType);
  const audio = ensureElement(song.file, song.loop);
  if (!audio) return;
  watchMute();
  wanted = true;
  if (!audio.paused && !audio.muted) return;
  void play();
}

/** Fades the song out and rewinds it, ready for a replay. */
export function stopMusic(fadeOutMs = 600): void {
  wanted = false;
  const audio = element;
  if (!audio) return;
  clearFade();
  if (audio.paused) return;
  const started = performance.now();
  const from = audio.volume;
  fade = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - started) / Math.max(fadeOutMs, 1));
    setVolume(audio, from * (1 - k));
    if (k >= 1) {
      clearFade();
      audio.pause();
      audio.currentTime = 0;
    }
  }, FADE_STEP_MS);
}
