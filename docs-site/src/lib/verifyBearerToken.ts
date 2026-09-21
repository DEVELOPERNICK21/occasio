import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export type VerifiedUser = {
  uid: string;
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
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
