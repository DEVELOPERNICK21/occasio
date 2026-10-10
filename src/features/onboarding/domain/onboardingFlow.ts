import type { Audience, Occasion } from '../../create/domain/templateSchema';
import { daysUntilPersonDate } from '../../vault/domain/personRules';
import type { PersonDate } from '../../vault/domain/types';

/**
 * First-run funnel. It follows the order people actually decide in:
 *
 *   who      the one person they would hate to let down (a real choice, not a form)
 *   when     their date, so everything after it is about a real day
 *   dream    open the gift: feel what the other person feels
 *   fear     picture the day it is forgotten: the cost of doing nothing
 *   ready    the relief: how Occasio makes sure it does not happen
 *   offer    the plan, now that they know why they would want it
 *
 * Emotion is allowed to carry the flow; invention is not. Every number on
 * screen comes from the person's own date or from what the app really enforces,
 * and there is never a timer, a made-up count or a "limited time". The tone
 * guard in __tests__/onboarding keeps it that way. Every step can be skipped
 * and has Back.
 */
export type OnboardingStepId = 'who' | 'when' | 'dream' | 'fear' | 'ready' | 'offer';

export const ONBOARDING_STEPS: readonly OnboardingStepId[] = [
  'who',
  'when',
  'dream',
  'fear',
  'ready',
  'offer',
] as const;

/** Only the two occasions with a yearly date. Everything else is chosen later, in Create. */
export type DateOccasion = Extract<Occasion, 'birthday' | 'anniversary'>;

export const DATE_OCCASIONS: readonly { id: DateOccasion; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
] as const;

export type OnboardingAnswers = {
  audience: Audience | null;
  occasion: Occasion | null;
  /** The text of the date field, `dd/mm/yyyy` or empty. The year is ignored: only the day repeats. */
  dateText: string;
};

export const EMPTY_ONBOARDING_ANSWERS: OnboardingAnswers = {
  audience: null,
  occasion: null,
  dateText: '',
};

/** What the person picked, handed to the Create flow when onboarding ends. */
export type OnboardingIntent = { audience: Audience; occasion: Occasion };

export function stepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function progressLabel(index: number): string {
  return `Step ${index + 1} of ${ONBOARDING_STEPS.length}`;
}

/** Saves a tap: a partner's moment is usually an anniversary, anyone else's a birthday. */
export function defaultOccasionFor(audience: Audience): Occasion {
  return audience === 'partner' ? 'anniversary' : 'birthday';
}

const PHRASE: Record<Audience, string> = {
  mom: 'Mom',
  dad: 'Dad',
  partner: 'your partner',
  friend: 'your best friend',
  family: 'your family',
  someone_special: 'someone special',
};

const POSSESSIVE: Record<Audience, string> = {
  mom: "Mom's",
  dad: "Dad's",
  partner: "your partner's",
  friend: "your best friend's",
  family: "your family's",
  someone_special: 'their',
};

export function audiencePhrase(audience: Audience | null): string {
  return audience ? PHRASE[audience] : 'someone special';
}

const TICKET_NAME: Record<Audience, string> = {
  mom: 'Mom',
  dad: 'Dad',
  partner: 'Partner',
  friend: 'Best friend',
  family: 'Family',
  someone_special: 'Someone special',
};

export const TICKET_EYEBROW = 'A surprise for';

/** The short name on the gift ticket, the same ticket the recipient meets on the web. */
export function ticketName(audience: Audience | null): string {
  return audience ? TICKET_NAME[audience] : 'Someone special';
}

export function recipientLine(audience: Audience | null): string {
  return `For ${audiencePhrase(audience)}`;
}

function occasionWord(occasion: Occasion | null): 'birthday' | 'anniversary' {
  return occasion === 'anniversary' ? 'anniversary' : 'birthday';
}

/** "Mom's birthday", "your anniversary", "their birthday": the day, in the way the person would say it. */
export function dayLabel(audience: Audience | null, occasion: Occasion | null): string {
  const word = occasionWord(occasion);
  if (audience === 'partner' && word === 'anniversary') {
    return 'your anniversary';
  }
  const owner = audience ? POSSESSIVE[audience] : 'their';
  return `${owner} ${word}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** `dd/mm/yyyy` → the day that repeats each year. `null` for anything that is not a real calendar day. */
export function parseOnboardingDate(text: string): PersonDate | null {
  const parts = text.split('/').map((part) => Number.parseInt(part, 10));
  const [day, month] = parts;
  if (!Number.isInteger(day) || !Number.isInteger(month) || !day || !month) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  // 2000 is a leap year, so 29 February is accepted; 31 April and the like are not.
  const check = new Date(2000, month - 1, day);
  return check.getMonth() === month - 1 && check.getDate() === day ? { month, day } : null;
}

/** Whole days until the next time this date comes round; `null` when there is no date. */
export function daysUntilDate(answers: OnboardingAnswers, now = new Date()): number | null {
  const date = parseOnboardingDate(answers.dateText);
  return date ? daysUntilPersonDate(date, now) : null;
}

/** "Mom's birthday is in 23 days." Computed from their date, never invented. */
export function countdownLine(
  audience: Audience | null,
  occasion: Occasion | null,
  days: number,
): string {
  const label = capitalise(dayLabel(audience, occasion));
  if (days === 0) {
    return `${label} is today.`;
  }
  if (days === 1) {
    return `${label} is tomorrow.`;
  }
  return `${label} is in ${days} days.`;
}

/**
 * The honest push: a real date that is close, and how little the card takes.
 * Nothing when the day is far off or unknown, because there is nothing true to say.
 */
export function readyUrgency(days: number | null): string | null {
  if (days === null || days > 30) {
    return null;
  }
  return days <= 7
    ? 'That is close. A card takes about two minutes.'
    : 'A card takes about two minutes. Start now and it is done.';
}

export function canContinue(step: OnboardingStepId, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 'who':
      return answers.audience !== null;
    case 'when':
      return parseOnboardingDate(answers.dateText) !== null;
    default:
      return true;
  }
}

/** Both answers → the person's first card starts pre-filled. Otherwise nothing is carried over. */
export function intentFrom(answers: OnboardingAnswers): OnboardingIntent | null {
  return answers.audience && answers.occasion
    ? { audience: answers.audience, occasion: answers.occasion }
    : null;
}

export type StepCopy = { title: string; body: string };

export function stepCopy(
  step: OnboardingStepId,
  answers: Pick<OnboardingAnswers, 'audience' | 'occasion'>,
): StepCopy {
  const { audience, occasion } = answers;
  const day = dayLabel(audience, occasion);
  switch (step) {
    case 'who':
      return {
        title: 'Who do you never want to forget?',
        body: 'Pick one to start. You can add more people later.',
      };
    case 'when':
      return {
        title: `When is ${day}?`,
        body: "I'll count the days for you.",
      };
    case 'dream':
      return {
        title: `Picture ${audiencePhrase(audience)} opening this.`,
        body: 'Tap the gift.',
      };
    case 'fear':
      return {
        title: 'Now picture the day you forget.',
        body: `A late \u201Chappy ${occasionWord(occasion)}\u201D never lands the same. ${capitalise(day)} comes once a year, and it does not wait.`,
      };
    case 'ready':
      return {
        title: `Be ready before ${day}.`,
        body: 'Save the date once. Occasio prepares the card on the day, and you approve it before anything is sent.',
      };
    case 'offer':
      return {
        title: 'Never be the one who forgot.',
        body: 'Start free and upgrade when it helps. Your first card is free whichever you choose.',
      };
  }
}

/** What Pip says in the little bubble on the calmer steps. One short line, no pressure. */
export function pipSays(step: OnboardingStepId): string | null {
  switch (step) {
    case 'who':
      return "Hi, I'm Pip. I help people remember.";
    case 'when':
      return 'Tell me the day and I will keep count.';
    case 'ready':
      return 'Leave the remembering to me.';
    case 'offer':
      return 'Let us remember them together.';
    default:
      return null;
  }
}

export const DREAM_OPENED_LINE =
  'That look when someone feels remembered. You can give it every year.';

export const GIFT_OPENED_CAPTION =
  'They open it from a link in their browser. No app or account needed.';

export const SKIP_DATE_LABEL = "I'll add the date later";

export const REMEMBER_TRUST_LINE = 'You get 2 hours to approve, edit or cancel before it goes.';

export type TimelineStep = { id: string; title: string; detail: string };

/**
 * The real sequence, in plain words. It ends with the person sending the link:
 * that is what approving does today, so it is what we say.
 */
export const AUTO_SEND_TIMELINE: readonly TimelineStep[] = [
  { id: 'save', title: 'You save the date once', detail: 'Birthday or anniversary, kept in your Vault.' },
  { id: 'prepare', title: 'On the day, the card is prepared', detail: 'From the photo and message you chose.' },
  { id: 'review', title: 'You review it for 2 hours', detail: 'Approve, edit or cancel.' },
  { id: 'send', title: 'Then you send it in one tap', detail: 'Nothing goes out without your say.' },
] as const;

export function autoSendToggleLabel(audience: Audience | null): string {
  return `Auto-send for ${audiencePhrase(audience)}`;
}

export type CompareRow = { id: string; label: string; free: string; pro: string };

/** Only what the app really enforces today (see `quota.ts`, `tierLimits.ts`). */
export const COMPARE_ROWS: readonly CompareRow[] = [
  { id: 'cards', label: 'Cards each month', free: '1', pro: 'Unlimited' },
  { id: 'people', label: 'People saved in Vault', free: '1', pro: 'Up to 5' },
  { id: 'auto', label: 'Auto-send, with your approval', free: 'Not included', pro: 'Included' },
] as const;

/** One honest reassurance under each step's button. */
export function trustLine(step: OnboardingStepId): string {
  switch (step) {
    case 'who':
      return 'No account needed to start.';
    case 'when':
      return 'Only used to count the days. It stays on this phone.';
    case 'dream':
      return 'Only people with your link can open it.';
    case 'fear':
      return 'There is an easy way to make sure it does not happen.';
    case 'ready':
      return 'Saving dates is free. Auto-send is part of Occasio Pro.';
    case 'offer':
      return PLAN_TRUST_LINE;
  }
}

export const PLAN_PAID_TITLE = 'Occasio Pro is on';
export const PLAN_PAID_BODY =
  'Unlimited cards and up to 5 saved people are included. Your first card is next.';
export const PLANS_UNAVAILABLE = 'Plans appear here when you are online. You can keep using Occasio free.';
export const PLANS_LOADING = 'Loading plans…';
export const RESTORE_LABEL = 'Restore purchases';

export const PLAN_TRUST_LINE = 'Your first card is free either way. Cancel a plan any time.';

export function renewalNotice(platform: 'ios' | 'android' | 'other'): string {
  const where =
    platform === 'ios'
      ? 'your App Store account settings'
      : platform === 'android'
        ? 'Google Play subscriptions'
        : 'your store account settings';
  return `Subscriptions renew automatically until you cancel. Cancel any time in ${where}.`;
}

export function continueLabel(step: OnboardingStepId, isPaid: boolean): string {
  switch (step) {
    case 'fear':
      return "I won't forget";
    case 'ready':
      return 'See the plans';
    case 'offer':
      return isPaid ? 'Create your first card' : 'Start with my free card';
    default:
      return 'Continue';
  }
}

/** Every user-facing string in the flow, for the tone guard test. */
export function allCopyFor(audience: Audience, occasion: Occasion = 'birthday'): string[] {
  const answers = { audience, occasion };
  const steps = ONBOARDING_STEPS.flatMap((step) => {
    const copy = stepCopy(step, answers);
    return [copy.title, copy.body];
  });
  return [
    ...steps,
    ...ONBOARDING_STEPS.flatMap((step) => {
      const says = pipSays(step);
      return says ? [says] : [];
    }),
    TICKET_EYEBROW,
    ticketName(audience),
    DREAM_OPENED_LINE,
    GIFT_OPENED_CAPTION,
    SKIP_DATE_LABEL,
    REMEMBER_TRUST_LINE,
    PLAN_TRUST_LINE,
    PLAN_PAID_TITLE,
    PLAN_PAID_BODY,
    PLANS_UNAVAILABLE,
    PLANS_LOADING,
    RESTORE_LABEL,
    ...ONBOARDING_STEPS.map(trustLine),
    ...ONBOARDING_STEPS.flatMap((step) => [continueLabel(step, false), continueLabel(step, true)]),
    autoSendToggleLabel(audience),
    recipientLine(audience),
    countdownLine(audience, occasion, 0),
    countdownLine(audience, occasion, 1),
    countdownLine(audience, occasion, 23),
    readyUrgency(3) ?? '',
    readyUrgency(20) ?? '',
    renewalNotice('ios'),
    renewalNotice('android'),
    ...AUTO_SEND_TIMELINE.flatMap((t) => [t.title, t.detail]),
    ...COMPARE_ROWS.flatMap((r) => [r.label, r.free, r.pro]),
  ];
}
