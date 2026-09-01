import {
  formatHistoryDate,
  isHistoryEntryExpired,
  sortHistoryNewestFirst,
} from '../../src/features/history/domain/historyRules';
import type { HistoryEntry } from '../../src/features/history/domain/types';

const sampleEntry = (id: string, createdAt: string, expiresAt: string): HistoryEntry => ({
  id,
  userId: 'u1',
  creationId: id,
  shareSlug: 'abc123',
  shareUrl: 'https://example.com/c/abc123',
  recipientName: 'Mom',
  templateType: 'birthday',
  message: 'Happy birthday!',
  createdAt,
  expiresAt,
});

describe('historyRules', () => {
  it('sorts entries newest first', () => {
    const sorted = sortHistoryNewestFirst([
      sampleEntry('a', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
      sampleEntry('b', '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z'),
    ]);
    expect(sorted[0]?.id).toBe('b');
  });

  it('detects expired entries', () => {
    const expired = sampleEntry('x', '2025-01-01T00:00:00Z', '2025-02-01T00:00:00Z');
    expect(isHistoryEntryExpired(expired, new Date('2026-01-01'))).toBe(true);
  });

  it('formats dates for display', () => {
    expect(formatHistoryDate('2026-09-12T00:00:00Z')).toMatch(/2026/);
  });
});
