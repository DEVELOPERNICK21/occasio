import { NextResponse } from 'next/server';
import { lookupCardBySlug } from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Server is not configured' },
      { status: 503 },
    );
  }

  const { slug } = await context.params;
  if (!slug || slug.length < 6 || slug.length > 32) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  const result = await lookupCardBySlug(slug);
  if (result.status === 'expired') {
    return NextResponse.json(
      { code: 'EXPIRED', message: 'This link has expired' },
      { status: 410 },
    );
  }
  if (result.status === 'not_found') {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  const card = result.card;

  return NextResponse.json({
    recipientName: card.recipientName,
    message: card.message,
    templateType: card.templateType,
    mediaUrls: card.mediaUrls ?? [],
    fromName: card.fromName,
  });
}
