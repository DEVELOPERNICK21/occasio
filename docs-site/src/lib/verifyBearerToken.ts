import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export type VerifiedUser = {
  uid: string;
  /** Only trusted for the free-card claim when the provider verified it. */
  email: string | null;
  /** Anonymous Firebase accounts cost nothing to mint, so they cannot hold a free allowance. */
  anonymous: boolean;
  /**
   * The sign-in proved something real: Google or Apple vouched for them, or they confirmed
   * their inbox. An email and password that nobody checked proves nothing, because anyone
   * can mint those by the hundred.
   */
  verified: boolean;
  /** Google or Apple ids (`google.com:1234`): they stay the same if the email changes. */
  subjects: string[];
};

const VOUCHING_PROVIDERS = ['google.com', 'apple.com'] as const;

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
    const provider = decoded.firebase?.sign_in_provider;
    const anonymous = provider === 'anonymous';
    const identities = (decoded.firebase?.identities ?? {}) as Record<string, unknown>;
    const subjects = VOUCHING_PROVIDERS.flatMap((name) => {
      const ids = identities[name];
      return Array.isArray(ids) ? ids.map((id) => `${name}:${String(id)}`) : [];
    });
    const vouched = (VOUCHING_PROVIDERS as readonly string[]).includes(provider ?? '');
    return {
      uid: decoded.uid,
      email: decoded.email && decoded.email_verified ? decoded.email : null,
      anonymous,
      verified: !anonymous && (vouched || decoded.email_verified === true),
      subjects,
    };
  } catch {
    return null;
  }
}
