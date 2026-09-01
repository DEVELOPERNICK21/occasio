import type { HistoryEntry } from './types';

export function isHistoryEntryExpired(entry: HistoryEntry, now = new Date()): boolean {
  return new Date(entry.expiresAt) < now;
}

export function sortHistoryNewestFirst(entries: HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
