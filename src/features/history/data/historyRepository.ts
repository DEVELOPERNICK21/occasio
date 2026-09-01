import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
