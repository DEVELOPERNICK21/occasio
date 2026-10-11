import { NextResponse } from 'next/server';
import { purgeUser } from '@/lib/age/purgeUser';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { verifyBearerToken } from '@/lib/verifyBearerToken';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * DELETE /api/v1/account   Authorization: Bearer <ID token>
 *
 * In-app account deletion (App Review 5.1.1(v)): removes the Vault, scheduled
 * sends, history, shared cards (links stop working), the profile and the
 * sign-in account.
 */
export async function DELETE(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ code: 'INTERNAL' }, { status: 503, headers: NO_STORE });
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401, headers: NO_STORE });
  }
  if (!rateLimit(`acct-delete:${user.uid}:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429, headers: NO_STORE });
  }

  try {
    await purgeUser(user.uid);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[DELETE /api/v1/account]', user.uid, error);
    return NextResponse.json({ code: 'INTERNAL' }, { status: 500, headers: NO_STORE });
  }
}
