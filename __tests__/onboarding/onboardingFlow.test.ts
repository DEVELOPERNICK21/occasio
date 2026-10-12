import { FREE_CARD_LIMIT, PRO_YEARLY_CARD_LIMIT } from '../../src/features/create/domain/quota';
import type { Audience, Occasion } from '../../src/features/create/domain/templateSchema';
import {
  allCopyFor,
  AUTO_SEND_TIMELINE,
  canContinue,
  COMPARE_ROWS,
  continueLabel,
  countdownLine,
  dayLabel,
  daysUntilDate,
  defaultOccasionFor,
  EMPTY_ONBOARDING_ANSWERS,
  intentFrom,
  ONBOARDING_STEPS,
  parseOnboardingDate,
  progressLabel,
  readyUrgency,
  recipientLine,
  renewalNotice,
  stepCopy,
  ticketName,
  trustLine,
} from '../../src/features/onboarding/domain/onboardingFlow';
import { canEnableAutoSend, personCapForTier } from '../../src/features/vault/domain/tierLimits';

const AUDIENCES: Audience[] = ['mom', 'dad', 'partner', 'friend', 'family', 'someone_special'];
const OCCASIONS: Occasion[] = ['birthday', 'anniversary'];

/** A fixed "today" so every countdown below is deterministic. */
const NOW = new Date(2026, 5, 10, 15, 30);

describe('onboarding funnel — flow rules', () => {
  it('goes who → when → dream → fear → ready → offer: dream first, the ask last', () => {
    expect(ONBOARDING_STEPS).toEqual(['who', 'when', 'dream', 'fear', 'ready', 'offer']);
    expect(ONBOARDING_STEPS.indexOf('dream')).toBeLessThan(ONBOARDING_STEPS.indexOf('fear'));
    expect(ONBOARDING_STEPS.indexOf('fear')).toBeLessThan(ONBOARDING_STEPS.indexOf('ready'));
    expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1]).toBe('offer');
  });

  it('only blocks Continue where an answer is needed: who, and a real date on when', () => {
    expect(canContinue('who', EMPTY_ONBOARDING_ANSWERS)).toBe(false);
    expect(canContinue('who', { ...EMPTY_ONBOARDING_ANSWERS, audience: 'mom' })).toBe(true);
    expect(canContinue('when', EMPTY_ONBOARDING_ANSWERS)).toBe(false);
    expect(canContinue('when', { ...EMPTY_ONBOARDING_ANSWERS, dateText: '31/04/1990' })).toBe(false);
    expect(canContinue('when', { ...EMPTY_ONBOARDING_ANSWERS, dateText: '14/08/1962' })).toBe(true);
    for (const step of ['dream', 'fear', 'ready', 'offer'] as const) {
      expect(canContinue(step, EMPTY_ONBOARDING_ANSWERS)).toBe(true);
    }
  });

  it('suggests an anniversary for a partner and a birthday for everyone else', () => {
    expect(defaultOccasionFor('partner')).toBe('anniversary');
    for (const a of AUDIENCES.filter((x) => x !== 'partner')) {
      expect(defaultOccasionFor(a)).toBe('birthday');
    }
  });

  it('only hands a first card to the Create flow when both answers exist', () => {
    expect(intentFrom({ ...EMPTY_ONBOARDING_ANSWERS, audience: 'mom' })).toBeNull();
    expect(intentFrom({ ...EMPTY_ONBOARDING_ANSWERS, occasion: 'birthday' })).toBeNull();
    expect(
      intentFrom({ audience: 'dad', occasion: 'anniversary', dateText: '01/02/1990' }),
    ).toEqual({ audience: 'dad', occasion: 'anniversary' });
  });

  it('personalises copy with the relationship, never a name', () => {
    expect(stepCopy('when', { audience: 'mom', occasion: 'birthday' }).title).toBe("When is Mom's birthday?");
    expect(stepCopy('when', { audience: 'partner', occasion: 'anniversary' }).title).toBe(
      'When is your anniversary?',
    );
    expect(stepCopy('when', { audience: null, occasion: null }).title).toBe('When is their birthday?');
    expect(stepCopy('dream', { audience: 'friend', occasion: 'birthday' }).title).toBe(
      'Picture your best friend opening this.',
    );
    expect(stepCopy('ready', { audience: 'dad', occasion: 'birthday' }).title).toBe(
      "Be ready before Dad's birthday.",
    );
    expect(recipientLine('friend')).toBe('For your best friend');
    expect(ticketName('someone_special')).toBe('Someone special');
  });

  it('labels each step by what the button does', () => {
    expect(continueLabel('who', false)).toBe('Continue');
    expect(continueLabel('fear', false)).toBe("I won't forget");
    expect(continueLabel('ready', false)).toBe('See the plans');
    expect(continueLabel('offer', false)).toBe('Start with my free card');
    expect(continueLabel('offer', true)).toBe('Create your first card');
    expect(progressLabel(1)).toBe('Step 2 of 6');
  });

  it('names the right store in the renewal notice', () => {
    expect(renewalNotice('android')).toContain('Google Play');
    expect(renewalNotice('ios')).toContain('App Store');
    expect(renewalNotice('ios')).toContain('Cancel any time');
  });
});

describe('onboarding funnel — their date, their countdown', () => {
  it('accepts real calendar days and nothing else', () => {
    expect(parseOnboardingDate('14/08/1962')).toEqual({ month: 8, day: 14 });
    // 29 February is a real birthday, so it is accepted whatever the year.
    expect(parseOnboardingDate('29/02/2001')).toEqual({ month: 2, day: 29 });
    for (const bad of ['', '00/08/1990', '32/01/1990', '15/13/1990', '31/04/1990', 'ab/cd/efgh']) {
      expect(parseOnboardingDate(bad)).toBeNull();
    }
  });

  it('counts whole days to the next time the date comes round, ignoring the year', () => {
    const at = (dateText: string) => daysUntilDate({ ...EMPTY_ONBOARDING_ANSWERS, dateText }, NOW);
    expect(at('10/06/1960')).toBe(0);
    expect(at('11/06/1960')).toBe(1);
    expect(at('03/07/2001')).toBe(23);
    // Already passed this year: it is next year's that counts.
    expect(at('09/06/1960')).toBe(364);
    expect(at('')).toBeNull();
    expect(at('not a date')).toBeNull();
  });

  it('says the day in words, with no number made up', () => {
    expect(countdownLine('mom', 'birthday', 23)).toBe("Mom's birthday is in 23 days.");
    expect(countdownLine('mom', 'birthday', 1)).toBe("Mom's birthday is tomorrow.");
    expect(countdownLine('mom', 'birthday', 0)).toBe("Mom's birthday is today.");
    expect(countdownLine('partner', 'anniversary', 5)).toBe('Your anniversary is in 5 days.');
    expect(dayLabel('someone_special', 'birthday')).toBe('their birthday');
  });

  it('nudges only when the day is really close, and never invents a deadline', () => {
    expect(readyUrgency(null)).toBeNull();
    expect(readyUrgency(31)).toBeNull();
    expect(readyUrgency(200)).toBeNull();
    expect(readyUrgency(30)).toMatch(/about two minutes/);
    expect(readyUrgency(7)).toMatch(/That is close/);
    expect(readyUrgency(0)).toMatch(/That is close/);
  });
});

describe('onboarding funnel — claims match what the app enforces', () => {
  const row = (id: string) => COMPARE_ROWS.find((r) => r.id === id)!;

  it('card allowances are the real quotas', () => {
    expect(row('cards').free).toMatch(new RegExp(`^${FREE_CARD_LIMIT} `));
    expect(row('cards').pro).toBe(`${PRO_YEARLY_CARD_LIMIT} a year`);
  });

  it('people saved matches the tier caps', () => {
    expect(row('people').free).toBe(String(personCapForTier('free')));
    expect(row('people').pro).toBe(`Up to ${personCapForTier('personal')}`);
  });

  it('auto-send is a paid feature, exactly as gated in the Vault', () => {
    expect(canEnableAutoSend('free')).toBe(false);
    expect(canEnableAutoSend('personal')).toBe(true);
    expect(row('auto').free).toMatch(/not included/i);
    expect(row('auto').pro).toMatch(/included/i);
  });

  it('does not repeat claims the product cannot keep', () => {
    const all = COMPARE_ROWS.flatMap((r) => [r.label, r.free, r.pro]).join(' ').toLowerCase();
    expect(all).not.toMatch(/365|year-long|watermark|trial|forever/);
  });

  it('describes the 2-hour review window before the person sends', () => {
    const ids = AUTO_SEND_TIMELINE.map((t) => t.id);
    expect(ids.indexOf('review')).toBeGreaterThan(ids.indexOf('prepare'));
    expect(ids.indexOf('send')).toBeGreaterThan(ids.indexOf('review'));
    expect(AUTO_SEND_TIMELINE.find((t) => t.id === 'review')!.title).toMatch(/2 hours/);
    // The timeline ends with the person sending, because that is what approving does today.
    expect(AUTO_SEND_TIMELINE.find((t) => t.id === 'send')!.detail).toMatch(/nothing goes out without your say/i);
  });

  it('says the entered date stays on the phone, and it is not sent anywhere with the intent', () => {
    expect(trustLine('when')).toMatch(/stays on this phone/i);
    // The handoff carries the audience and occasion only.
    const intent = intentFrom({ audience: 'mom', occasion: 'birthday', dateText: '14/08/1962' });
    expect(Object.keys(intent ?? {}).sort()).toEqual(['audience', 'occasion']);
  });
});

describe('onboarding funnel — tone guard (emotional, never manipulative)', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  // No fake scarcity, no timers, no social proof, no guilt-tripping the person out of saying no.
  const PRESSURE =
    /limited time|last chance|hurry|only \d+ left|expires|ends (today|tonight|soon)|don'?t miss out|act now|you'?ll regret|no thanks, i|unlock|supercharge|exclusive|offer ends|\bdiscount\b|\bdeal\b/i;
  const INVENTED =
    /\b\d[\d,]*\+? (people|users|families|moms|dads|cards)\b|join \d|\brated\b|#1|millions?|thousands?/i;
  const SHAMING = /\bbad (son|daughter|partner|friend)\b|you forgot again|selfish|heartless|disappoint(ed|ing) them/i;
  /** The only digits allowed: their own countdown, the 2-hour window and the real tier caps. */
  const DIGITS_OK = new RegExp(
    `^\\d+$|in 23 days\\.$|2 hours|[Uu]p to 5|^1 to try$|^${PRO_YEARLY_CARD_LIMIT} a year$|${PRO_YEARLY_CARD_LIMIT} cards a year`,
  );
  /** The real Pro allowance is a fact about the product, not an invented figure. */
  const withoutRealCap = (text: string) =>
    text.replace(`${PRO_YEARLY_CARD_LIMIT} cards a year`, 'cards a year');

  const texts = [
    ...new Set(
      AUDIENCES.flatMap((audience) => OCCASIONS.flatMap((occasion) => allCopyFor(audience, occasion))),
    ),
  ];

  it('covers a meaningful amount of copy', () => {
    expect(texts.length).toBeGreaterThan(60);
  });

  it('has no hype, emoji, exclamation, pressure, invented numbers or shaming in any line', () => {
    const violations = texts.filter(
      (text) =>
        text.trim().length === 0 ||
        text.includes('!') ||
        EMOJI.test(text) ||
        PRESSURE.test(text) ||
        INVENTED.test(withoutRealCap(text)) ||
        SHAMING.test(text),
    );
    expect(violations).toEqual([]);
  });

  it('the only numbers anywhere are their own days, the 2-hour window and the real caps', () => {
    expect(texts.filter((text) => /\d/.test(text) && !DIGITS_OK.test(text))).toEqual([]);
  });

  it('the fear step names the cost without a number', () => {
    for (const audience of AUDIENCES) {
      const fear = stepCopy('fear', { audience, occasion: 'birthday' });
      expect(`${fear.title} ${fear.body}`).not.toMatch(/\d/);
    }
  });

  it('gives every step a reassuring line and a button label', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(trustLine(step).length).toBeGreaterThan(10);
      expect(continueLabel(step, false).length).toBeGreaterThan(0);
    }
  });
});
