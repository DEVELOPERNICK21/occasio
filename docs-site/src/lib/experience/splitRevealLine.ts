const MAX_LEN = 80;
const MIN_USEFUL = 12;

export function splitRevealLine(
  message: string | null,
  recipientName: string,
): string {
  const name = recipientName.trim() || 'you';
  const fallback = `You are so special, ${name}.`;
  const raw = (message ?? '').trim();
  if (raw.length < MIN_USEFUL) return fallback;

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim() || raw;
  if (firstSentence.length <= MAX_LEN) {
    return /[.!?]$/.test(firstSentence) ? firstSentence : `${firstSentence}.`;
  }

  const sliced = firstSentence.slice(0, MAX_LEN);
  const cut = sliced.lastIndexOf(' ');
  const truncated = (cut > 40 ? sliced.slice(0, cut) : sliced).trim();
  return `${truncated}…`;
}
