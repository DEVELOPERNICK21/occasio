import { Platform } from 'react-native';

/**
 * Faces for the card frames that imitate a written note or printed film.
 * These are the closest built-in faces on each platform (the recipient web page
 * uses Caveat for handwriting). No font file is bundled, so there is no extra
 * licence or app size to carry.
 */
export const fontHand: string = Platform.select({
  ios: 'Bradley Hand',
  android: 'cursive',
  default: 'cursive',
});

/** Fixed-width type for film edge printing and frame numbers. */
export const fontMono: string = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
