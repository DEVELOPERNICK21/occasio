import { getCardBySlug } from '@/lib/creationsServer';
import type { RecipientCard } from '@/lib/recipientCard';

/** Fetch card via Firebase Admin (server-only — bypasses public Firestore rules). */
export async function fetchCardFromFirestore(slug: string): Promise<RecipientCard | null> {
  try {
    return await getCardBySlug(slug);
  } catch {
    return null;
  }
}
