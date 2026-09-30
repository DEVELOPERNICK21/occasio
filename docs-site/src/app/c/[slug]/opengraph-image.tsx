import { ImageResponse } from 'next/og';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { wishGreeting } from '@/lib/recipientCard';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;
  const result = await fetchRecipientCard(slug);

  if (result.kind !== 'card' && result.kind !== 'locked') {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f6f1e8',
            color: '#1c1914',
            fontFamily: 'Georgia, serif',
          }}
        >
          <p style={{ fontSize: 28, color: '#1f5c4d', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Occasio
          </p>
          <p style={{ fontSize: 48, marginTop: 24 }}>
            {result.kind === 'expired' ? 'This link has expired' : 'Card not found'}
          </p>
        </div>
      ),
      { ...size },
    );
  }

  // Teaser only: the preview never shows the sender's photo or message.
  const card = result.kind === 'card' ? result.card : null;
  const from = card?.fromName?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fdf6f2 0%, #f7c9b6 100%)',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          padding: 60,
        }}
      >
        <p
          style={{
            fontSize: 26,
            color: '#c94e4a',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {card ? wishGreeting(card.templateType).replace(/,$/, '') : 'A surprise'}
        </p>
        <p
          style={{
            fontSize: 84,
            color: '#2a2220',
            fontWeight: 600,
            margin: '24px 0 0',
            lineHeight: 1.05,
          }}
        >
          {card ? truncate(card.recipientName, 24) : 'For you'}
        </p>
        <p style={{ fontSize: 36, color: '#4d4340', margin: '32px 0 0' }}>
          {from
            ? `${truncate(from, 28)} made you something`
            : 'Someone made you something'}
        </p>
        <p
          style={{
            fontSize: 22,
            color: '#857371',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: 56,
          }}
        >
          Tap to open · Occasio
        </p>
      </div>
    ),
    { ...size },
  );
}
