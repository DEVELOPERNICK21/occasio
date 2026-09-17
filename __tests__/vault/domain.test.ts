import {
  daysUntilPersonDate,
  formatBirthdayInput,
  formatPersonDate,
  parseBirthdayInput,
  validatePersonDraft,
} from '../../src/features/vault/domain/personRules';
import {
  canAddPerson,
  canEnableAutoSend,
  personCapForTier,
} from '../../src/features/vault/domain/tierLimits';
import { EMPTY_PERSON_DRAFT } from '../../src/features/vault/domain/types';
import { getVaultCardTheme, personInitials } from '../../src/features/vault/domain/vaultCardTheme';
import {
  AUTO_SEND_DELIVERY_COPY,
  filterVaultPeople,
  formatArmedOccasions,
  formatPackSummary,
  getPersonNextOccasion,
} from '../../src/features/vault/domain/vaultOccasion';
import type { AutoSendPack } from '../../src/features/vault/domain/types';

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

  it('requires anniversary when auto-send anniversary enabled', () => {
    const result = validatePersonDraft(
      { ...EMPTY_PERSON_DRAFT, personName: 'Sam', relationshipType: 'partner' },
      { autoSendBirthday: false, autoSendAnniversary: true },
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

  it('parses dd/mm birthday input for the add-person form', () => {
    expect(parseBirthdayInput('12/09')).toEqual({ day: '12', month: '9' });
    expect(parseBirthdayInput('12/09/1990')).toEqual({ day: '12', month: '9' });
    expect(parseBirthdayInput('32/09')).toBeNull();
    expect(formatBirthdayInput('9', '12')).toBe('12/09');
  });
});

describe('vaultCardTheme', () => {
  it('maps relationship types to card themes', () => {
    expect(getVaultCardTheme('partner').tagLabel).toBe('PARTNER');
    expect(getVaultCardTheme('friend').tagLabel).toBe('FRIEND');
    expect(getVaultCardTheme('parent').tagLabel).toBe('FAMILY');
    expect(getVaultCardTheme('mom').tagLabel).toBe('FAMILY');
    expect(personInitials('Eleanor Vance')).toBe('EV');
  });
});

describe('vaultOccasion', () => {
  it('describes the next birthday occasion', () => {
    const occasion = getPersonNextOccasion(
      {
        id: '1',
        userId: 'u',
        personName: 'Julian',
        relationshipType: 'friend',
        birthday: { month: 9, day: 6 },
        anniversary: null,
        whatsapp: null,
        email: null,
        autoSendBirthday: false,
        autoSendAnniversary: false,
        pack: null,
        lastCreationId: null,
        createdAt: '',
        updatedAt: '',
      },
      new Date('2026-09-01'),
    );

    expect(occasion.hasDate).toBe(true);
    expect(occasion.headline).toContain('Birthday');
  });

  it('picks nearer occasion between birthday and anniversary', () => {
    const base = {
      id: '1',
      userId: 'u',
      personName: 'Sam',
      relationshipType: 'partner' as const,
      whatsapp: null,
      email: null,
      autoSendBirthday: false,
      autoSendAnniversary: false,
      pack: null,
      lastCreationId: null,
      createdAt: '',
      updatedAt: '',
    };

    const birthdaySooner = getPersonNextOccasion(
      {
        ...base,
        birthday: { month: 9, day: 6 },
        anniversary: { month: 9, day: 20 },
      },
      new Date('2026-09-01'),
    );
    expect(birthdaySooner.headline).toContain('Birthday');

    const anniversarySooner = getPersonNextOccasion(
      {
        ...base,
        birthday: { month: 12, day: 1 },
        anniversary: { month: 9, day: 10 },
      },
      new Date('2026-09-01'),
    );
    expect(anniversarySooner.headline).toContain('Anniversary');
  });

  it('filters people by search query', () => {
    const people = [
      {
        id: '1',
        userId: 'u',
        personName: 'Eleanor Vance',
        relationshipType: 'partner' as const,
        birthday: null,
        anniversary: null,
        whatsapp: null,
        email: null,
        autoSendBirthday: false,
        autoSendAnniversary: false,
        pack: null,
        lastCreationId: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        userId: 'u',
        personName: 'Julian Smith',
        relationshipType: 'friend' as const,
        birthday: null,
        anniversary: null,
        whatsapp: null,
        email: null,
        autoSendBirthday: false,
        autoSendAnniversary: false,
        pack: null,
        lastCreationId: null,
        createdAt: '',
        updatedAt: '',
      },
    ];

    expect(filterVaultPeople(people, 'julian')).toHaveLength(1);
  });
});

describe('armed occasions copy', () => {
  it('names birthday, anniversary, both, or none', () => {
    expect(
      formatArmedOccasions({ autoSendBirthday: false, autoSendAnniversary: false }),
    ).toBe('Not armed');
    expect(
      formatArmedOccasions({ autoSendBirthday: true, autoSendAnniversary: false }),
    ).toBe('Birthday');
    expect(
      formatArmedOccasions({ autoSendBirthday: false, autoSendAnniversary: true }),
    ).toBe('Anniversary');
    expect(
      formatArmedOccasions({ autoSendBirthday: true, autoSendAnniversary: true }),
    ).toBe('Birthday · Anniversary');
  });

  it('uses honest delivery copy instead of coming soon', () => {
    expect(AUTO_SEND_DELIVERY_COPY).toBe(
      'Armed for delivery when the date arrives',
    );
    expect(AUTO_SEND_DELIVERY_COPY.toLowerCase()).not.toContain('coming soon');
  });

  it('summarizes pack message, photos, and last-card fallback', () => {
    const emptyPack: AutoSendPack = {
      preferredTemplateId: null,
      preferredTemplateType: null,
      photoRefs: [],
      defaultMessage: '',
      fromName: null,
    };

    expect(formatPackSummary(null, null)).toBe(
      'No message yet. Photos come from your last card or Create.',
    );
    expect(formatPackSummary(null, 'c1')).toBe('Uses last saved card for photos');
    expect(
      formatPackSummary(
        { ...emptyPack, defaultMessage: 'Happy birthday', photoRefs: ['p1', 'p2'] },
        null,
      ),
    ).toBe('Happy birthday · 2 photos');
    expect(formatPackSummary({ ...emptyPack, defaultMessage: 'Hi' }, null)).toBe(
      'Hi · Photos from last card or Create',
    );
  });
});
