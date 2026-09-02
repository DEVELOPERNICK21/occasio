import type { HistoryEntry } from './types';
import { isHistoryEntryExpired } from './historyRules';

export type HistorySummary = {
  total: number;
  active: number;
  thisMonth: number;
};

export function recipientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function filterHistoryEntries(
  entries: HistoryEntry[],
  query: string,
): HistoryEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter(
    (entry) =>
      entry.recipientName.toLowerCase().includes(needle) ||
      entry.templateType.toLowerCase().includes(needle) ||
      entry.message.toLowerCase().includes(needle),
  );
}

export function summarizeHistory(
  entries: HistoryEntry[],
  now = new Date(),
): HistorySummary {
  const month = now.getMonth();
  const year = now.getFullYear();

  return {
    total: entries.length,
    active: entries.filter((entry) => !isHistoryEntryExpired(entry, now)).length,
    thisMonth: entries.filter((entry) => {
      const created = new Date(entry.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length,
  };
}

export function historyStatusHeadline(entry: HistoryEntry, now = new Date()): string {
  if (isHistoryEntryExpired(entry, now)) {
    return 'Link expired';
  }
  const daysLeft = Math.ceil(
    (new Date(entry.expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysLeft <= 0) return 'Expires today';
  if (daysLeft === 1) return 'Active for 1 more day';
  return `Active for ${daysLeft} more days`;
}
