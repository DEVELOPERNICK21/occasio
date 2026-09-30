import type { Request } from 'express';
import type * as admin from 'firebase-admin';

/** Verify `Authorization: Bearer <Firebase ID token>`; returns the uid or null. */
export async function requireUid(
  req: Request,
  auth: admin.auth.Auth,
): Promise<string | null> {
  const header = req.header('Authorization') ?? req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
