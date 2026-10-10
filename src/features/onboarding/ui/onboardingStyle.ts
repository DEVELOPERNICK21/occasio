import { Platform } from 'react-native';

/**
 * Headlines use the system serif so the first run sounds like the recipient's
 * card (Fraunces on the web) without shipping a font file. Body copy stays on
 * the system sans.
 */
export const HEADLINE_FONT = Platform.select({ ios: 'Georgia', default: 'serif' });
