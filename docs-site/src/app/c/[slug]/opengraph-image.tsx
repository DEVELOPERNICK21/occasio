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
          background: '#f6f1e8',
          padding: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 900,
            height: 520,
            borderRadius: 24,
            overflow: 'hidden',
            border: '2px solid #ddd2c0',
            background: '#fffdf8',
            boxShadow: '0 8px 32px rgba(28, 25, 20, 0.12)',
          }}
        >
          {photo ? (
            <div
              style={{
                width: 360,
                height: '100%',
                position: 'relative',
                display: 'flex',
              }}
            >
              {/* img required for Satori OG renderer (base64 + remote URLs) */}
              <img
                src={photo}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 360,
                height: '100%',
                background: '#d8ebe4',
              }}
            />
          )}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 48,
            }}
          >
            <p
              style={{
                fontSize: 18,
                color: '#6f675c',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {templateLabel(card.templateType)}
            </p>
            <p
              style={{
                fontSize: 56,
                color: '#1c1914',
                fontFamily: 'Georgia, serif',
                margin: '16px 0 0',
                lineHeight: 1.1,
              }}
            >
              {card.recipientName}
            </p>
            <p
              style={{
                fontSize: 28,
                color: '#3d3830',
                margin: '24px 0 0',
                lineHeight: 1.4,
              }}
            >
              {truncate(message, 120)}
            </p>
            <p
              style={{
                fontSize: 20,
                color: '#1f5c4d',
                letterSpacing: '0.14em',
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
