import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export type VerifiedUser = {
  uid: string;
  /** Only trusted for the free-card claim when the provider verified it. */
  email: string | null;
  /** Anonymous Firebase accounts cost nothing to mint, so they cannot hold a free allowance. */
  anonymous: boolean;
};

/** Verify `Authorization: Bearer <Firebase ID token>`. */
export async function verifyBearerToken(
  request: Request,
): Promise<VerifiedUser | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    return null;
  }

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(match[1]);
    if (!decoded.uid) return null;
    return {
      uid: decoded.uid,
      email: decoded.email && decoded.email_verified ? decoded.email : null,
      anonymous: decoded.firebase?.sign_in_provider === 'anonymous',
    };
  } catch {
    return null;
  }
}
