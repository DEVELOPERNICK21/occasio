import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExpiredCardPage } from '@/components/ExpiredCardPage';
import { PasscodeGate } from '@/components/PasscodeGate';
import { RecipientCardView } from '@/components/RecipientCardView';
import { recordCardView } from '@/lib/creationsServer';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { shareUrlForSlug } from '@/lib/shareBase';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchRecipientCard(slug);
  const pageUrl = shareUrlForSlug(slug);

  // Link previews are the first thing a recipient sees in chat. Tease, never
  // spoil: no message, no photo, and nothing at all from a locked card.
  if (result.kind === 'locked') {
    const title = 'A surprise is waiting for you';
    const description = 'Someone locked something special for you. You will need the code.';
    return {
      title,
      description,
      openGraph: { title, description, type: 'website', url: pageUrl },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  if (result.kind === 'card') {
    const from = result.card.fromName?.trim();
    const title = from
      ? `${from} made something for ${result.card.recipientName}`
      : `Someone made something for ${result.card.recipientName}`;
    const description = 'Tap to open your surprise.';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: pageUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }

  if (result.kind === 'expired') {
    return { title: 'Link expired' };
  }

  return { title: 'Card not found' };
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
