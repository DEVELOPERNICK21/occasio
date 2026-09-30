import { NextResponse } from 'next/server';
import { CARD_EVENT_TYPES, recordCardEvent } from '@/lib/creationsServer';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST /api/v1/cards/:slug/events  { type } — anonymous funnel counters. */
export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug || slug.length < 6 || slug.length > 32) {
    return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
  }
  if (!rateLimit(`event:${clientIp(request)}`, 60, 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429 });
  }

  let type: unknown;
  try {
    type = ((await request.json()) as { type?: unknown }).type;
  } catch {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (!CARD_EVENT_TYPES.includes(type as (typeof CARD_EVENT_TYPES)[number])) {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const ok = await recordCardEvent(
    slug,
    type as (typeof CARD_EVENT_TYPES)[number],
  );
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
