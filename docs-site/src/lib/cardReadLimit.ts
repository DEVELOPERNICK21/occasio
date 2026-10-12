import { isRateLimited, rateLimit } from '@/lib/rateLimit';

const READS_PER_MINUTE = 120;
const MISSES_PER_WINDOW = 20;
const MISS_WINDOW_MS = 10 * 60 * 1000;

/**
 * Public card reads, by IP. Two limits: overall reads, and a tighter one on
 * lookups that find nothing, so slugs cannot be guessed one after another.
 * Returns false when the caller should be turned away.
 */
export function allowCardRead(ip: string): boolean {
  return (
    rateLimit(`card:${ip}`, READS_PER_MINUTE, 60_000) &&
    !isRateLimited(`card-miss:${ip}`, MISSES_PER_WINDOW, MISS_WINDOW_MS)
  );
}

export function recordCardMiss(ip: string): void {
  rateLimit(`card-miss:${ip}`, MISSES_PER_WINDOW, MISS_WINDOW_MS);
}
