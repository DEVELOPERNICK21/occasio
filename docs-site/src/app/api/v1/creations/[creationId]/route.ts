import { NextResponse } from 'next/server';
import {
  ApiRouteError,
  getOwnedCreation,
  revokeCreation,
  updateCreation,
  validateCreateInput,
} from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { verifyBearerToken } from '@/lib/verifyBearerToken';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ creationId: string }>;
};

function unauthorized() {
  return NextResponse.json(
    { code: 'UNAUTHORIZED', message: 'Sign in to manage this card.' },
    { status: 401 },
  );
}

function notConfigured() {
  return NextResponse.json(
    { code: 'INTERNAL', message: 'Server is not configured' },
    { status: 503 },
  );
}

function mapOwnedError(
  status: 'not_found' | 'forbidden' | 'expired',
): NextResponse {
  if (status === 'forbidden') {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'Not allowed to edit this card.' },
      { status: 403 },
    );
  }
  if (status === 'expired') {
    return NextResponse.json(
      { code: 'EXPIRED', message: 'This link has expired. Create a new card.' },
      { status: 410 },
    );
  }
  return NextResponse.json(
    { code: 'NOT_FOUND', message: 'Card not found' },
    { status: 404 },
  );
}

/**
 * GET /api/v1/creations/:creationId
 * Auth required. Load owned card for edit-after-create.
 */
export async function GET(request: Request, context: RouteContext) {
  if (!isFirebaseAdminConfigured()) {
    return notConfigured();
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return unauthorized();
  }

  const { creationId } = await context.params;
  if (!creationId?.trim()) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  try {
    const result = await getOwnedCreation(creationId, user.uid);
    if (result.status !== 'found') {
      return mapOwnedError(result.status);
    }
    return NextResponse.json(result.creation);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error('[GET /api/v1/creations/:id]', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Could not load card' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/creations/:creationId
 * Auth required. Update card content; keep the same share slug/URL.
 */
export async function PATCH(request: Request, context: RouteContext) {
  if (!isFirebaseAdminConfigured()) {
    return notConfigured();
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return unauthorized();
  }

  const { creationId } = await context.params;
  if (!creationId?.trim()) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  try {
    const input = validateCreateInput(body);
    const result = await updateCreation(creationId, user.uid, input);
    if (result.status !== 'updated') {
      return mapOwnedError(result.status);
    }
    return NextResponse.json(result.creation);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error('[PATCH /api/v1/creations/:id]', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Could not update card' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/creations/:creationId
 * Auth required. Expires the public share link and removes History.
 */
export async function DELETE(request: Request, context: RouteContext) {
  if (!isFirebaseAdminConfigured()) {
    return notConfigured();
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return unauthorized();
  }

  const { creationId } = await context.params;
  if (!creationId?.trim()) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Card not found' },
      { status: 404 },
    );
  }

  try {
    const result = await revokeCreation(creationId, user.uid);
    if (result.status === 'not_found') {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Card not found' },
        { status: 404 },
      );
    }
    if (result.status === 'forbidden') {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Not allowed to delete this card.' },
        { status: 403 },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error('[DELETE /api/v1/creations/:id]', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Could not delete card' },
      { status: 500 },
    );
  }
}
