import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExpiredCardPage } from '@/components/ExpiredCardPage';
import { RecipientCardView } from '@/components/RecipientCardView';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { shareUrlForSlug } from '@/lib/shareBase';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchRecipientCard(slug);
  const pageUrl = shareUrlForSlug(slug);

  if (result.kind === 'card') {
    const description =
      result.card.message ??
      `Someone sent ${result.card.recipientName} a wish on Occasio.`;
    const title = `A wish for ${result.card.recipientName}`;

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

  return <RecipientCardView card={result.card} />;
}
