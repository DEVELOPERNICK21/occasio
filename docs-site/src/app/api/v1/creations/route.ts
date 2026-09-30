import { NextResponse } from 'next/server';
import {
  ApiRouteError,
  createCreation,
  validateCreateInput,
} from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 900_000;

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Server is not configured' },
      { status: 503 },
    );
  }

  if (!rateLimit(`create:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { code: 'THROTTLED', message: 'Too many cards from this network. Try again later.' },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Request body is too large' },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid JSON' },
      { status: 400 },
    );
  }

  try {
    const input = validateCreateInput(body);
    const result = await createCreation(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error('[POST /api/v1/creations]', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Could not create card' },
      { status: 500 },
    );
  }
}
