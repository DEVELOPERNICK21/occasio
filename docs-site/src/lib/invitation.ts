/**
 * An invitation: what the host fills in for a wedding, birthday or any other gathering, how it is
 * checked, and the small pieces the invitation page builds from it (dates, a calendar file, a
 * WhatsApp RSVP link).
 *
 * One link goes to many guests, so everything here is made to be shown publicly: nothing is
 * accepted as a free-form link (the map and the RSVP links are built from plain text and a phone
 * number), and nothing guests type is stored: an RSVP is a WhatsApp message to the host.
 *
 * Kept free of the browser and of Firebase so the page, the server and the tests share it.
 */

export const MAX_INVITATION_EVENTS = 6;

/** The `templateType` of a card that is an invitation. The occasion lives in `invitation.occasion`. */
export const INVITATION_TEMPLATE = 'invitation';

export const OCCASIONS = [
  'wedding',
  'engagement',
  'anniversary',
  'birthday',
  'baby_shower',
  'housewarming',
  'graduation',
  'party',
] as const;

export type Occasion = (typeof OCCASIONS)[number];

type OccasionInfo = {
  label: string;
  /** How the occasion reads in a sentence: "at Aarav's birthday". */
  noun: string;
  /** Two names (a couple) rather than one. */
  couple: boolean;
  /** The line above the names, unless the host wrote their own. May be empty. */
  eyebrow: string;
  /** The line between the eyebrow and the names. */
  lead: string;
  /** What a day with no listed events is called in the calendar. */
  entry: string;
};

/** The one table of occasions. The app keeps its own copy of the labels; this is what the server checks. */
export const OCCASION_INFO: Record<Occasion, OccasionInfo> = {
  wedding: {
    label: 'Wedding',
    noun: 'wedding',
    couple: true,
    eyebrow: 'Together with their families',
    lead: 'invite you to celebrate the wedding of',
    entry: 'Wedding',
  },
  engagement: {
    label: 'Engagement',
    noun: 'engagement',
    couple: true,
    eyebrow: 'Together with their families',
    lead: 'invite you to celebrate the engagement of',
    entry: 'Engagement',
  },
  anniversary: {
    label: 'Anniversary',
    noun: 'anniversary',
    couple: true,
    eyebrow: 'You are invited',
    lead: 'to celebrate the anniversary of',
    entry: 'Anniversary',
  },
  birthday: {
    label: 'Birthday',
    noun: 'birthday',
    couple: false,
    eyebrow: 'You are invited',
    lead: 'to celebrate',
    entry: 'Birthday',
  },
  baby_shower: {
    label: 'Baby shower',
    noun: 'baby shower',
    couple: false,
    eyebrow: 'You are invited',
    lead: 'to a baby shower for',
    entry: 'Baby shower',
  },
  housewarming: {
    label: 'Housewarming',
    noun: 'housewarming',
    couple: false,
    eyebrow: 'You are invited',
    lead: 'to the housewarming of',
    entry: 'Housewarming',
  },
  graduation: {
    label: 'Graduation',
    noun: 'graduation',
    couple: false,
    eyebrow: 'You are invited',
    lead: 'to celebrate the graduation of',
    entry: 'Graduation',
  },
  party: {
    label: 'Party',
    noun: 'celebration',
    couple: false,
    eyebrow: 'You are invited',
    lead: 'to celebrate with',
    entry: 'Celebration',
  },
};

/**
 * How a ceremony looks: three designs to choose from. Only a wedding, engagement or anniversary uses
 * one; every other occasion has a single party look and ignores it.
 */
export const DESIGNS = ['regal', 'sage', 'palace'] as const;

export type InvitationDesign = (typeof DESIGNS)[number];

export const DESIGN_INFO: Record<InvitationDesign, { label: string; blurb: string }> = {
  regal: {
    label: 'Baraat road',
    blurb: 'A photograph of the wedding car, dressed in marigolds. Honk at each celebration to hang a garland.',
  },
  sage: {
    label: 'Garden doors',
    blurb: 'Green doors and satin curtains open on a garden. Scratch a foil heart for the date.',
  },
  palace: {
    label: 'Pink City palace',
    blurb: 'Pull the rings on a golden gate. The arch fills with plum satin and your photograph rests at its foot.',
  },
};

export const DEFAULT_DESIGN: InvitationDesign = 'regal';

export function isDesign(value: unknown): value is InvitationDesign {
  return typeof value === 'string' && (DESIGNS as readonly string[]).includes(value);
}

export function isOccasion(value: unknown): value is Occasion {
  return typeof value === 'string' && (OCCASIONS as readonly string[]).includes(value);
}

export type InvitationEvent = {
  title: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM`, 24 hours, local time at the venue. Empty when the time is not fixed. */
  time: string;
  venue: string;
};

export type Blessing = 'ganesh' | 'none';

export type Invitation = {
  occasion: Occasion;
  /** The look of a ceremony. Always `regal` for every occasion that is not a couple. */
  design: InvitationDesign;
  /** The host or guest of honour, or the first of a couple. */
  nameOne: string;
  /** The second of a couple. Empty for every occasion that has one name. */
  nameTwo: string;
  /** A short line under the names: "turning 30", "25 years together". May be empty. */
  tagline: string;
  /** The main day, `YYYY-MM-DD`. */
  date: string;
  venueName: string;
  venueAddress: string;
  /** The parts of the celebration over the days (mehendi, sangeet, the wedding…). May be empty. */
  events: InvitationEvent[];
  /** The line above the names. Empty means the default for the occasion. */
  hostLine: string;
  /** Digits only, with the country code (`919876543210`). Empty means no RSVP button. */
  rsvpWhatsapp: string;
  /** Reply-by day, `YYYY-MM-DD`, or empty. */
  rsvpBy: string;
  blessing: Blessing;
  dressCode: string;
};

const LIMITS = {
  /** Two names and an ampersand must fit the 80-character recipient name: 36 + 3 + 36 = 75. */
  name: 36,
  tagline: 40,
  eventTitle: 40,
  venue: 80,
  address: 160,
  hostLine: 120,
  dressCode: 60,
} as const;

const MIN_YEAR = 2024;
const MAX_YEAR = 2045;

/** Collapses whitespace and drops control characters. */
function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export type DayParts = { year: number; month: number; day: number };

/** A real calendar day from `YYYY-MM-DD`, or null. */
export function parseDay(value: unknown): DayParts | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  const real =
    check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
  return real ? { year, month, day } : null;
}

function parseTime(value: unknown): string {
  if (typeof value !== 'string') return '';
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? `${match[1]}:${match[2]}` : '';
}

/** Digits of a phone number (8 to 15, as in E.164), or an empty string. */
export function phoneDigits(value: unknown): string {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

export type InvitationResult = { ok: true; invitation: Invitation } | { ok: false; message: string };

/** Checks and tidies what the app sent. Anything unknown is dropped; anything wrong says what. */
export function parseInvitation(input: unknown): InvitationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, message: 'Add the invitation details' };
  }
  const raw = input as Record<string, unknown>;

  if (!isOccasion(raw.occasion)) {
    return { ok: false, message: 'Choose the occasion' };
  }
  const occasion = raw.occasion;
  const couple = OCCASION_INFO[occasion].couple;

  const nameOne = clean(raw.nameOne, LIMITS.name);
  const nameTwo = couple ? clean(raw.nameTwo, LIMITS.name) : '';
  if (!nameOne || (couple && !nameTwo)) {
    return { ok: false, message: couple ? 'Add both names' : 'Add the name' };
  }

  if (!parseDay(raw.date)) {
    return { ok: false, message: 'Add the date' };
  }
  const date = raw.date as string;

  const venueName = clean(raw.venueName, LIMITS.venue);
  if (!venueName) {
    return { ok: false, message: 'Add the venue' };
  }

  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  if (rawEvents.length > MAX_INVITATION_EVENTS) {
    return { ok: false, message: `Add up to ${MAX_INVITATION_EVENTS} events` };
  }
  const events: InvitationEvent[] = [];
  for (const item of rawEvents) {
    const event = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const title = clean(event.title, LIMITS.eventTitle);
    if (!title) return { ok: false, message: 'Give each event a name' };
    if (!parseDay(event.date)) return { ok: false, message: `Add a date for ${title}` };
    events.push({
      title,
      date: event.date as string,
      time: parseTime(event.time),
      venue: clean(event.venue, LIMITS.venue),
    });
  }

  const rawPhone = typeof raw.rsvpWhatsapp === 'string' ? raw.rsvpWhatsapp.trim() : '';
  const rsvpWhatsapp = phoneDigits(rawPhone);
  if (rawPhone && !rsvpWhatsapp) {
    return { ok: false, message: 'Check the WhatsApp number for RSVPs' };
  }

  const rsvpByRaw = typeof raw.rsvpBy === 'string' ? raw.rsvpBy.trim() : '';
  if (rsvpByRaw && !parseDay(rsvpByRaw)) {
    return { ok: false, message: 'Check the reply-by date' };
  }

  return {
    ok: true,
    invitation: {
      occasion,
      design: couple && isDesign(raw.design) ? raw.design : DEFAULT_DESIGN,
      nameOne,
      nameTwo,
      tagline: clean(raw.tagline, LIMITS.tagline),
      date,
      venueName,
      venueAddress: clean(raw.venueAddress, LIMITS.address),
      events: sortEvents(events),
      hostLine: clean(raw.hostLine, LIMITS.hostLine),
      rsvpWhatsapp,
      rsvpBy: rsvpByRaw,
      blessing: raw.blessing === 'ganesh' ? 'ganesh' : 'none',
      dressCode: clean(raw.dressCode, LIMITS.dressCode),
    },
  };
}

/** Reads a stored invitation back. Anything that does not check out gives null, never a half card. */
export function invitationFromStored(value: unknown): Invitation | null {
  const result = parseInvitation(value);
  return result.ok ? result.invitation : null;
}

/** The name or names as one line: "Aarav & Priya", or "Meera". */
export function invitationTitle(invitation: Pick<Invitation, 'nameOne' | 'nameTwo'>): string {
  return invitation.nameTwo ? `${invitation.nameOne} & ${invitation.nameTwo}` : invitation.nameOne;
}

/** The letters on the seal: one from each name of a couple, the first letter of a single name. */
export function invitationInitials(invitation: Pick<Invitation, 'nameOne' | 'nameTwo'>): string {
  const first = Array.from(invitation.nameOne)[0] ?? '';
  const second = Array.from(invitation.nameTwo)[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

/** The line above the names: the host's own, or the occasion's. May be empty. */
export function hostLineOf(invitation: Pick<Invitation, 'hostLine' | 'occasion'>): string {
  return invitation.hostLine || OCCASION_INFO[invitation.occasion].eyebrow;
}

function sortKey(event: InvitationEvent): string {
  return `${event.date}T${event.time || '99:99'}`;
}

export function sortEvents(events: readonly InvitationEvent[]): InvitationEvent[] {
  return [...events].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export type DayStyle = 'long' | 'short' | 'weekday' | 'dayNumber' | 'monthShort';

/**
 * A day as words, the same on the server and every device (no time zones, no locale): `long` is
 * "23 February 2027", `short` "23 Feb 2027", `weekday` "Tuesday".
 */
export function formatDay(value: string, style: DayStyle = 'long'): string {
  const parts = parseDay(value);
  if (!parts) return '';
  const month = MONTHS[parts.month - 1]!;
  switch (style) {
    case 'short':
      return `${parts.day} ${month.slice(0, 3)} ${parts.year}`;
    case 'weekday':
      return WEEKDAYS[new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()]!;
    case 'dayNumber':
      return String(parts.day);
    case 'monthShort':
      return month.slice(0, 3).toUpperCase();
    default:
      return `${parts.day} ${month} ${parts.year}`;
  }
}

/** "6:30 PM" from `18:30`, or an empty string. */
export function formatTime(value: string): string {
  const time = parseTime(value);
  if (!time) return '';
  const hours = Number(time.slice(0, 2));
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${time.slice(3)} ${suffix}`;
}

/** Whole days from `today` to the day (0 on the day, negative after). Local calendar days. */
export function daysUntil(value: string, today: Date): number {
  const parts = parseDay(value);
  if (!parts) return 0;
  const target = Date.UTC(parts.year, parts.month - 1, parts.day);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / 86_400_000);
}

/** A local moment from a day and a `HH:MM` (midnight when there is no time), or null. */
export function localMoment(day: string, time: string): Date | null {
  const parts = parseDay(day);
  if (!parts) return null;
  const clock = parseTime(time) || '00:00';
  return new Date(parts.year, parts.month - 1, parts.day, Number(clock.slice(0, 2)), Number(clock.slice(3)));
}

/** When the celebration begins: the first event, or the day itself. In the guest's own time zone. */
export function startsAt(invitation: Pick<Invitation, 'date' | 'events'>): Date | null {
  const first = invitation.events[0];
  return first ? localMoment(first.date, first.time) : localMoment(invitation.date, '');
}

export function countdownLabel(days: number): string | null {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return null;
}

/** A Google Maps search for the venue, built from words we control, never from a pasted link. */
export function mapsUrl(invitation: Pick<Invitation, 'venueName' | 'venueAddress'>): string {
  const query = [invitation.venueName, invitation.venueAddress].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export type RsvpAnswer = 'yes' | 'no';

export type RsvpDraft = {
  name: string;
  answer: RsvpAnswer;
  guests: number;
  /** Titles of the events they will come to. Empty means "all of them" for a yes. */
  events: readonly string[];
  note: string;
};

export const MAX_RSVP_GUESTS = 10;

/** The message the guest sends to the host. Plain words, so it reads well in a chat. */
export function rsvpMessage(invitation: Invitation, draft: RsvpDraft): string {
  const name = clean(draft.name, LIMITS.name) || 'A guest';
  const where = `${invitationTitle(invitation)}'s ${OCCASION_INFO[invitation.occasion].noun}`;
  const note = clean(draft.note, 200);
  if (draft.answer === 'no') {
    return [`Hello! This is ${name}. I am sorry, I will not be able to join ${where}.`, note]
      .filter(Boolean)
      .join(' ');
  }
  const guests = Math.min(Math.max(Math.round(draft.guests) || 1, 1), MAX_RSVP_GUESTS);
  const who = guests === 1 ? 'I will be there' : 'We will be there';
  const party = guests === 1 ? '' : `: ${guests} of us`;
  const which = draft.events.length > 0 ? ` for ${draft.events.join(', ')}` : '';
  return [`Hello! This is ${name}. ${who} at ${where}${which}${party}.`, note].filter(Boolean).join(' ');
}

/** The WhatsApp chat with the host's number and the message ready to send, or null with no number. */
export function rsvpLink(invitation: Pick<Invitation, 'rsvpWhatsapp'>, message: string): string | null {
  if (!invitation.rsvpWhatsapp) return null;
  return `https://wa.me/${invitation.rsvpWhatsapp}?text=${encodeURIComponent(message)}`;
}

/** The traditional blessing at the head of many Hindu invitations (public-domain verse). */
export const GANESH_BLESSING = {
  heading: '॥ श्री गणेशाय नमः ॥',
  verse: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
  meaning: 'O Lord of the curved trunk, bright as a million suns, remove every obstacle from what we begin.',
} as const;

// ---- Calendar file ----

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Lines longer than 75 bytes are folded onto the next line, never inside a character. */
function icsFold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of Array.from(line)) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = char;
      bytes = size;
    } else {
      current += char;
      bytes += size;
    }
  }
  out.push(current);
  return out.join('\r\n ');
}

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

function icsStamp(now: Date): string {
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

/** Floating local time (no zone), which is what a gathering at a place means. */
function icsLocal(value: string, time: string, plusHours = 0): string {
  const parts = parseDay(value)!;
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  const moment = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hours + plusHours, minutes));
  return `${moment.getUTCFullYear()}${pad(moment.getUTCMonth() + 1)}${pad(moment.getUTCDate())}T${pad(moment.getUTCHours())}${pad(moment.getUTCMinutes())}00`;
}

function icsDate(value: string, plusDays = 0): string {
  const parts = parseDay(value)!;
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + plusDays));
  return `${day.getUTCFullYear()}${pad(day.getUTCMonth() + 1)}${pad(day.getUTCDate())}`;
}

/** What goes in the calendar: the listed events, or the day itself when none are listed. */
export function calendarEntries(invitation: Invitation): InvitationEvent[] {
  if (invitation.events.length > 0) return invitation.events;
  return [{ title: OCCASION_INFO[invitation.occasion].entry, date: invitation.date, time: '', venue: invitation.venueName }];
}

/** An `.ics` file with every event, ready for a phone to offer "Add to calendar". */
export function invitationIcs(invitation: Invitation, uidBase: string, now: Date = new Date()): string {
  const title = invitationTitle(invitation);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occasio//Invitation//EN', 'CALSCALE:GREGORIAN'];
  calendarEntries(invitation).forEach((event, index) => {
    // The address belongs to the main venue: an event held somewhere else gets only its own place.
    const elsewhere = Boolean(event.venue) && event.venue !== invitation.venueName;
    const place = elsewhere ? event.venue : [invitation.venueName, invitation.venueAddress].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT', `UID:${uidBase}-${index}@occasio`, `DTSTAMP:${icsStamp(now)}`);
    if (event.time) {
      lines.push(`DTSTART:${icsLocal(event.date, event.time)}`, `DTEND:${icsLocal(event.date, event.time, 3)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(event.date)}`, `DTEND;VALUE=DATE:${icsDate(event.date, 1)}`);
    }
    lines.push(`SUMMARY:${icsEscape(`${event.title}: ${title}`)}`);
    if (place) lines.push(`LOCATION:${icsEscape(place)}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.map(icsFold).join('\r\n')}\r\n`;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` for a day some days after `today`, so a demo is always about to happen. */
function dayAfter(today: Date, days: number): string {
  const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + days));
  return `${day.getUTCFullYear()}-${pad2(day.getUTCMonth() + 1)}-${pad2(day.getUTCDate())}`;
}

type DemoPlan = {
  nameOne: string;
  nameTwo?: string;
  tagline?: string;
  venueName: string;
  venueAddress: string;
  /** Days after today for the main day. */
  inDays: number;
  /** Events as [title, days before or after the main day, `HH:MM`, venue]. */
  events: ReadonlyArray<readonly [string, number, string, string]>;
  blessing?: Blessing;
  dressCode: string;
};

const DEMO_PLANS: Record<Occasion, DemoPlan> = {
  wedding: {
    nameOne: 'Aarav',
    nameTwo: 'Priya',
    venueName: 'The Grand Courtyard',
    venueAddress: 'Civil Lines, Jaipur, Rajasthan',
    inDays: 119,
    events: [
      ['Mehendi', -2, '16:00', 'The Grand Courtyard'],
      ['Sangeet', -1, '19:30', 'The Grand Courtyard'],
      ['Haldi', 0, '09:00', 'Family home'],
      ['Wedding', 0, '18:30', 'The Grand Courtyard'],
      ['Reception', 1, '20:00', 'The Grand Courtyard'],
    ],
    blessing: 'ganesh',
    dressCode: 'Festive Indian',
  },
  engagement: {
    nameOne: 'Kabir',
    nameTwo: 'Ananya',
    venueName: 'Rosewood Gardens',
    venueAddress: 'Koregaon Park, Pune',
    inDays: 60,
    events: [
      ['Ring ceremony', 0, '17:00', 'Rosewood Gardens'],
      ['Dinner', 0, '20:00', 'Rosewood Gardens'],
    ],
    blessing: 'ganesh',
    dressCode: 'Pastels',
  },
  anniversary: {
    nameOne: 'Ravi',
    nameTwo: 'Sunita',
    tagline: '25 years together',
    venueName: 'The Lakeside Hall',
    venueAddress: 'Powai, Mumbai',
    inDays: 45,
    events: [['Dinner and dancing', 0, '19:00', 'The Lakeside Hall']],
    dressCode: 'Smart evening wear',
  },
  birthday: {
    nameOne: 'Meera',
    tagline: 'turning 30',
    venueName: 'The Terrace Cafe',
    venueAddress: 'Indiranagar, Bengaluru',
    inDays: 21,
    events: [
      ['Games and music', 0, '17:00', 'The Terrace Cafe'],
      ['Cake', 0, '19:00', 'The Terrace Cafe'],
      ['Dinner', 0, '19:30', 'The Terrace Cafe'],
    ],
    dressCode: 'Bright colours',
  },
  baby_shower: {
    nameOne: 'Neha',
    tagline: 'and the little one on the way',
    venueName: 'Green Leaf Lounge',
    venueAddress: 'Banjara Hills, Hyderabad',
    inDays: 38,
    events: [
      ['Games', 0, '11:00', 'Green Leaf Lounge'],
      ['Lunch', 0, '13:00', 'Green Leaf Lounge'],
    ],
    dressCode: 'Soft pastels',
  },
  housewarming: {
    nameOne: 'The Shah family',
    venueName: 'Our new home, 12 Maple Avenue',
    venueAddress: 'Satellite, Ahmedabad',
    inDays: 14,
    events: [
      ['Griha pravesh puja', 0, '09:00', 'Our new home'],
      ['Lunch', 0, '12:30', 'Our new home'],
    ],
    blessing: 'ganesh',
    dressCode: 'Comfortable and festive',
  },
  graduation: {
    nameOne: 'Rohan',
    tagline: 'is graduating',
    venueName: 'The Garden Pavilion',
    venueAddress: 'Civil Lines, Delhi',
    inDays: 30,
    events: [['Dinner', 0, '19:30', 'The Garden Pavilion']],
    dressCode: 'Smart casual',
  },
  party: {
    nameOne: 'the team',
    tagline: 'a little end-of-year get-together',
    venueName: 'The Rooftop',
    venueAddress: 'Andheri West, Mumbai',
    inDays: 10,
    events: [
      ['Drinks', 0, '18:00', 'The Rooftop'],
      ['Dinner', 0, '20:00', 'The Rooftop'],
    ],
    dressCode: 'Come as you are',
  },
};

/** A sample invitation for `/c/demo-invite-<occasion>-…`, so each look can be seen without making one. */
export function demoInvitation(
  occasion: Occasion,
  today: Date = new Date(),
  design: InvitationDesign = DEFAULT_DESIGN,
): Invitation {
  const plan = DEMO_PLANS[occasion];
  return {
    occasion,
    design: OCCASION_INFO[occasion].couple ? design : DEFAULT_DESIGN,
    nameOne: plan.nameOne,
    nameTwo: plan.nameTwo ?? '',
    tagline: plan.tagline ?? '',
    date: dayAfter(today, plan.inDays),
    venueName: plan.venueName,
    venueAddress: plan.venueAddress,
    events: sortEvents(
      plan.events.map(([title, offset, time, venue]) => ({
        title,
        date: dayAfter(today, plan.inDays + offset),
        time,
        venue,
      })),
    ),
    hostLine: '',
    rsvpWhatsapp: '919876543210',
    rsvpBy: dayAfter(today, Math.max(plan.inDays - 21, 3)),
    blessing: plan.blessing ?? 'none',
    dressCode: plan.dressCode,
  };
}
