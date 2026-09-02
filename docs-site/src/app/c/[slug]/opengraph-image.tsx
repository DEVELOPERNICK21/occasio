import { ImageResponse } from 'next/og';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { templateLabel } from '@/lib/recipientCard';

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

  if (result.kind !== 'card') {
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

  const { card } = result;
  const photo = card.mediaUrls?.[0];
  const message =
    card.message ??
    `Someone sent ${card.recipientName} a wish on Occasio.`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fdf6f2',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 420,
            height: 520,
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid #e8ddd4',
            background: '#fffdf8',
            boxShadow: '0 8px 32px rgba(28, 25, 20, 0.1)',
          }}
        >
          {photo ? (
            <div style={{ width: '100%', height: 220, display: 'flex' }}>
              <img
                src={photo}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: 160,
                background: '#fceee8',
              }}
            />
          )}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 36px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 22,
                color: '#e8615d',
                fontFamily: 'Georgia, serif',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Happy {templateLabel(card.templateType)},
            </p>
            <p
              style={{
                fontSize: 40,
                color: '#f6a94a',
                fontFamily: 'Georgia, serif',
                fontWeight: 600,
                margin: '8px 0 0',
                lineHeight: 1.1,
              }}
            >
              {card.recipientName}
            </p>
            <p
              style={{
                fontSize: 20,
                color: '#6f675c',
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                margin: '20px 0 0',
                lineHeight: 1.45,
              }}
            >
              {truncate(message, 100)}
            </p>
            <p
              style={{
                fontSize: 14,
                color: '#857371',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 'auto',
              }}
            >
              Occasio
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
