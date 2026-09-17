import {
  buildIdempotencyKey,
  istCalendarDate,
  matchesMonthDay,
} from '../../functions/src/autosend/dates';
import { resolveAutoSendContent } from '../../functions/src/autosend/content';

describe('autosend dates', () => {
  it('reads month/day/year in Asia/Kolkata', () => {
    // 2026-09-12 22:30 UTC = 2026-09-13 04:00 IST
    const ist = istCalendarDate(new Date('2026-09-12T22:30:00.000Z'));
    expect(ist).toEqual({ year: 2026, month: 9, day: 13 });
  });

  it('matches occasion month/day', () => {
    expect(matchesMonthDay({ month: 9, day: 13 }, { month: 9, day: 13 })).toBe(
      true,
    );
    expect(matchesMonthDay({ month: 9, day: 14 }, { month: 9, day: 13 })).toBe(
      false,
    );
    expect(matchesMonthDay(undefined, { month: 9, day: 13 })).toBe(false);
  });

  it('builds userId_relationshipId_occasionType_year keys', () => {
    expect(buildIdempotencyKey('u1', 'r1', 'birthday', 2026)).toBe(
      'u1_r1_birthday_2026',
    );
  });
});

describe('autosend content fallback', () => {
  it('prefers pack with photos+template, then last creation, then default', () => {
    const pack = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 't1',
        photoRefs: ['p1'],
        defaultMessage: 'Happy birthday',
        fromName: 'Nick',
      },
      lastCreation: null,
    });
    expect(pack.source).toBe('pack');

    const last = resolveAutoSendContent({
      occasionType: 'anniversary',
      pack: null,
      lastCreation: {
        templateType: 'anniversary',
        templateId: 't2',
        photoRefs: ['p2'],
        message: 'One more year',
        fromName: 'Nick',
      },
    });
    expect(last.source).toBe('last_creation');

    const fallback = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: null,
      lastCreation: null,
    });
    expect(fallback.source).toBe('default');
    expect(fallback.photoRefs).toEqual([]);
    expect(fallback.message).toBe('Thinking of you today.');
    expect(fallback.templateType).toBe('birthday');
  });

  it('falls through when pack has no photos', () => {
    const result = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 't1',
        photoRefs: [],
        defaultMessage: 'Happy birthday',
        fromName: 'Nick',
      },
      lastCreation: {
        templateType: 'birthday',
        templateId: 't2',
        photoRefs: ['p2'],
        message: 'From last card',
        fromName: 'Nick',
      },
    });
    expect(result.source).toBe('last_creation');
  });
});
