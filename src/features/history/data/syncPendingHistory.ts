import {
  clearPendingHistoryEntries,
  readPendingHistoryEntries,
  writePendingHistoryEntries,
} from './pendingHistoryStorage';
import { recordHistoryEntry } from './historyRepository';

/** Upload guest creations queued locally after the user signs in. */
export async function syncPendingHistoryEntries(): Promise<number> {
  const pending = await readPendingHistoryEntries();
  if (pending.length === 0) {
    return 0;
  }

  const failed: typeof pending = [];
  let synced = 0;

  for (const input of pending) {
    try {
      await recordHistoryEntry(input);
      synced += 1;
    } catch {
      failed.push(input);
    }
  }

  if (failed.length === 0) {
    await clearPendingHistoryEntries();
  } else {
    await writePendingHistoryEntries(failed);
  }

  return synced;
}
