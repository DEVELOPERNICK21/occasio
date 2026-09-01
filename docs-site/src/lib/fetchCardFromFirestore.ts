import { lookupCardBySlug } from '@/lib/creationsServer';
import type { RecipientCard } from '@/lib/recipientCard';

export type CardFetchResult =
  | { status: 'found'; card: RecipientCard }
  | { status: 'expired' }
  | { status: 'not_found' };

/** Fetch card via Firebase Admin (server-only). */
export async function fetchCardFromFirestore(slug: string): Promise<CardFetchResult> {
  try {
    return await lookupCardBySlug(slug);
  } catch {
    return { status: 'not_found' };
  }
}

/** @deprecated Use fetchCardFromFirestore — returns card only when found. */
export async function fetchCardOrNull(slug: string): Promise<RecipientCard | null> {
  const result = await fetchCardFromFirestore(slug);
  return result.status === 'found' ? result.card : null;
}
