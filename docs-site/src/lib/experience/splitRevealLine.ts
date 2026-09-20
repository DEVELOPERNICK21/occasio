export const DEFAULT_BALLOON_LINE = 'You are so special';
export const MAX_BALLOON_WORDS = 8;

/** Clamp / default the balloon pop line — never more than 8 words. */
export function normalizeBalloonLine(line: string | null | undefined): string {
  const cleaned = (line ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return DEFAULT_BALLOON_LINE;
  const words = cleaned.split(' ').filter(Boolean).slice(0, MAX_BALLOON_WORDS);
  return words.join(' ') || DEFAULT_BALLOON_LINE;
}

/**
 * Balloon reveal line for the story.
 * Prefers an optional creator-written `balloonLine` (≤8 words).
 * Otherwise uses the short default — never the full letter message.
 */
export function splitRevealLine(
  _message: string | null,
  _recipientName: string,
  balloonLine?: string | null,
): string {
  return normalizeBalloonLine(balloonLine);
}
