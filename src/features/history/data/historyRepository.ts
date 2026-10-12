import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { HttpError } from '../../../shared/api/errors';
import { httpClient } from '../../../shared/api/httpClient';
import { env } from '../../../shared/config/env';
import { DELETE_RETRY_MESSAGE, deleteFailureKind } from '../domain/deleteOutcome';
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
    const ref = firestore().collection('user_creations').doc(input.creationId);
    // Only used to decide create vs update. If the read is refused (older
    // deployed rules), treat the entry as new instead of losing it.
    const existing = await ref.get().catch(() => null);
    const payload: Record<string, unknown> = {
      userId: uid,
      creationId: input.creationId,
      shareSlug: input.shareSlug,
      shareUrl: input.shareUrl,
      recipientName: input.recipientName,
      templateType: input.templateType,
      message: input.message,
      expiresAt: firestore.Timestamp.fromDate(new Date(input.expiresAt)),
    };
    if (!existing?.exists) {
      payload.createdAt = firestore.FieldValue.serverTimestamp();
    } else {
      payload.updatedAt = firestore.FieldValue.serverTimestamp();
    }
    await ref.set(payload, { merge: true });
  } catch (error) {
    if (__DEV__) {
      console.warn('[history] could not save entry', error);
    }
    throw new HistoryError('NETWORK', 'Could not save to history.');
  }
}

/** What a delete achieved, for the one case where it is less than the person asked for. */
export type DeleteHistoryResult = {
  /** False when the row was cleared but the share link could not be turned off. */
  linkTurnedOff: boolean;
};

/** Permanently remove a history entry and kill the public share link. */
export async function deleteHistoryEntry(entryId: string): Promise<DeleteHistoryResult> {
  const uid = requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.filter(
      (entry) => !(entry.id === entryId && entry.userId === uid),
    );
    return { linkTurnedOff: true };
  }

  try {
    const ref = firestore().collection('user_creations').doc(entryId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { linkTurnedOff: true };
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
    } catch (error) {
      const status = error instanceof HttpError ? error.status : null;
      // The card is already gone (expired and cleaned up): nothing left to turn off.
      if (status === 404 || status === 410) {
        await ref.delete();
        return { linkTurnedOff: true };
      }
      const kind = deleteFailureKind(status);
      // The server says this account does not own the link. Trying again cannot
      // change that, and keeping the row would leave History stuck on it forever.
      // Clear only this person's own row, and let them know the link stays on.
      if (kind === 'not_owner') {
        await ref.delete();
        return { linkTurnedOff: false };
      }
      // Anything else may pass on a retry. Keep the row: deleting it now would
      // hide a link that still works, leaving the owner no way to turn it off.
      throw new HistoryError(
        kind === 'sign_in' ? 'NOT_AUTHENTICATED' : 'NETWORK',
        DELETE_RETRY_MESSAGE[kind],
      );
    }
    return { linkTurnedOff: true };
  } catch (error) {
    if (error instanceof HistoryError) {
      throw error;
    }
    throw new HistoryError('NETWORK', 'Could not delete this card.');
  }
}
