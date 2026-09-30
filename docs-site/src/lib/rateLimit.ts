/**
 * Best-effort in-memory sliding window. On serverless each instance keeps its
 * own counters, so this blunts casual abuse and scripts, not a distributed
 * attack — pair with App Check / a WAF before scaling.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
