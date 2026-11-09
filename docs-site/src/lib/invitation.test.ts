import {
  DESIGNS,
  DESIGN_INFO,
  GANESH_BLESSING,
  MAX_INVITATION_EVENTS,
  OCCASIONS,
  OCCASION_INFO,
  calendarEntries,
  countdownLabel,
  daysUntil,
  demoInvitation,
  formatDay,
  formatTime,
  hostLineOf,
  invitationFromStored,
  invitationIcs,
  invitationInitials,
  invitationTitle,
  localMoment,
  mapsUrl,
  parseDay,
  parseInvitation,
  phoneDigits,
  rsvpLink,
  rsvpMessage,
  sortEvents,
  startsAt,
  type Invitation,
} from './invitation';

const valid = {
  occasion: 'wedding',
  nameOne: '  Aarav ',
  nameTwo: 'Priya',
  date: '2027-02-23',
  venueName: 'The Grand Courtyard',
  venueAddress: 'Civil Lines, Jaipur',
  events: [
    { title: 'Sangeet', date: '2027-02-22', time: '19:30', venue: 'Courtyard' },
    { title: 'Mehendi', date: '2027-02-21', time: '16:00', venue: '' },
  ],
  hostLine: '',
  rsvpWhatsapp: '+91 98765 43210',
  rsvpBy: '2027-02-01',
  blessing: 'ganesh',
  dressCode: 'Festive Indian',
};

const ok = (input: unknown): Invitation => {
  const result = parseInvitation(input);
  if (!result.ok) throw new Error(result.message);
  return result.invitation;
};
const message = (input: unknown) => {
  const result = parseInvitation(input);
  return result.ok ? null : result.message;
};

describe('parseDay', () => {
  it('accepts a real day and refuses everything else', () => {
    expect(parseDay('2027-02-23')).toEqual({ year: 2027, month: 2, day: 23 });
    expect(parseDay('2027-02-30')).toBeNull();
    expect(parseDay('2027-13-01')).toBeNull();
    expect(parseDay('23-02-2027')).toBeNull();
    expect(parseDay('2010-01-01')).toBeNull();
    expect(parseDay(20270223)).toBeNull();
    expect(parseDay(null)).toBeNull();
  });

  it('knows a leap day', () => {
    expect(parseDay('2028-02-29')).not.toBeNull();
    expect(parseDay('2027-02-29')).toBeNull();
  });
});

describe('parseInvitation', () => {
  it('tidies a good invitation', () => {
    const invitation = ok(valid);
    expect(invitation.nameOne).toBe('Aarav');
    expect(invitation.rsvpWhatsapp).toBe('919876543210');
    expect(invitation.blessing).toBe('ganesh');
    expect(invitation.events.map((e) => e.title)).toEqual(['Mehendi', 'Sangeet']);
  });

  it('needs an occasion, the names, a real date and a venue, and says which is missing', () => {
    expect(message({ ...valid, occasion: 'funeral' })).toBe('Choose the occasion');
    expect(message({ ...valid, occasion: undefined })).toBe('Choose the occasion');
    expect(message({ ...valid, nameTwo: ' ' })).toBe('Add both names');
    expect(message({ ...valid, occasion: 'birthday', nameOne: ' ' })).toBe('Add the name');
    expect(message({ ...valid, date: '2027-02-31' })).toBe('Add the date');
    expect(message({ ...valid, venueName: '' })).toBe('Add the venue');
    expect(message(null)).toBe('Add the invitation details');
  });

  it('has three designs for a ceremony, each with a name and a line about it', () => {
    expect(DESIGNS).toEqual(['regal', 'sage', 'palace']);
    for (const design of DESIGNS) {
      expect(DESIGN_INFO[design].label.length).toBeGreaterThan(3);
      expect(DESIGN_INFO[design].blurb.length).toBeGreaterThan(15);
    }
  });

  it('keeps the chosen design for a ceremony, and falls back to regal for a missing or unknown one', () => {
    expect(ok({ ...valid, design: 'sage' }).design).toBe('sage');
    expect(ok({ ...valid, design: 'palace' }).design).toBe('palace');
    expect(ok({ ...valid, design: 'neon' }).design).toBe('regal');
    expect(ok(valid).design).toBe('regal');
    expect(ok({ ...valid, occasion: 'engagement', design: 'sage' }).design).toBe('sage');
  });

  it('ignores a design for an occasion that has only one look', () => {
    expect(ok({ ...valid, occasion: 'birthday', nameTwo: '', design: 'sage' }).design).toBe('regal');
  });

  it('keeps one name for an occasion with one name, whatever else was sent', () => {
    const birthday = ok({ ...valid, occasion: 'birthday', nameOne: 'Meera', nameTwo: 'Someone', tagline: '  turning 30 ' });
    expect(birthday.nameTwo).toBe('');
    expect(birthday.tagline).toBe('turning 30');
    expect(invitationTitle(birthday)).toBe('Meera');
    expect(invitationInitials(birthday)).toBe('M');
  });

  it('knows which occasions are couples', () => {
    const couples = OCCASIONS.filter((o) => OCCASION_INFO[o].couple);
    expect(couples).toEqual(['wedding', 'engagement', 'anniversary']);
  });

  it('does not need events, an address, an RSVP number or a reply-by date', () => {
    const invitation = ok({ occasion: 'wedding', nameOne: 'A', nameTwo: 'B', date: '2027-02-23', venueName: 'Hall' });
    expect(invitation.events).toEqual([]);
    expect(invitation.rsvpWhatsapp).toBe('');
    expect(invitation.rsvpBy).toBe('');
    expect(invitation.blessing).toBe('none');
  });

  it('limits the events and checks each one', () => {
    const many = Array.from({ length: MAX_INVITATION_EVENTS + 1 }, () => valid.events[0]);
    expect(message({ ...valid, events: many })).toMatch(/up to 6/);
    expect(message({ ...valid, events: [{ title: '', date: '2027-02-22' }] })).toBe('Give each event a name');
    expect(message({ ...valid, events: [{ title: 'Haldi', date: 'soon' }] })).toBe('Add a date for Haldi');
  });

  it('drops a time that is not a time, keeping the event', () => {
    const invitation = ok({ ...valid, events: [{ title: 'Haldi', date: '2027-02-22', time: '25:99' }] });
    expect(invitation.events[0]!.time).toBe('');
  });

  it('refuses a WhatsApp number that is not a number, rather than guessing', () => {
    expect(message({ ...valid, rsvpWhatsapp: 'call me' })).toBe('Check the WhatsApp number for RSVPs');
    expect(message({ ...valid, rsvpWhatsapp: '123' })).toBe('Check the WhatsApp number for RSVPs');
    expect(ok({ ...valid, rsvpWhatsapp: '' }).rsvpWhatsapp).toBe('');
  });

  it('refuses a reply-by date that is not a day', () => {
    expect(message({ ...valid, rsvpBy: 'tomorrow' })).toBe('Check the reply-by date');
  });

  it('cuts long text and strips control characters', () => {
    const invitation = ok({ ...valid, nameOne: `A${'x'.repeat(80)}\u0007\n`, dressCode: 'y'.repeat(200) });
    expect(Array.from(invitation.nameOne).length).toBeLessThanOrEqual(36);
    expect(invitation.nameOne).not.toMatch(/[\u0000-\u001F]/);
    expect(invitation.dressCode.length).toBe(60);
  });

  it('never keeps a link the couple typed as their "venue" field as anything but text', () => {
    // There is no link field: the map link is built from words, so nothing pasted can be followed.
    const invitation = ok({ ...valid, venueName: 'https://evil.example', mapUrl: 'https://evil.example' });
    expect(invitation).not.toHaveProperty('mapUrl');
    expect(mapsUrl(invitation).startsWith('https://www.google.com/maps/search/')).toBe(true);
  });

  it('reads a stored invitation back, or nothing', () => {
    expect(invitationFromStored(ok(valid))?.nameTwo).toBe('Priya');
    expect(invitationFromStored({ nameOne: 'A' })).toBeNull();
    expect(invitationFromStored(undefined)).toBeNull();
  });
});

describe('names and dates in words', () => {
  const invitation = ok(valid);

  it('names the couple, their initials and the line above', () => {
    expect(invitationTitle(invitation)).toBe('Aarav & Priya');
    expect(invitationInitials(invitation)).toBe('AP');
    expect(hostLineOf(invitation)).toBe('Together with their families');
    expect(hostLineOf({ occasion: 'wedding', hostLine: 'With the blessings of our parents' })).toBe(
      'With the blessings of our parents',
    );
    expect(hostLineOf({ occasion: 'birthday', hostLine: '' })).toBe('You are invited');
  });

  it('writes a day the same everywhere', () => {
    expect(formatDay('2027-02-23')).toBe('23 February 2027');
    expect(formatDay('2027-02-23', 'short')).toBe('23 Feb 2027');
    expect(formatDay('2027-02-23', 'weekday')).toBe('Tuesday');
    expect(formatDay('2027-02-23', 'dayNumber')).toBe('23');
    expect(formatDay('2027-02-23', 'monthShort')).toBe('FEB');
    expect(formatDay('nonsense')).toBe('');
  });

  it('writes a time in 12 hours', () => {
    expect(formatTime('18:30')).toBe('6:30 PM');
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('00:15')).toBe('12:15 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('')).toBe('');
  });

  it('counts whole days to the day, whatever the time of day', () => {
    expect(daysUntil('2027-02-23', new Date(2027, 1, 20, 23, 59))).toBe(3);
    expect(daysUntil('2027-02-23', new Date(2027, 1, 23, 0, 1))).toBe(0);
    expect(daysUntil('2027-02-23', new Date(2027, 1, 25))).toBe(-2);
    expect(countdownLabel(42)).toBe('42 days to go');
    expect(countdownLabel(1)).toBe('Tomorrow');
    expect(countdownLabel(0)).toBe('Today');
    expect(countdownLabel(-3)).toBeNull();
  });

  it('knows when the celebration begins: the first event, or the day itself', () => {
    expect(startsAt(invitation)).toEqual(new Date(2027, 1, 21, 16, 0));
    expect(startsAt({ date: '2027-02-23', events: [] })).toEqual(new Date(2027, 1, 23, 0, 0));
    expect(startsAt({ date: 'nonsense', events: [] })).toBeNull();
    expect(localMoment('2027-02-23', '18:30')).toEqual(new Date(2027, 1, 23, 18, 30));
    expect(localMoment('2027-02-23', 'late')).toEqual(new Date(2027, 1, 23, 0, 0));
  });

  it('orders events by day, then time, with untimed ones last on their day', () => {
    const sorted = sortEvents([
      { title: 'B', date: '2027-02-23', time: '', venue: '' },
      { title: 'A', date: '2027-02-23', time: '09:00', venue: '' },
      { title: 'C', date: '2027-02-22', time: '23:00', venue: '' },
    ]);
    expect(sorted.map((e) => e.title)).toEqual(['C', 'A', 'B']);
  });
});

describe('the RSVP', () => {
  const invitation = ok(valid);

  it('words a yes with the number of guests and the events', () => {
    const text = rsvpMessage(invitation, { name: 'Neha', answer: 'yes', guests: 3, events: ['Sangeet', 'Wedding'], note: 'Cannot wait' });
    expect(text).toBe("Hello! This is Neha. We will be there at Aarav & Priya's wedding for Sangeet, Wedding: 3 of us. Cannot wait");
  });

  it('names the occasion the way a person would say it', () => {
    const birthday = ok({ ...valid, occasion: 'birthday', nameOne: 'Meera', nameTwo: '' });
    const party = ok({ ...valid, occasion: 'party', nameOne: 'the team', nameTwo: '' });
    const yes = { name: 'Neha', answer: 'yes', guests: 1, events: [], note: '' } as const;
    expect(rsvpMessage(birthday, yes)).toBe("Hello! This is Neha. I will be there at Meera's birthday.");
    expect(rsvpMessage(party, yes)).toBe("Hello! This is Neha. I will be there at the team's celebration.");
  });

  it('words a yes for one, and a no kindly', () => {
    expect(rsvpMessage(invitation, { name: 'Neha', answer: 'yes', guests: 1, events: [], note: '' })).toBe(
      "Hello! This is Neha. I will be there at Aarav & Priya's wedding.",
    );
    expect(rsvpMessage(invitation, { name: 'Neha', answer: 'no', guests: 1, events: [], note: 'Travelling' })).toBe(
      "Hello! This is Neha. I am sorry, I will not be able to join Aarav & Priya's wedding. Travelling",
    );
  });

  it('copes with no name and a silly number of guests', () => {
    expect(rsvpMessage(invitation, { name: '  ', answer: 'yes', guests: 500, events: [], note: '' })).toContain('A guest');
    expect(rsvpMessage(invitation, { name: 'N', answer: 'yes', guests: 500, events: [], note: '' })).toContain('10 of us');
    expect(rsvpMessage(invitation, { name: 'N', answer: 'yes', guests: -4, events: [], note: '' })).toContain('I will be there');
  });

  it('links to a WhatsApp chat with the message ready, or to nothing without a number', () => {
    const link = rsvpLink(invitation, 'Hello & hi');
    expect(link).toBe('https://wa.me/919876543210?text=Hello%20%26%20hi');
    expect(rsvpLink({ rsvpWhatsapp: '' }, 'x')).toBeNull();
  });

  it('keeps only digits of a phone number, and only a plausible one', () => {
    expect(phoneDigits('+91 (98765) 43-210')).toBe('919876543210');
    expect(phoneDigits('12')).toBe('');
    expect(phoneDigits('1'.repeat(16))).toBe('');
    expect(phoneDigits(undefined)).toBe('');
  });
});

describe('the calendar file', () => {
  const invitation = ok(valid);
  const now = new Date(Date.UTC(2026, 9, 27, 10, 30, 5));
  const ics = invitationIcs(invitation, 'abc123', now);

  it('is a valid calendar with one entry per event', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTAMP:20261027T103005Z');
    expect(ics).toContain('UID:abc123-0@occasio');
  });

  it('puts an event at its local time, three hours long, with no time zone', () => {
    expect(ics).toContain('DTSTART:20270221T160000');
    expect(ics).toContain('DTEND:20270221T190000');
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}Z/);
  });

  it('escapes commas and names the place', () => {
    expect(ics).toContain('LOCATION:The Grand Courtyard\\, Civil Lines\\, Jaipur');
    expect(ics).toContain('SUMMARY:Mehendi: Aarav & Priya');
  });

  it('is a whole-day entry when no time is set', () => {
    const allDay = invitationIcs(
      ok({ ...valid, events: [{ title: 'Haldi', date: '2027-02-22' }] }),
      'x',
      now,
    );
    expect(allDay).toContain('DTSTART;VALUE=DATE:20270222');
    expect(allDay).toContain('DTEND;VALUE=DATE:20270223');
  });

  it('puts the venue address only on events held at the venue', () => {
    const ics = invitationIcs(
      ok({
        ...valid,
        venueName: 'Hall',
        venueAddress: 'Civil Lines',
        events: [
          { title: 'Haldi', date: '2027-02-22', time: '09:00', venue: 'Family home' },
          { title: 'Wedding', date: '2027-02-23', time: '18:00', venue: 'Hall' },
          { title: 'Lunch', date: '2027-02-24', time: '13:00', venue: '' },
        ],
      }),
      'x',
      now,
    );
    expect(ics).toContain('LOCATION:Family home\r\n');
    expect(ics.match(/LOCATION:Hall\\, Civil Lines/g)).toHaveLength(2);
  });

  it('falls back to the day itself, named for the occasion, when no events are listed', () => {
    const bare = ok({ occasion: 'wedding', nameOne: 'A', nameTwo: 'B', date: '2027-02-23', venueName: 'Hall' });
    expect(calendarEntries(bare)).toHaveLength(1);
    expect(invitationIcs(bare, 'x', now)).toContain('DTSTART;VALUE=DATE:20270223');
    expect(invitationIcs(bare, 'x', now)).toContain('SUMMARY:Wedding: A & B');
    const party = ok({ occasion: 'party', nameOne: 'Sam', date: '2027-02-23', venueName: 'Hall' });
    expect(invitationIcs(party, 'x', now)).toContain('SUMMARY:Celebration: Sam');
  });

  it('folds long lines at 75 bytes and never inside a character', () => {
    const long = invitationIcs(
      ok({ ...valid, venueName: 'Ananya Mahal '.repeat(5), venueAddress: 'अत्यंत लंबा पता '.repeat(8) }),
      'x',
      now,
    );
    for (const line of long.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(long).not.toContain('�');
  });

  it('every line ends with CRLF', () => {
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });
});

describe('the demos and the blessing', () => {
  const today = new Date(2026, 9, 27);

  it('has a demo for every occasion that passes its own checks', () => {
    for (const occasion of OCCASIONS) {
      const demo = demoInvitation(occasion, today);
      expect(parseInvitation(demo)).toEqual({ ok: true, invitation: demo });
      expect(demo.occasion).toBe(occasion);
      expect(Boolean(demo.nameTwo)).toBe(OCCASION_INFO[occasion].couple);
    }
  });

  it('builds a demo in each design for a ceremony, and one look for the rest', () => {
    for (const design of DESIGNS) {
      const demo = demoInvitation('wedding', today, design);
      expect(demo.design).toBe(design);
      expect(parseInvitation(demo)).toEqual({ ok: true, invitation: demo });
    }
    expect(demoInvitation('birthday', today, 'sage').design).toBe('regal');
  });

  it('puts every demo in the future, so a countdown always has something to count', () => {
    for (const occasion of OCCASIONS) {
      expect(daysUntil(demoInvitation(occasion, today).date, today)).toBeGreaterThan(0);
    }
  });

  it('keeps each demo event on or around the main day, in order', () => {
    const wedding = demoInvitation('wedding', today);
    expect(wedding.events.map((e) => e.title)).toEqual(['Mehendi', 'Sangeet', 'Haldi', 'Wedding', 'Reception']);
    expect(wedding.events[3]!.date).toBe(wedding.date);
    expect(daysUntil(wedding.date, today)).toBe(119);
  });

  it('has the blessing in Devanagari with its meaning', () => {
    expect(GANESH_BLESSING.heading).toContain('श्री गणेशाय नमः');
    expect(GANESH_BLESSING.verse).toContain('वक्रतुण्ड');
    expect(GANESH_BLESSING.meaning.length).toBeGreaterThan(20);
  });
});
