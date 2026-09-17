import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getApiBaseUrl, env } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import type { OccasionType, ScheduledSendStatus } from '../domain/types';
import { VaultError } from './vaultErrors';
import {
  ScheduledSendApiError,
  type ReviewSendResult,
} from './scheduledSendErrors';

export type ScheduledSend = {
  id: string;
  relationshipId: string;
  occasionType: OccasionType;
  status: ScheduledSendStatus;
  reviewDeadline: string;
  shareUrl: string | null;
  generatedCreationId: string | null;
  personName?: string;
};

type ScheduledSendDoc = {
  userId: string;
  relationshipId: string;
  personName?: string;
  occasionType: string;
  status: string;
  reviewDeadline: FirebaseFirestoreTypes.Timestamp | null;
  shareUrl: string | null;
  generatedCreationId: string | null;
};

const INBOX_STATUSES: ScheduledSendStatus[] = ['review', 'approved'];

let mockScheduledSends: ScheduledSend[] = [];

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
    throw new VaultError('NOT_AUTHENTICATED', 'Sign in to view scheduled sends.');
  }
  return uid;
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth().currentUser;
  if (!user) {
    throw new ScheduledSendApiError('NOT_AUTHENTICATED', 'Sign in to manage sends.');
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function isOccasionType(value: string): value is OccasionType {
  return value === 'birthday' || value === 'anniversary';
}

function isScheduledSendStatus(value: string): value is ScheduledSendStatus {
  return (
    value === 'pending' ||
    value === 'review' ||
    value === 'approved' ||
    value === 'cancelled' ||
    value === 'sent' ||
    value === 'failed'
  );
}

function mapDoc(id: string, data: ScheduledSendDoc): ScheduledSend | null {
  if (!isOccasionType(data.occasionType) || !isScheduledSendStatus(data.status)) {
    return null;
  }

  return {
    id,
    relationshipId: data.relationshipId,
    occasionType: data.occasionType,
    status: data.status,
    reviewDeadline: timestampToIso(data.reviewDeadline, ''),
    shareUrl: data.shareUrl ?? null,
    generatedCreationId: data.generatedCreationId ?? null,
    personName: data.personName,
  };
}

function sortInbox(sends: ScheduledSend[]): ScheduledSend[] {
  return [...sends].sort((a, b) => {
    if (a.status === 'review' && b.status !== 'review') return -1;
    if (b.status === 'review' && a.status !== 'review') return 1;
    const aDeadline = a.reviewDeadline ? Date.parse(a.reviewDeadline) : Number.MAX_SAFE_INTEGER;
    const bDeadline = b.reviewDeadline ? Date.parse(b.reviewDeadline) : Number.MAX_SAFE_INTEGER;
    return aDeadline - bDeadline;
  });
}

function toScheduledSendError(error: unknown): ScheduledSendApiError {
  if (error instanceof ScheduledSendApiError) {
    return error;
  }
  if (error instanceof VaultError && error.code === 'NOT_AUTHENTICATED') {
    return new ScheduledSendApiError('NOT_AUTHENTICATED', error.message);
  }
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return new ScheduledSendApiError('NOT_AUTHENTICATED', 'Sign in to manage sends.');
    }
    if (error.status === 403) {
      return new ScheduledSendApiError('FORBIDDEN', 'You cannot modify this send.');
    }
    if (error.status === 404) {
      return new ScheduledSendApiError('NOT_FOUND', 'Scheduled send not found.');
    }
    if (error.status === 409) {
      return new ScheduledSendApiError('CONFLICT', 'This send was already updated.');
    }
    if (error.code === 'VALIDATION_ERROR') {
      const message =
        error.message === 'photos_required' || error.message.includes('photo')
          ? 'Add at least one photo before approving.'
          : error.message;
      return new ScheduledSendApiError('VALIDATION_ERROR', message);
    }
    return new ScheduledSendApiError('INTERNAL', error.message);
  }
  return new ScheduledSendApiError('INTERNAL', 'Could not update scheduled send.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockApprove(id: string): ReviewSendResult {
  const send = mockScheduledSends.find((item) => item.id === id);
  if (!send) {
    throw new ScheduledSendApiError('NOT_FOUND', 'Scheduled send not found.');
  }
  if (send.status !== 'review') {
    throw new ScheduledSendApiError('CONFLICT', 'This send was already updated.');
  }

  const shareUrl = send.shareUrl ?? `${env.shareBaseUrl}/c/mock-autosend`;
  const updated: ScheduledSend = {
    ...send,
    status: 'approved',
    shareUrl,
  };
  mockScheduledSends = mockScheduledSends.map((item) => (item.id === id ? updated : item));

  return {
    ok: true,
    id,
    status: 'approved',
    shareUrl,
  };
}

function mockCancel(id: string): ReviewSendResult {
  const send = mockScheduledSends.find((item) => item.id === id);
  if (!send) {
    throw new ScheduledSendApiError('NOT_FOUND', 'Scheduled send not found.');
  }
  if (send.status !== 'review') {
    throw new ScheduledSendApiError('CONFLICT', 'This send was already updated.');
  }

  mockScheduledSends = mockScheduledSends.filter((item) => item.id !== id);

  return {
    ok: true,
    id,
    status: 'cancelled',
    shareUrl: send.shareUrl,
  };
}

export function subscribeScheduledSends(
  onChange: (sends: ScheduledSend[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const uid = requireUid();

  if (env.useMockApi || env.useMockAuth) {
    const sync = () => {
      const sends = mockScheduledSends.filter(
        (send) =>
          send.id.startsWith(`${uid}_`) &&
          INBOX_STATUSES.includes(send.status),
      );
      onChange(sortInbox(sends));
    };
    sync();
    const interval = setInterval(sync, 500);
    return () => clearInterval(interval);
  }

  return firestore()
    .collection('scheduled_sends')
    .where('userId', '==', uid)
    .where('status', 'in', INBOX_STATUSES)
    .onSnapshot(
      (snapshot) => {
        const sends = snapshot.docs
          .map((doc) => mapDoc(doc.id, doc.data() as ScheduledSendDoc))
          .filter((send): send is ScheduledSend => send != null);
        onChange(sortInbox(sends));
      },
      (error) => {
        onError?.(error);
      },
    );
}

export async function approveScheduledSend(id: string): Promise<ReviewSendResult> {
  if (env.useMockApi) {
    await delay(300);
    return mockApprove(id);
  }

  try {
    const headers = await authHeaders();
    return await httpClient.post<ReviewSendResult>(
      getApiBaseUrl(),
      `/v1/scheduled-sends/${encodeURIComponent(id)}/approve`,
      undefined,
      headers,
    );
  } catch (error) {
    throw toScheduledSendError(error);
  }
}

export async function cancelScheduledSend(id: string): Promise<ReviewSendResult> {
  if (env.useMockApi) {
    await delay(300);
    return mockCancel(id);
  }

  try {
    const headers = await authHeaders();
    return await httpClient.post<ReviewSendResult>(
      getApiBaseUrl(),
      `/v1/scheduled-sends/${encodeURIComponent(id)}/cancel`,
      undefined,
      headers,
    );
  } catch (error) {
    throw toScheduledSendError(error);
  }
}
