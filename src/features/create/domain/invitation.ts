/**
 * An invitation is a card with a different job: one link for many guests, with the plan of the
 * day on it and a reply that goes to the host on WhatsApp. This is what the host fills in, how it
 * is checked, and the object the server stores.
 *
 * The server checks the same rules again (docs-site `lib/invitation.ts`), and the API contract
 * (`api-contracts.md`) is the one source for the field names and limits.
 */

export const INVITATION_TEMPLATE = 'invitation';

export const MAX_INVITATION_EVENTS = 6;

export const INVITATION_LIMITS = {
  name: 36,
  tagline: 40,
  eventTitle: 40,
  venue: 80,
  address: 160,
  hostLine: 120,
  dressCode: 60,
} as const;

export const INVITATION_OCCASIONS = [
  'wedding',
  'engagement',
  'anniversary',
  'birthday',
  'baby_shower',
  'housewarming',
  'graduation',
  'party',
] as const;

export type InvitationOccasion = (typeof INVITATION_OCCASIONS)[number];

/**
 * How a ceremony looks. A wedding, engagement or anniversary can be dressed in any of three designs;
 * every other occasion has the one look it was made with and never asks.
 */
export const INVITATION_DESIGNS = ['regal', 'sage', 'palace'] as const;

export type InvitationDesign = (typeof INVITATION_DESIGNS)[number];

export const DEFAULT_DESIGN: InvitationDesign = 'regal';

export const DESIGN_INFO: Record<InvitationDesign, { label: string; blurb: string; entrance: string }> = {
  regal: {
    label: 'Baraat road',
    blurb: 'A dressed wedding car and marigolds.',
    entrance: 'Honk the horn on the car. Honk at each stop to hang a garland over it.',
  },
  sage: {
    label: 'Garden doors',
    blurb: 'Green doors, satin curtains and a garden.',
    entrance: 'Open the doors, scratch a foil heart for the date, turn a card for each event.',
  },
  palace: {
    label: 'Pink City palace',
    blurb: 'A lotus gate, a plum satin arch and marble steps.',
    entrance: 'Pull the door rings. Open a window for each event.',
  },
};

export function isInvitationDesign(value: unknown): value is InvitationDesign {
  return typeof value === 'string' && (INVITATION_DESIGNS as readonly string[]).includes(value);
}

export type InvitationOccasionInfo = {
  id: InvitationOccasion;
  label: string;
  /** One calm line on the picker. */
  blurb: string;
  /** Two names (a couple) rather than one. */
  couple: boolean;
  nameLabel: string;
  nameTwoLabel: string;
  namePlaceholder: string;
  nameTwoPlaceholder: string;
  taglineHint: string;
  taglinePlaceholder: string;
  /** Names the host can add with one tap. */
  eventSuggestions: readonly string[];
  /** Whether the Ganesh blessing is a natural thing to offer. */
  offersBlessing: boolean;
};

export const OCCASION_INFO: Record<InvitationOccasion, InvitationOccasionInfo> = {
  wedding: {
    id: 'wedding',
    label: 'Wedding',
    blurb: 'Pick a design. Every ceremony in one link.',
    couple: true,
    nameLabel: 'First name',
    nameTwoLabel: 'Second name',
    namePlaceholder: 'Aarav',
    nameTwoPlaceholder: 'Priya',
    taglineHint: 'Optional, shown under the names',
    taglinePlaceholder: 'Together forever',
    eventSuggestions: ['Mehendi', 'Sangeet', 'Haldi', 'Wedding', 'Reception'],
    offersBlessing: true,
  },
  engagement: {
    id: 'engagement',
    label: 'Engagement',
    blurb: 'The ring ceremony and dinner, in a design you choose.',
    couple: true,
    nameLabel: 'First name',
    nameTwoLabel: 'Second name',
    namePlaceholder: 'Kabir',
    nameTwoPlaceholder: 'Ananya',
    taglineHint: 'Optional, shown under the names',
    taglinePlaceholder: 'We said yes',
    eventSuggestions: ['Ring ceremony', 'Dinner'],
    offersBlessing: true,
  },
  anniversary: {
    id: 'anniversary',
    label: 'Anniversary',
    blurb: 'Celebrate the years with the people who shared them.',
    couple: true,
    nameLabel: 'First name',
    nameTwoLabel: 'Second name',
    namePlaceholder: 'Ravi',
    nameTwoPlaceholder: 'Sunita',
    taglineHint: 'Optional, shown under the names',
    taglinePlaceholder: '25 years together',
    eventSuggestions: ['Dinner', 'Dinner and dancing'],
    offersBlessing: false,
  },
  birthday: {
    id: 'birthday',
    label: 'Birthday',
    blurb: 'Balloons to pop, a countdown and an easy reply.',
    couple: false,
    nameLabel: 'Whose birthday',
    nameTwoLabel: '',
    namePlaceholder: 'Meera',
    nameTwoPlaceholder: '',
    taglineHint: 'Optional, shown under the name',
    taglinePlaceholder: 'turning 30',
    eventSuggestions: ['Games', 'Cake', 'Dinner'],
    offersBlessing: false,
  },
  baby_shower: {
    id: 'baby_shower',
    label: 'Baby shower',
    blurb: 'Soft and simple, with the games and lunch listed.',
    couple: false,
    nameLabel: 'Who is it for',
    nameTwoLabel: '',
    namePlaceholder: 'Neha',
    nameTwoPlaceholder: '',
    taglineHint: 'Optional, shown under the name',
    taglinePlaceholder: 'and the little one on the way',
    eventSuggestions: ['Games', 'Lunch'],
    offersBlessing: true,
  },
  housewarming: {
    id: 'housewarming',
    label: 'Housewarming',
    blurb: 'Open the door to your new home.',
    couple: false,
    nameLabel: 'Family or host name',
    nameTwoLabel: '',
    namePlaceholder: 'The Shah family',
    nameTwoPlaceholder: '',
    taglineHint: 'Optional, shown under the name',
    taglinePlaceholder: 'welcome to our new home',
    eventSuggestions: ['Puja', 'Lunch'],
    offersBlessing: true,
  },
  graduation: {
    id: 'graduation',
    label: 'Graduation',
    blurb: 'Share the day and the dinner after.',
    couple: false,
    nameLabel: 'Graduate',
    nameTwoLabel: '',
    namePlaceholder: 'Rohan',
    nameTwoPlaceholder: '',
    taglineHint: 'Optional, shown under the name',
    taglinePlaceholder: 'is graduating',
    eventSuggestions: ['Ceremony', 'Dinner'],
    offersBlessing: false,
  },
  party: {
    id: 'party',
    label: 'Party',
    blurb: 'For any gathering that deserves an invitation.',
    couple: false,
    nameLabel: 'Host or group',
    nameTwoLabel: '',
    namePlaceholder: 'The team',
    nameTwoPlaceholder: '',
    taglineHint: 'Optional, shown under the name',
    taglinePlaceholder: 'an end-of-year get-together',
    eventSuggestions: ['Drinks', 'Dinner'],
    offersBlessing: false,
  },
};

/** The steps of making an invitation, in order. The photos and the review are shared with cards. */
export const INVITE_STAGES = [
  { id: 'day', label: 'The day' },
  { id: 'plan', label: 'The plan' },
  { id: 'reply', label: 'Replies' },
  { id: 'photos', label: 'Photos' },
  { id: 'review', label: 'Review' },
] as const;

export type InviteStage = (typeof INVITE_STAGES)[number]['id'];

/** Where the person is in the steps: the label, "2 of 5" and how full the bar is. */
export function inviteProgress(stage: InviteStage): { label: string; current: number; total: number; fraction: number } {
  const index = INVITE_STAGES.findIndex((item) => item.id === stage);
  const total = INVITE_STAGES.length;
  return { label: INVITE_STAGES[index]!.label, current: index + 1, total, fraction: (index + 1) / total };
}

export type InvitationEventDraft = {
  title: string;
  /** `YYYY-MM-DD`, or empty to use the main day. */
  date: string;
  /** `HH:MM` (24 hours), or empty when the time is not fixed. */
  time: string;
  venue: string;
};

export type InvitationBlessing = 'ganesh' | 'none';

/** What the host is filling in. Dates are `YYYY-MM-DD`; the phone is kept in two parts so the country code is a choice. */
export type InvitationDraft = {
  occasion: InvitationOccasion;
  /** Only a ceremony uses it; every other occasion keeps the default. */
  design: InvitationDesign;
  nameOne: string;
  nameTwo: string;
  tagline: string;
  date: string;
  venueName: string;
  venueAddress: string;
  events: InvitationEventDraft[];
  hostLine: string;
  /** Digits of the country code, without `+`. */
  rsvpCountry: string;
  /** The number without the country code. Empty means guests are not offered a reply button. */
  rsvpPhone: string;
  rsvpBy: string;
  blessing: InvitationBlessing;
  dressCode: string;
};

/** The object the server stores and the invitation page reads. */
export type InvitationPayload = {
  occasion: InvitationOccasion;
  design: InvitationDesign;
  nameOne: string;
  nameTwo: string;
  tagline: string;
  date: string;
  venueName: string;
  venueAddress: string;
  events: { title: string; date: string; time: string; venue: string }[];
  hostLine: string;
  rsvpWhatsapp: string;
  rsvpBy: string;
  blessing: InvitationBlessing;
  dressCode: string;
};

export const DEFAULT_COUNTRY_CODE = '91';

/** Whether the host is asked to choose a design: only for the occasions that are a couple. */
export function offersDesigns(occasion: InvitationOccasion): boolean {
  return OCCASION_INFO[occasion].couple;
}

/**
 * A live sample of the invitation in this occasion and design, for the host to look at before choosing.
 * The page builds it itself from the link, with dates always a little ahead of today.
 */
export function invitationDemoUrl(baseUrl: string, occasion: InvitationOccasion, design: InvitationDesign): string {
  const named = offersDesigns(occasion) ? `-${design}` : '';
  return `${baseUrl.replace(/\/+$/, '')}/c/demo-invite-${occasion}${named}-example`;
}

/** The line the page shows above the names when the host writes none: what the server falls back to. */
export function defaultHostLine(occasion: InvitationOccasion): string {
  return occasion === 'wedding' || occasion === 'engagement' ? 'Together with their families' : 'You are invited';
}

export function isInvitationOccasion(value: unknown): value is InvitationOccasion {
  return typeof value === 'string' && (INVITATION_OCCASIONS as readonly string[]).includes(value);
}

export function emptyInvitation(occasion: InvitationOccasion): InvitationDraft {
  return {
    occasion,
    design: DEFAULT_DESIGN,
    nameOne: '',
    nameTwo: '',
    tagline: '',
    date: '',
    venueName: '',
    venueAddress: '',
    events: [],
    hostLine: '',
    rsvpCountry: DEFAULT_COUNTRY_CODE,
    rsvpPhone: '',
    rsvpBy: '',
    blessing: 'none',
    dressCode: '',
  };
}

function collapse(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** "Aarav & Priya", or the one name. Also what the card is addressed to. */
export function invitationTitle(draft: Pick<InvitationDraft, 'occasion' | 'nameOne' | 'nameTwo'>): string {
  const one = collapse(draft.nameOne, INVITATION_LIMITS.name);
  const two = collapse(draft.nameTwo, INVITATION_LIMITS.name);
  return OCCASION_INFO[draft.occasion].couple && two ? `${one} & ${two}` : one;
}

// ---- Dates and times ----

const pad = (n: number) => String(n).padStart(2, '0');

/** `dd/mm/yyyy` from `YYYY-MM-DD`, or an empty string. */
export function isoToFieldDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** `YYYY-MM-DD` from `dd/mm/yyyy`, or an empty string when it is not a real day. */
export function fieldDateToIso(text: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const real = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
  return real ? `${year}-${pad(month)}-${pad(day)}` : '';
}

/** `YYYY-MM-DD` for a local Date. */
export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "23 Feb 2027" from `YYYY-MM-DD`, or an empty string. */
export function shortDay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? ''} ${match[1]}`;
}

/** "6:30 PM" from `18:30`, or an empty string. */
export function clockLabel(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return '';
  const hours = Number(match[1]);
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`;
}

// ---- Phone ----

/** The digits a WhatsApp link needs: country code then number, without a leading zero on the number. */
export function whatsappDigits(country: string, phone: string): string {
  const national = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (!national) return '';
  return `${country.replace(/\D/g, '')}${national}`;
}

function phoneIsPlausible(country: string, phone: string): boolean {
  const digits = whatsappDigits(country, phone);
  return digits.length >= 8 && digits.length <= 15;
}

// ---- Checking each step ----

/** Why the names, day and place are not ready, or null. */
export function detailsProblem(draft: InvitationDraft): string | null {
  const info = OCCASION_INFO[draft.occasion];
  if (!collapse(draft.nameOne, INVITATION_LIMITS.name)) {
    return info.couple ? 'Add both names' : 'Add the name';
  }
  if (info.couple && !collapse(draft.nameTwo, INVITATION_LIMITS.name)) return 'Add both names';
  if (!fieldDateToIso(isoToFieldDate(draft.date))) return 'Pick the day';
  if (!collapse(draft.venueName, INVITATION_LIMITS.venue)) return 'Add the venue';
  return null;
}

/** Why the plan of the day is not ready, or null. Rows with no name are ignored, never an error. */
export function planProblem(draft: InvitationDraft): string | null {
  const named = draft.events.filter((event) => collapse(event.title, INVITATION_LIMITS.eventTitle));
  if (named.length > MAX_INVITATION_EVENTS) return `Add up to ${MAX_INVITATION_EVENTS} events`;
  return null;
}

/** Why the reply settings are not ready, or null. Every one of them is optional. */
export function replyProblem(draft: InvitationDraft): string | null {
  if (draft.rsvpPhone.trim() && !phoneIsPlausible(draft.rsvpCountry, draft.rsvpPhone)) {
    return 'Check the WhatsApp number, with the country code';
  }
  if (draft.rsvpBy && draft.date && draft.rsvpBy > draft.date) {
    return 'The reply-by day should be before the day itself';
  }
  return null;
}

/** The first thing that stops the invitation being sent, or null. */
export function invitationProblem(draft: InvitationDraft): string | null {
  return detailsProblem(draft) ?? planProblem(draft) ?? replyProblem(draft);
}

export function isInvitationReady(draft: InvitationDraft | null | undefined): draft is InvitationDraft {
  return Boolean(draft) && invitationProblem(draft as InvitationDraft) === null;
}

// ---- To and from the server ----

function sortKey(event: { date: string; time: string }): string {
  return `${event.date}T${event.time || '99:99'}`;
}

/** What goes to the server: trimmed, capped, events sorted and defaulted to the main day. */
export function toInvitationPayload(draft: InvitationDraft): InvitationPayload {
  const info = OCCASION_INFO[draft.occasion];
  const events = draft.events
    .map((event) => ({
      title: collapse(event.title, INVITATION_LIMITS.eventTitle),
      date: event.date || draft.date,
      time: event.time,
      venue: collapse(event.venue, INVITATION_LIMITS.venue),
    }))
    .filter((event) => event.title)
    .slice(0, MAX_INVITATION_EVENTS)
    .sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));

  return {
    occasion: draft.occasion,
    design: info.couple ? draft.design : DEFAULT_DESIGN,
    nameOne: collapse(draft.nameOne, INVITATION_LIMITS.name),
    nameTwo: info.couple ? collapse(draft.nameTwo, INVITATION_LIMITS.name) : '',
    tagline: collapse(draft.tagline, INVITATION_LIMITS.tagline),
    date: draft.date,
    venueName: collapse(draft.venueName, INVITATION_LIMITS.venue),
    venueAddress: collapse(draft.venueAddress, INVITATION_LIMITS.address),
    events,
    hostLine: collapse(draft.hostLine, INVITATION_LIMITS.hostLine),
    rsvpWhatsapp: whatsappDigits(draft.rsvpCountry, draft.rsvpPhone),
    rsvpBy: draft.rsvpBy,
    blessing: info.offersBlessing ? draft.blessing : 'none',
    dressCode: collapse(draft.dressCode, INVITATION_LIMITS.dressCode),
  };
}

/** Country codes we split a stored number by, longest first. A number we cannot place keeps the default. */
const KNOWN_COUNTRY_CODES = ['971', '966', '974', '965', '968', '973', '977', '880', '94', '91', '92', '65', '61', '44', '49', '33', '27', '20', '1'];

/** Splits stored WhatsApp digits back into the country code and the number the host typed. */
export function splitWhatsapp(digits: string): { country: string; phone: string } {
  if (!digits) return { country: DEFAULT_COUNTRY_CODE, phone: '' };
  const country = KNOWN_COUNTRY_CODES.find((code) => digits.startsWith(code));
  return country ? { country, phone: digits.slice(country.length) } : { country: DEFAULT_COUNTRY_CODE, phone: digits };
}

/** Rebuilds the form from what the server stored, for editing. Null when it is not an invitation. */
export function invitationFromStored(value: unknown): InvitationDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (!isInvitationOccasion(raw.occasion)) return null;
  const text = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : '');
  const { country, phone } = splitWhatsapp(text('rsvpWhatsapp'));
  const events = Array.isArray(raw.events)
    ? raw.events.slice(0, MAX_INVITATION_EVENTS).map((item) => {
        const event = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
        const field = (key: string) => (typeof event[key] === 'string' ? (event[key] as string) : '');
        return { title: field('title'), date: field('date'), time: field('time'), venue: field('venue') };
      })
    : [];
  return {
    occasion: raw.occasion,
    design: isInvitationDesign(raw.design) && OCCASION_INFO[raw.occasion].couple ? raw.design : DEFAULT_DESIGN,
    nameOne: text('nameOne'),
    nameTwo: text('nameTwo'),
    tagline: text('tagline'),
    date: text('date'),
    venueName: text('venueName'),
    venueAddress: text('venueAddress'),
    events,
    hostLine: text('hostLine'),
    rsvpCountry: country,
    rsvpPhone: phone,
    rsvpBy: text('rsvpBy'),
    blessing: raw.blessing === 'ganesh' ? 'ganesh' : 'none',
    dressCode: text('dressCode'),
  };
}

/** A one-line summary for the review step: "Wedding · 23 Feb 2027 · 5 events". */
export function invitationSummaryLine(draft: InvitationDraft): string {
  const events = draft.events.filter((event) => event.title.trim()).length;
  return [
    OCCASION_INFO[draft.occasion].label,
    shortDay(draft.date),
    events > 0 ? `${events} ${events === 1 ? 'event' : 'events'}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
