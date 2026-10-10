import { NextResponse } from 'next/server';
import { attestationSecret, createAttestation } from '@/lib/age/attestation';
import { checkDate, isOldEnough, parseDateOfBirth } from '@/lib/age/ageGate';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/v1/age/check  { year, month, day }
 *
 * COPPA gate. Validates the date of birth on the server and answers yes or no.
 * Nothing is stored and the request body is never logged. A "yes" returns a
 * signed token with no personal data in it.
 */
export async function POST(request: Request) {
  const secret = attestationSecret();
  if (!secret) {
    return NextResponse.json({ code: 'INTERNAL' }, { status: 503, headers: NO_STORE });
  }
  if (!rateLimit(`age:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ code: 'THROTTLED' }, { status: 429, headers: NO_STORE });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const today = checkDate();
  const dob = parseDateOfBirth(body, today);
  if (!dob) {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400, headers: NO_STORE });
  }
  if (!isOldEnough(dob, today)) {
    return NextResponse.json(
      { code: 'UNDER_AGE', message: 'You need to be 13 or older to use Occasio.' },
      { status: 403, headers: NO_STORE },
    );
  }
  return NextResponse.json(
    { ok: true, attestation: createAttestation(secret) },
    { headers: NO_STORE },
  );
}
