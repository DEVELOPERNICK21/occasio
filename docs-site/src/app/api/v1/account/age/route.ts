import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { attestationSecret, verifyAttestation } from '@/lib/age/attestation';
import { checkDate, isOldEnough, MINIMUM_AGE, parseDateOfBirth } from '@/lib/age/ageGate';
import { purgeUser } from '@/lib/age/purgeUser';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { verifyBearerToken } from '@/lib/verifyBearerToken';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/v1/account/age   Authorization: Bearer <ID token>
 *   { attestation }            – the signed token from /age/check, or
 *   { year, month, day }       – a date of birth (existing accounts that never had the check)
 *
 * Records, server-side, that this account passed the 13+ check. If a date of
 * birth shows the person is under 13, the account and everything in it is erased
 * and nothing about the attempt is kept.
 */
export async function POST(request: Request) {
  const secret = attestationSecret();
  if (!secret || !isFirebaseAdminConfigured()) {
    return NextResponse.json({ code: 'INTERNAL' }, { status: 503, headers: NO_STORE });
  }

  const user = await verifyBearerToken(request);
  if (!user) {
    return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401, headers: NO_STORE });
  }
  if (!rateLimit(`acct-age:${user.uid}:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429, headers: NO_STORE });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  let allowed = false;
  if (body && typeof body.attestation === 'string') {
    allowed = verifyAttestation(body.attestation, secret);
    if (!allowed) {
      return NextResponse.json({ code: 'ATTESTATION_INVALID' }, { status: 403, headers: NO_STORE });
    }
  } else {
    const today = checkDate();
    const dob = parseDateOfBirth(body, today);
    if (!dob) {
      return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400, headers: NO_STORE });
    }
    if (!isOldEnough(dob, today)) {
      await purgeUser(user.uid);
      return NextResponse.json(
        { code: 'UNDER_AGE', message: 'You need to be 13 or older to use Occasio.' },
        { status: 403, headers: NO_STORE },
      );
    }
    allowed = true;
  }

  await getAdminFirestore()
    .collection('users')
    .doc(user.uid)
    .set({ ageConfirmedAt: Timestamp.now(), ageMinimum: MINIMUM_AGE }, { merge: true });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
