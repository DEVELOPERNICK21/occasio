import { ImageResponse } from 'next/og';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { blurredPhotoDataUrl } from '@/lib/og/blurredPhoto';
import { INVITATION_TEMPLATE } from '@/lib/invitation';
import { themeFor } from '@/lib/invitationTheme';
import { teaserInputForCard } from '@/lib/og/cardTeaser';
import { designPhotoDataUrl, slimPng } from '@/lib/og/designPhoto';
import { InvitationImage } from '@/lib/og/invitationImage';
import { InvitationPhotoImage } from '@/lib/og/invitationPhotoImage';
import { ogThemeFor } from '@/lib/og/ogTheme';
import { SurpriseImage } from '@/lib/og/surpriseImage';
import { teaserFor } from '@/lib/og/teaser';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

  // A teaser only. The message never appears, and a photo only as a blurred wash of
  // its colours (never the photo), so a link preview copied onto another service
  // leaks nothing. A locked card gets no name and no photo at all.
  const card = result.kind === 'card' ? result.card : null;
  const teaser = card ? teaserFor(teaserInputForCard(card)) : teaserFor({ kind: 'locked' });

  // An invitation gets its own picture, in the look of its occasion: the names and the day. A ceremony
  // shows its design's own photograph (one the page ships with); no photo a host uploaded ever appears.
  if (card?.templateType === INVITATION_TEMPLATE && card.invitation) {
    const { occasion, design } = card.invitation;
    const look = themeFor(occasion, design).look;
    const photo = look === 'party' ? null : await designPhotoDataUrl(look);
    const image = photo && look !== 'party'
      ? <InvitationPhotoImage teaser={teaser} invitation={{ ...card.invitation, design: look }} photo={photo} />
      : <InvitationImage teaser={teaser} invitation={card.invitation} />;
    const headers = { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' };
    const rendered = new ImageResponse(image, { ...size, headers });
    if (!photo) return rendered;
    return new Response(await slimPng(await rendered.arrayBuffer()), {
      headers: { ...headers, 'Content-Type': contentType },
    });
  }

  const wash = card
    ? await blurredPhotoDataUrl(card.mediaUrls, { allowDemoFiles: card.isDemo })
    : null;

  return new ImageResponse(
    <SurpriseImage teaser={teaser} theme={ogThemeFor(card?.templateType ?? 'birthday')} wash={wash} />,
    {
      ...size,
      // Chats keep the picture for a long while; the CDN only needs to hold it for a short one,
      // so a renamed or revoked card stops being served soon.
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}
