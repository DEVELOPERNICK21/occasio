import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import {
  SUPPRESSIONS,
  unsubscribeSecret,
  verifyUnsubscribeToken,
} from '@/lib/email/unsubscribe';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/v1/email/unsubscribe?t=<token>
 *
 * RFC 8058 one-click target (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`)
 * and the button on /unsubscribe. Takes effect immediately: every send checks the
 * list first. Stores only a hash of the address.
 */
export async function POST(request: Request) {
  const secret = unsubscribeSecret();
  if (!secret || !isFirebaseAdminConfigured()) {
    return NextResponse.json({ code: 'INTERNAL' }, { status: 503, headers: NO_STORE });
  }
  if (!rateLimit(`unsub:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429, headers: NO_STORE });
  }

  const key = verifyUnsubscribeToken(new URL(request.url).searchParams.get('t'), secret);
  if (!key) {
    return NextResponse.json({ code: 'INVALID_LINK' }, { status: 400, headers: NO_STORE });
  }

  await getAdminFirestore()
    .collection(SUPPRESSIONS)
    .doc(key)
    .set({ suppressedAt: Timestamp.now(), source: 'unsubscribe_link' }, { merge: true });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

/** A GET must never unsubscribe (link scanners open links); send people to the confirm page. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  const target = new URL('/unsubscribe', request.url);
  if (token) target.searchParams.set('t', token);
  return NextResponse.redirect(target, 307);
}
