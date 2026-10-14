/**
 * What a shared card link says before it is opened: the title and description in
 * the chat preview, and the words on the preview image. One place, so the two
 * never disagree. A teaser only: never the message, never a photo, and nothing
 * personal at all from a locked card.
 */

export type TeaserInput =
  | { kind: 'card'; greeting: string; recipientName: string; fromName: string | null }
  | { kind: 'locked' };

export type Teaser = {
  /** The preview title in the chat. */
  title: string;
  /** The preview description in the chat. */
  description: string;
  /** Small capitals on the image, above the name. */
  eyebrow: string;
  /** The big line on the image. */
  headline: string;
  /** Under the headline. */
  line: string;
  /** The button-looking line at the bottom of the image. */
  cta: string;
};

export function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Room for the big name: the left half of the image, in px, and the average width of a letter in em. */
const HEADLINE_ROOM = 560;
const LETTER_EM = 0.58;
const LONGEST_ONE_LINE = 9;

/**
 * Font size for the big name, from how wide it will really be, so a short phrase like
 * "For you" fits as well as a long name does. Past nine letters it is allowed two lines.
 */
export function headlineSize(headline: string): number {
  const lines = headline.length > LONGEST_ONE_LINE ? 2 : 1;
  const perLine = Math.ceil(headline.length / lines);
  const size = Math.floor(HEADLINE_ROOM / (perLine * LETTER_EM));
  return Math.max(64, Math.min(176, size));
}

export function teaserFor(input: TeaserInput): Teaser {
  if (input.kind === 'locked') {
    return {
      title: 'A surprise is waiting for you',
      description: 'Someone locked something special for you. You will need the code.',
      eyebrow: 'A surprise',
      headline: 'For you',
      line: 'Someone locked something for you',
      cta: 'Tap to enter the code',
    };
  }

  const name = input.recipientName.trim();
  const from = input.fromName?.trim() || null;
  return {
    title: from ? `${from} made something for ${name}` : `Someone made something for ${name}`,
    description: 'A little surprise is waiting inside. Tap to open it.',
    eyebrow: input.greeting.replace(/,\s*$/, '').toUpperCase(),
    headline: truncate(name, 22),
    line: from ? `${truncate(from, 26)} made you something` : 'Someone made you something',
    cta: 'Tap to open the surprise',
  };
}
