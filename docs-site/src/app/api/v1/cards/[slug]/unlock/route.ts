import { NextResponse } from 'next/server';
import { unlockCardBySlug } from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { DEMO_PASSCODE, isDemoLockedSlug, parseDemoSlug } from '@/lib/recipientCard';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST /api/v1/cards/:slug/unlock  { code } — verifies the passcode, returns the card. */
export async function POST(request: Request, context: RouteContext) {
  const { slug: demoSlug } = await context.params;
  if (isDemoLockedSlug(demoSlug)) {
    const body = (await request.json().catch(() => ({}))) as { code?: unknown };
    const card = parseDemoSlug(demoSlug);
    if (card && body.code === DEMO_PASSCODE) {
      return NextResponse.json({ card });
    }
    return NextResponse.json({ code: 'WRONG_CODE', attemptsLeft: 4 }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Server is not configured' },
      { status: 503 },
    );
  }

  const { slug } = await context.params;
  if (!slug || slug.length < 6 || slug.length > 32) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
  }

  if (!rateLimit(`unlock:${clientIp(request)}:${slug}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429 });
  }

  let code = '';
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? body.code : '';
  } catch {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const result = await unlockCardBySlug(slug, code);
  switch (result.status) {
    case 'unlocked':
      return NextResponse.json({ card: result.card });
    case 'wrong':
      return NextResponse.json(
        { code: 'WRONG_CODE', attemptsLeft: result.attemptsLeft },
        { status: 401 },
      );
    case 'throttled':
      return NextResponse.json(
        { code: 'THROTTLED', retryAfterSec: result.retryAfterSec },
        { status: 429 },
      );
    case 'expired':
      return NextResponse.json({ code: 'EXPIRED' }, { status: 410 });
    default:
      return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
  }
}
