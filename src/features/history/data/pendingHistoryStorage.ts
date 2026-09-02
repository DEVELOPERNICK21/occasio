import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecordHistoryInput } from '../domain/types';

const STORAGE_KEY = 'occasio.history.pending';

export async function readPendingHistoryEntries(): Promise<RecordHistoryInput[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecordHistoryInput);
  } catch {
    return [];
  }
}

export async function enqueuePendingHistoryEntry(
  input: RecordHistoryInput,
): Promise<void> {
  const existing = await readPendingHistoryEntries();
  if (existing.some((entry) => entry.creationId === input.creationId)) {
    return;
  }

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...existing, input]),
  );
}

export async function clearPendingHistoryEntries(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function writePendingHistoryEntries(
  entries: RecordHistoryInput[],
): Promise<void> {
  if (entries.length === 0) {
    await clearPendingHistoryEntries();
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function isRecordHistoryInput(value: unknown): value is RecordHistoryInput {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.creationId === 'string' &&
    typeof entry.shareSlug === 'string' &&
    typeof entry.shareUrl === 'string' &&
    typeof entry.recipientName === 'string' &&
    typeof entry.templateType === 'string' &&
    typeof entry.message === 'string' &&
    typeof entry.expiresAt === 'string'
  );
}
