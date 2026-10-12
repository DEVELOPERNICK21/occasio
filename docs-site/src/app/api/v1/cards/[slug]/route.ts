import { NextResponse } from 'next/server';
import { lookupCardBySlug } from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { allowCardRead, recordCardMiss } from '@/lib/cardReadLimit';
import { clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
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

  const ip = clientIp(request);
  if (!allowCardRead(ip)) {
    return NextResponse.json(
      { code: 'THROTTLED', message: 'Too many requests. Try again shortly.' },
      { status: 429 },
    );
  }

  const result = await lookupCardBySlug(slug);
  if (result.status === 'not_found') {
    recordCardMiss(ip);
  }
  if (result.status === 'expired') {
    return NextResponse.json(
      { code: 'EXPIRED', message: 'This link has expired' },
      { status: 410 },
    );
  }
  if (result.status === 'locked') {
    return NextResponse.json(
      { code: 'LOCKED', message: 'This card needs a passcode' },
      { status: 403 },
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
    templateId: card.templateId,
    mediaUrls: card.mediaUrls ?? [],
    fromName: card.fromName,
    reactionCount: card.reactionCount ?? 0,
    reasons: card.reasons ?? [],
  });
}
