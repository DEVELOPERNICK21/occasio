/** Public contact + beta access — single source for landing and legal. */
export const contact = {
  email: 'develoepernick1@gmail.com',
  mailto: 'mailto:develoepernick1@gmail.com',
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
