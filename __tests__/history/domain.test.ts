import {
  filterHistoryEntries,
  historyStatusHeadline,
  recipientInitials,
  summarizeHistory,
} from '../../src/features/history/domain/historyList';
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

describe('historyList', () => {
  const now = new Date('2026-09-15T12:00:00Z');

  it('derives recipient initials', () => {
    expect(recipientInitials('Mom')).toBe('MO');
    expect(recipientInitials('Jane Doe')).toBe('JD');
    expect(recipientInitials('  ')).toBe('?');
  });

  it('filters by recipient, template, or message', () => {
    const entries = [
      sampleEntry('a', '2026-09-01T00:00:00Z', '2026-10-01T00:00:00Z'),
      {
        ...sampleEntry('b', '2026-09-02T00:00:00Z', '2026-10-02T00:00:00Z'),
        recipientName: 'Alex',
        templateType: 'anniversary',
      },
    ];

    expect(filterHistoryEntries(entries, 'alex')).toHaveLength(1);
    expect(filterHistoryEntries(entries, 'birthday')).toHaveLength(1);
    expect(filterHistoryEntries(entries, 'happy')).toHaveLength(1);
  });

  it('summarizes totals and active links', () => {
    const entries = [
      sampleEntry('a', '2026-09-10T00:00:00Z', '2026-10-10T00:00:00Z'),
      sampleEntry('b', '2026-08-01T00:00:00Z', '2026-08-15T00:00:00Z'),
    ];

    expect(summarizeHistory(entries, now)).toEqual({
      total: 2,
      active: 1,
      thisMonth: 1,
    });
  });

  it('describes link status for active and expired entries', () => {
    const active = sampleEntry('a', '2026-09-10T00:00:00Z', '2026-09-20T00:00:00Z');
    const expired = sampleEntry('b', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z');

    expect(historyStatusHeadline(active, now)).toBe('Active for 5 more days');
    expect(historyStatusHeadline(expired, now)).toBe('Link expired');
  });
});
