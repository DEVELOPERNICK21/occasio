import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { httpClient } from '../../../shared/api/httpClient';
import { env } from '../../../shared/config/env';
import type { HistoryEntry, RecordHistoryInput } from '../domain/types';
import { HistoryError } from './historyErrors';

type HistoryDoc = {
  userId: string;
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  recipientName: string;
  templateType: string;
  message: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  expiresAt: FirebaseFirestoreTypes.Timestamp | null;
};

let mockStore: HistoryEntry[] = [];

function timestampToIso(
  value: FirebaseFirestoreTypes.Timestamp | null | undefined,
  fallback: string,
): string {
  if (!value || typeof value.toDate !== 'function') {
    return fallback;
  }
  return value.toDate().toISOString();
}

function requireUid(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new HistoryError('NOT_AUTHENTICATED', 'Sign in to view your history.');
  }
  return uid;
}

function mapDoc(id: string, data: HistoryDoc): HistoryEntry {
  const fallback = new Date().toISOString();
  return {
    id,
    userId: data.userId,
    creationId: data.creationId,
    shareSlug: data.shareSlug,
    shareUrl: data.shareUrl,
    recipientName: data.recipientName,
    templateType: data.templateType,
    message: data.message,
    createdAt: timestampToIso(data.createdAt, fallback),
    expiresAt: timestampToIso(data.expiresAt, fallback),
  };
}

export function subscribeHistory(
  onChange: (entries: HistoryEntry[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const uid = requireUid();

  if (env.useMockAuth) {
    const sync = () => {
      onChange(mockStore.filter((entry) => entry.userId === uid));
    };
    sync();
    const interval = setInterval(sync, 500);
    return () => clearInterval(interval);
  }

  return firestore()
    .collection('user_creations')
    .where('userId', '==', uid)
    .onSnapshot(
      (snapshot) => {
        const entries = snapshot.docs.map((doc) =>
          mapDoc(doc.id, doc.data() as HistoryDoc),
        );
        entries.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        onChange(entries);
      },
      (error) => {
        onError?.(error);
      },
    );
}

export async function recordHistoryEntry(input: RecordHistoryInput): Promise<void> {
  const uid = requireUid();
  const now = new Date().toISOString();

  if (env.useMockAuth) {
    const existing = mockStore.find(
      (entry) => entry.creationId === input.creationId && entry.userId === uid,
    );
    if (existing) return;

    mockStore = [
      {
        id: input.creationId,
        userId: uid,
        creationId: input.creationId,
        shareSlug: input.shareSlug,
        shareUrl: input.shareUrl,
        recipientName: input.recipientName,
        templateType: input.templateType,
        message: input.message,
        createdAt: now,
        expiresAt: input.expiresAt,
      },
      ...mockStore,
    ];
    return;
  }

  try {
    await firestore()
      .collection('user_creations')
      .doc(input.creationId)
      .set(
        {
          userId: uid,
          creationId: input.creationId,
          shareSlug: input.shareSlug,
          shareUrl: input.shareUrl,
          recipientName: input.recipientName,
          templateType: input.templateType,
          message: input.message,
          createdAt: firestore.FieldValue.serverTimestamp(),
          expiresAt: firestore.Timestamp.fromDate(new Date(input.expiresAt)),
        },
        { merge: true },
      );
  } catch {
    throw new HistoryError('NETWORK', 'Could not save to history.');
  }
}

/** Permanently remove a history entry and kill the public share link. */
export async function deleteHistoryEntry(entryId: string): Promise<void> {
  const uid = requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.filter(
      (entry) => !(entry.id === entryId && entry.userId === uid),
    );
    return;
  }

  try {
    const ref = firestore().collection('user_creations').doc(entryId);
    const snap = await ref.get();
    if (!snap.exists) {
      return;
    }
    const data = snap.data() as HistoryDoc | undefined;
    if (!data || data.userId !== uid) {
      throw new HistoryError('UNKNOWN', 'Could not delete this card.');
    }

    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      throw new HistoryError('NOT_AUTHENTICATED', 'Sign in to delete this card.');
    }

    // Server expires `creations/{id}` then deletes this history row.
    try {
      await httpClient.delete(
        env.sparkApiBaseUrl,
        `/api/v1/creations/${encodeURIComponent(entryId)}`,
        { Authorization: `Bearer ${token}` },
      );
    } catch {
      // Fallback: at least remove from History if revoke API is unreachable.
      await ref.delete();
      throw new HistoryError(
        'NETWORK',
        'Removed from History, but the share link may still work. Try again.',
      );
    }
  } catch (error) {
    if (error instanceof HistoryError) {
      throw error;
    }
    throw new HistoryError('NETWORK', 'Could not delete this card.');
  }
}
