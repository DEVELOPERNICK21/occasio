import {
  daysUntilPersonDate,
  formatPersonDate,
  validatePersonDraft,
} from '../../src/features/vault/domain/personRules';
import {
  canAddPerson,
  canEnableAutoSend,
  personCapForTier,
} from '../../src/features/vault/domain/tierLimits';
import { EMPTY_PERSON_DRAFT } from '../../src/features/vault/domain/types';

describe('tierLimits', () => {
  it('caps people by subscription tier', () => {
    expect(personCapForTier('free')).toBe(1);
    expect(personCapForTier('personal')).toBe(5);
    expect(canAddPerson(0, 'free')).toBe(true);
    expect(canAddPerson(1, 'free')).toBe(false);
  });

  it('blocks auto-send on free tier', () => {
    expect(canEnableAutoSend('free')).toBe(false);
    expect(canEnableAutoSend('personal')).toBe(true);
  });
});

describe('personRules', () => {
  it('validates a complete person draft', () => {
    const result = validatePersonDraft(
      {
        ...EMPTY_PERSON_DRAFT,
        personName: 'Mom',
        relationshipType: 'parent',
        birthdayMonth: '9',
        birthdayDay: '12',
        whatsapp: '9876543210',
      },
      { autoSendBirthday: false },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.personName).toBe('Mom');
      expect(result.input.birthday).toEqual({ month: 9, day: 12 });
    }
  });

  it('requires birthday when auto-send is enabled', () => {
    const result = validatePersonDraft(
      {
        ...EMPTY_PERSON_DRAFT,
        personName: 'Mom',
        relationshipType: 'parent',
      },
      { autoSendBirthday: true },
    );
    expect(result.ok).toBe(false);
  });

  it('formats dates and computes days until birthday', () => {
    expect(formatPersonDate({ month: 9, day: 12 })).toBe('12 Sep');
    const days = daysUntilPersonDate(
      { month: 1, day: 1 },
      new Date(2026, 8, 1),
    );
    expect(days).toBeGreaterThan(0);
  });
});
