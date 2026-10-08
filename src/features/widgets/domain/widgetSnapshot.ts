import type {
  PersonDate,
  RelationshipType,
  VaultPerson,
} from '../../vault/domain/types';

/**
 * What the home-screen and lock-screen widgets are allowed to know.
 *
 * Privacy by construction: widgets show the relationship ("Mom"), never the
 * person's name, and carry no photos, messages or contact details. The only
 * identifier is the Vault person id, used to open the right card on tap.
 */
export const WIDGET_SNAPSHOT_VERSION = 1;
export const WIDGET_MAX_ENTRIES = 20;

export type WidgetOccasion = 'birthday' | 'anniversary';

export type WidgetEntry = {
  id: string;
  /** Relationship label shown on the widget, e.g. "Mom" or "Friend (R)". */
  label: string;
  relationship: RelationshipType;
  kind: WidgetOccasion;
  /** Next two occurrences as local calendar dates (`YYYY-MM-DD`), soonest first. */
  dates: string[];
  autoSend: boolean;
};

export type WidgetSnapshot = {
  v: typeof WIDGET_SNAPSHOT_VERSION;
  generatedAt: string;
  signedIn: boolean;
  entries: WidgetEntry[];
};

const BASE_LABELS: Record<RelationshipType, string> = {
  mom: 'Mom',
  dad: 'Dad',
  parent: 'Parent',
  partner: 'Partner',
  sibling: 'Sibling',
  friend: 'Friend',
  colleague: 'Colleague',
  other: 'Someone special',
};

export function widgetRelationshipLabel(type: RelationshipType): string {
  return BASE_LABELS[type] ?? BASE_LABELS.other;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Next occurrences of a yearly date, soonest first. Feb 29 falls on Feb 28 in
 * non-leap years — the same day auto-send fires — so "Today" on the widget
 * matches the day the card actually goes out. Impossible dates (31 Apr) are
 * skipped rather than silently rolled into the next month.
 */
export function nextOccurrences(
  date: PersonDate,
  now: Date,
  count = 2,
): string[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: string[] = [];

  for (let year = today.getFullYear(); year <= today.getFullYear() + 8; year += 1) {
    let { month, day } = date;
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      day = 28;
    }
    const candidate = new Date(year, month - 1, day);
    const valid =
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day;
    if (!valid || candidate < today) {
      continue;
    }
    out.push(isoDate(year, month, day));
    if (out.length === count) {
      break;
    }
  }
  return out;
}

function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : '';
}

/**
 * Labels for everyone who will appear on a widget. Two people with the same
 * relationship ("Friend", "Friend") would be indistinguishable, so repeats get
 * the first initial — "Friend (R)" — and only then a number.
 */
export function assignWidgetLabels(
  people: ReadonlyArray<Pick<VaultPerson, 'id' | 'personName' | 'relationshipType'>>,
): Map<string, string> {
  const labels = new Map<string, string>();
  const byBase = new Map<string, typeof people[number][]>();

  for (const person of people) {
    const base = widgetRelationshipLabel(person.relationshipType);
    byBase.set(base, [...(byBase.get(base) ?? []), person]);
  }

  for (const [base, group] of byBase) {
    if (group.length === 1) {
      labels.set(group[0]!.id, base);
      continue;
    }
    const withInitial = group.map((person) => {
      const initial = initialOf(person.personName);
      return { person, label: initial ? `${base} (${initial})` : base };
    });
    const seen = new Map<string, number>();
    for (const { person, label } of [...withInitial].sort((a, b) =>
      a.person.id.localeCompare(b.person.id),
    )) {
      const times = (seen.get(label) ?? 0) + 1;
      seen.set(label, times);
      labels.set(person.id, times === 1 ? label : `${label} ${times}`);
    }
  }
  return labels;
}

export function buildWidgetSnapshot(
  people: ReadonlyArray<VaultPerson>,
  now: Date = new Date(),
  signedIn = true,
): WidgetSnapshot {
  const labels = assignWidgetLabels(
    people.filter((person) => person.birthday || person.anniversary),
  );

  const entries: WidgetEntry[] = [];
  for (const person of people) {
    const label = labels.get(person.id);
    if (!label) {
      continue;
    }
    const occasions: Array<[WidgetOccasion, PersonDate | null, boolean]> = [
      ['birthday', person.birthday, person.autoSendBirthday],
      ['anniversary', person.anniversary, person.autoSendAnniversary],
    ];
    for (const [kind, date, autoSend] of occasions) {
      if (!date) {
        continue;
      }
      const dates = nextOccurrences(date, now);
      if (dates.length === 0) {
        continue;
      }
      entries.push({
        id: person.id,
        label,
        relationship: person.relationshipType,
        kind,
        dates,
        autoSend,
      });
    }
  }

  entries.sort(
    (a, b) =>
      (a.dates[0] ?? '').localeCompare(b.dates[0] ?? '') ||
      a.label.localeCompare(b.label),
  );

  return {
    v: WIDGET_SNAPSHOT_VERSION,
    generatedAt: now.toISOString(),
    signedIn,
    entries: entries.slice(0, WIDGET_MAX_ENTRIES),
  };
}

/** Everything except the timestamp — equal signatures mean nothing to rewrite. */
export function snapshotSignature(snapshot: WidgetSnapshot): string {
  return JSON.stringify({ s: snapshot.signedIn, e: snapshot.entries });
}
