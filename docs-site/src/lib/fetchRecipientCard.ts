import { fetchCardFromFirestore } from '@/lib/fetchCardFromFirestore';
import { parseDemoSlug, type RecipientCard } from '@/lib/recipientCard';

export type RecipientCardResult =
  | { kind: 'card'; card: RecipientCard }
  | { kind: 'expired' }
  | { kind: 'missing' };

/** Resolve a share slug to card data (demo, Firestore, or legacy API). */
export async function fetchRecipientCard(slug: string): Promise<RecipientCardResult> {
  const demo = parseDemoSlug(slug);
  if (demo) return { kind: 'card', card: demo };

  const spark = await fetchCardFromFirestore(slug);
  if (spark.status === 'found') return { kind: 'card', card: spark.card };
  if (spark.status === 'expired') return { kind: 'expired' };

  const apiBase = process.env.OCCASIO_API_BASE;
  if (!apiBase) return { kind: 'missing' };

  try {
    const res = await fetch(`${apiBase}/v1/cards/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 410) return { kind: 'expired' };
    if (!res.ok) return { kind: 'missing' };
    const data = (await res.json()) as Omit<RecipientCard, 'isDemo'>;
    return { kind: 'card', card: { ...data, isDemo: false } };
  } catch {
    return { kind: 'missing' };
  }
}
