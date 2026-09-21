import { NextResponse } from 'next/server';
import {
  ApiRouteError,
  revokeCreation,
} from '@/lib/creationsServer';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { verifyBearerToken } from '@/lib/verifyBearerToken';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ creationId: string }>;
};

/**
 * DELETE /api/v1/creations/:creationId
 * Auth required. Expires the public share link and removes History.
 */
export async function DELETE(request: Request, context: RouteContext) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Server is not configured' },
      { status: 503 },
    );
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'Sign in to delete this card.' },
      { status: 401 },
    );
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
