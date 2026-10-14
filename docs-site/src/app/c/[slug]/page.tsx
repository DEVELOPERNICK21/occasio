import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExpiredCardPage } from '@/components/ExpiredCardPage';
import { PasscodeGate } from '@/components/PasscodeGate';
import { RecipientCardView } from '@/components/RecipientCardView';
import { recordCardView } from '@/lib/creationsServer';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { teaserFor } from '@/lib/og/teaser';
import { wishGreeting } from '@/lib/recipientCard';
import { shareUrlForSlug } from '@/lib/shareBase';

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Card links are private: shared with one person, never meant for search results.
 * `noindex` only asks search engines to skip them. It is not a robots.txt rule on
 * purpose, because Facebook, Twitter and others read robots.txt before they build a
 * link preview and would show nothing.
 */
const PRIVATE: Metadata['robots'] = { index: false, follow: false };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchRecipientCard(slug);
  const pageUrl = shareUrlForSlug(slug);

  // Link previews are the first thing a recipient sees in chat. Tease, never
  // spoil: no message, no photo, and nothing at all from a locked card.
  if (result.kind === 'locked' || result.kind === 'card') {
    const teaser = teaserFor(
      result.kind === 'locked'
        ? { kind: 'locked' }
        : {
            kind: 'card',
            greeting: wishGreeting(result.card.templateType),
            recipientName: result.card.recipientName,
            fromName: result.card.fromName,
          },
    );
    const { title, description } = teaser;

    return {
      title,
      description,
      robots: PRIVATE,
      openGraph: { title, description, type: 'website', url: pageUrl, siteName: 'Occasio' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  if (result.kind === 'expired') {
    return { title: 'Link expired', robots: PRIVATE };
  }

  return { title: 'Card not found', robots: PRIVATE };
}

export default async function RecipientCardPage({ params }: Props) {
  const { slug } = await params;
  const result = await fetchRecipientCard(slug);

  if (result.kind === 'expired') {
    return <ExpiredCardPage />;
  }
  if (result.kind === 'missing') {
    notFound();
  }
  if (result.kind === 'locked') {
    return <PasscodeGate slug={slug} hint={result.hint} />;
  }

  // Best effort: a render is a view. Never let counting break the page.
  void recordCardView(slug).catch(() => undefined);

  return <RecipientCardView card={result.card} slug={slug} />;
}
