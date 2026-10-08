import {
  assignWidgetLabels,
  buildWidgetSnapshot,
  nextOccurrences,
  snapshotSignature,
  WIDGET_MAX_ENTRIES,
} from '../../src/features/widgets/domain/widgetSnapshot';
import type { RelationshipType, VaultPerson } from '../../src/features/vault/domain/types';

function person(overrides: Partial<VaultPerson> & { id: string }): VaultPerson {
  return {
    userId: 'u1',
    personName: 'Aarav Sharma',
    relationshipType: 'friend' as RelationshipType,
    birthday: null,
    anniversary: null,
    whatsapp: '+919876543210',
    email: 'aarav@example.com',
    autoSendBirthday: false,
    autoSendAnniversary: false,
    pack: null,
    lastCreationId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date(2026, 9, 8, 15, 30); // 8 Oct 2026, afternoon

describe('nextOccurrences', () => {
  it('returns today and the following year when the date is today', () => {
    expect(nextOccurrences({ month: 10, day: 8 }, NOW)).toEqual(['2026-10-08', '2027-10-08']);
  });

  it('rolls to next year once the date has passed', () => {
    expect(nextOccurrences({ month: 10, day: 7 }, NOW)).toEqual(['2027-10-07', '2028-10-07']);
  });

  it('keeps a later date this year', () => {
    expect(nextOccurrences({ month: 12, day: 25 }, NOW)).toEqual(['2026-12-25', '2027-12-25']);
  });

  it('puts Feb 29 on Feb 28 in non-leap years, the day auto-send fires', () => {
    expect(nextOccurrences({ month: 2, day: 29 }, NOW)).toEqual(['2027-02-28', '2028-02-29']);
  });

  it('skips impossible dates instead of rolling into the next month', () => {
    expect(nextOccurrences({ month: 4, day: 31 }, NOW)).toEqual([]);
    expect(nextOccurrences({ month: 2, day: 30 }, NOW)).toEqual([]);
  });
});

describe('assignWidgetLabels', () => {
  it('uses the plain relationship label for a single person', () => {
    const labels = assignWidgetLabels([
      person({ id: 'a', relationshipType: 'mom' }),
      person({ id: 'b', relationshipType: 'other' }),
    ]);
    expect(labels.get('a')).toBe('Mom');
    expect(labels.get('b')).toBe('Someone special');
  });

  it('adds only the first initial when two people share a relationship', () => {
    const labels = assignWidgetLabels([
      person({ id: 'a', personName: 'rohan Gupta', relationshipType: 'friend' }),
      person({ id: 'b', personName: 'Meera Rao', relationshipType: 'friend' }),
    ]);
    expect(labels.get('a')).toBe('Friend (R)');
    expect(labels.get('b')).toBe('Friend (M)');
  });

  it('numbers people whose relationship and initial both match', () => {
    const labels = assignWidgetLabels([
      person({ id: 'a', personName: 'Ravi', relationshipType: 'friend' }),
      person({ id: 'b', personName: 'Riya', relationshipType: 'friend' }),
    ]);
    expect([...labels.values()].sort()).toEqual(['Friend (R)', 'Friend (R) 2']);
  });
});

describe('buildWidgetSnapshot', () => {
  const people = [
    person({
      id: 'p1',
      personName: 'Sunita Verma',
      relationshipType: 'mom',
      birthday: { month: 10, day: 10 },
      autoSendBirthday: true,
    }),
    person({
      id: 'p2',
      personName: 'Karan Mehta',
      relationshipType: 'partner',
      birthday: { month: 1, day: 5 },
      anniversary: { month: 10, day: 9 },
    }),
    person({ id: 'p3', personName: 'No Dates', relationshipType: 'dad' }),
  ];

  it('never contains a name, phone number or email', () => {
    const json = JSON.stringify(buildWidgetSnapshot(people, NOW));
    for (const secret of [
      'Sunita',
      'Verma',
      'Karan',
      'Mehta',
      'No Dates',
      '+9198',
      '@example.com',
    ]) {
      expect(json).not.toContain(secret);
    }
  });

  it('lists one entry per occasion, soonest first, and skips people with no dates', () => {
    const { entries } = buildWidgetSnapshot(people, NOW);
    expect(entries.map((e) => [e.label, e.kind, e.dates[0]])).toEqual([
      ['Partner', 'anniversary', '2026-10-09'],
      ['Mom', 'birthday', '2026-10-10'],
      ['Partner', 'birthday', '2027-01-05'],
    ]);
  });

  it('carries the auto-send flag and the person id for the deep link', () => {
    const mom = buildWidgetSnapshot(people, NOW).entries.find((e) => e.label === 'Mom');
    expect(mom).toMatchObject({ id: 'p1', autoSend: true, relationship: 'mom' });
  });

  it('caps the list', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      person({ id: `x${i}`, birthday: { month: 11, day: 1 + (i % 28) } }),
    );
    expect(buildWidgetSnapshot(many, NOW).entries).toHaveLength(WIDGET_MAX_ENTRIES);
  });

  it('has a signature that ignores the timestamp but notices real changes', () => {
    const a = buildWidgetSnapshot(people, NOW);
    const b = buildWidgetSnapshot(people, new Date(2026, 9, 8, 22, 0));
    expect(snapshotSignature(a)).toBe(snapshotSignature(b));
    // Stable while the same two occurrences are next…
    const sameDay = buildWidgetSnapshot(people, new Date(2026, 9, 9, 8, 0));
    expect(snapshotSignature(a)).toBe(snapshotSignature(sameDay));
    // …and changes once a date passes (the 9 Oct anniversary rolls to 2027).
    const afterDate = buildWidgetSnapshot(people, new Date(2026, 9, 10, 8, 0));
    expect(snapshotSignature(a)).not.toBe(snapshotSignature(afterDate));
  });
});
