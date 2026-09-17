import { NextResponse } from 'next/server';
import { recordCardReaction } from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  const reactionCount = await recordCardReaction(slug);
  if (reactionCount === null) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({ reactionCount });
}
