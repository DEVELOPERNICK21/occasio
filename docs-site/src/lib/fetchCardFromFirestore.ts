import { headers } from 'next/headers';
import { allowCardRead, recordCardMiss } from '@/lib/cardReadLimit';
import { lookupCardBySlug } from '@/lib/creationsServer';
import type { RecipientCard } from '@/lib/recipientCard';

export type CardFetchResult =
  | { status: 'found'; card: RecipientCard }
  | { status: 'locked'; hint: string | null }
  | { status: 'expired' }
  | { status: 'not_found' };

/** Fetch card via Firebase Admin (server-only). */
export async function fetchCardFromFirestore(slug: string): Promise<CardFetchResult> {
  // The public page reads here directly, not through the API route, so the same
  // per-IP limit applies. Outside a request (build, tests) there is no IP to limit.
  let ip: string | null = null;
  try {
    const incoming = await headers();
    ip = (incoming.get('x-forwarded-for')?.split(',')[0] ?? incoming.get('x-real-ip'))?.trim() || null;
  } catch {
    ip = null;
  }
  if (ip && !allowCardRead(ip)) {
    return { status: 'not_found' };
  }

  try {
    const result = await lookupCardBySlug(slug);
    if (ip && result.status === 'not_found') recordCardMiss(ip);
    return result;
  } catch {
    return { status: 'not_found' };
  }
}

/** @deprecated Use fetchCardFromFirestore — returns card only when found. */
export async function fetchCardOrNull(slug: string): Promise<RecipientCard | null> {
  const result = await fetchCardFromFirestore(slug);
  return result.status === 'found' ? result.card : null;
}
