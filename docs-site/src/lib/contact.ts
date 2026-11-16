/** Public contact + store links — single source for landing and legal. */
export const contact = {
  email: 'developernick1@gmail.com',
  mailto: 'mailto:developernick1@gmail.com',
  /** Public App Store listing (Apple ID 6817678311). */
  appStore: 'https://apps.apple.com/in/app/occasio-gift-wish-reminder/id6817678311',
  /** Public Google Play listing (package com.occasio.greetings). */
  playStore: 'https://play.google.com/store/apps/details?id=com.occasio.greetings',
  playStoreInternalTest:
    'https://play.google.com/apps/internaltest/4701727779269430683',
} as const;

/** "Report this card" opens the reader's mail app with the card reference filled in. */
export function reportCardMailto(slug: string): string {
  const subject = encodeURIComponent(`Report an Occasio card: ${slug}`);
  const body = encodeURIComponent(
    `Card link: https://occasio-greetings.vercel.app/c/${slug}\n\nWhat is wrong with this card?\n`,
  );
  return `mailto:${contact.email}?subject=${subject}&body=${body}`;
}
