import {
  DEFAULT_DESIGN,
  DESIGN_INFO,
  INVITATION_DESIGNS,
  INVITATION_OCCASIONS,
  MAX_INVITATION_EVENTS,
  OCCASION_INFO,
  clockLabel,
  dateToIso,
  detailsProblem,
  emptyInvitation,
  fieldDateToIso,
  invitationDemoUrl,
  invitationFromStored,
  invitationProblem,
  invitationSummaryLine,
  invitationTitle,
  isInvitationReady,
  isoToFieldDate,
  offersDesigns,
  planProblem,
  replyProblem,
  shortDay,
  splitWhatsapp,
  toInvitationPayload,
  whatsappDigits,
  type InvitationDraft,
} from '../../src/features/create/domain/invitation';
import { parseTemplateType, templateLabel } from '../../src/features/create/domain/templates';

function wedding(overrides: Partial<InvitationDraft> = {}): InvitationDraft {
  return {
    ...emptyInvitation('wedding'),
    nameOne: ' Aarav ',
    nameTwo: 'Priya',
    date: '2027-02-23',
    venueName: 'The Grand Courtyard',
    ...overrides,
  };
}

describe('the occasions', () => {
  it('has a label, a blurb and suggestions for every occasion', () => {
    for (const id of INVITATION_OCCASIONS) {
      const info = OCCASION_INFO[id];
      expect(info.id).toBe(id);
      expect(info.label.length).toBeGreaterThan(2);
      expect(info.blurb.length).toBeGreaterThan(10);
      expect(info.eventSuggestions.length).toBeGreaterThan(0);
      expect(info.eventSuggestions.length).toBeLessThanOrEqual(MAX_INVITATION_EVENTS);
    }
  });

  it('treats the three ceremonies as couples and the rest as one name', () => {
    const couples = INVITATION_OCCASIONS.filter((id) => OCCASION_INFO[id].couple);
    expect(couples).toEqual(['wedding', 'engagement', 'anniversary']);
  });

  it('gives a blank invitation the occasion and a country code, and nothing else', () => {
    const blank = emptyInvitation('birthday');
    expect(blank.occasion).toBe('birthday');
    expect(blank.rsvpCountry).toBe('91');
    expect(blank.events).toEqual([]);
    expect(blank.blessing).toBe('none');
  });
});

describe('the designs', () => {
  it('has three, each with a name, a line and what it does on opening', () => {
    expect(INVITATION_DESIGNS).toEqual(['regal', 'sage', 'palace']);
    for (const design of INVITATION_DESIGNS) {
      expect(DESIGN_INFO[design].label.length).toBeGreaterThan(3);
      expect(DESIGN_INFO[design].blurb.length).toBeGreaterThan(15);
      expect(DESIGN_INFO[design].entrance.length).toBeGreaterThan(15);
    }
    expect(DEFAULT_DESIGN).toBe('regal');
  });

  it('asks for a design only for the occasions that are a couple', () => {
    expect(INVITATION_OCCASIONS.filter(offersDesigns)).toEqual(['wedding', 'engagement', 'anniversary']);
  });

  it('starts every invitation in the default design', () => {
    for (const occasion of INVITATION_OCCASIONS) expect(emptyInvitation(occasion).design).toBe('regal');
  });

  it('sends the chosen design for a ceremony, and the default for everything else', () => {
    expect(toInvitationPayload(wedding({ design: 'sage' })).design).toBe('sage');
    expect(toInvitationPayload(wedding({ occasion: 'anniversary', design: 'palace' })).design).toBe('palace');
    expect(toInvitationPayload({ ...emptyInvitation('birthday'), design: 'sage', nameOne: 'Meera' }).design).toBe('regal');
  });

  it('reads the design back for editing, and falls back for anything it does not know', () => {
    const stored = toInvitationPayload(wedding({ design: 'palace' }));
    expect(invitationFromStored(stored)?.design).toBe('palace');
    expect(invitationFromStored({ ...stored, design: 'neon' })?.design).toBe('regal');
    expect(invitationFromStored({ ...stored, design: undefined })?.design).toBe('regal');
    expect(invitationFromStored({ ...stored, occasion: 'birthday', design: 'sage' })?.design).toBe('regal');
  });

  it('links to a live sample in the chosen design', () => {
    expect(invitationDemoUrl('https://x.test', 'wedding', 'sage')).toBe('https://x.test/c/demo-invite-wedding-sage-example');
    expect(invitationDemoUrl('https://x.test/', 'engagement', 'palace')).toBe('https://x.test/c/demo-invite-engagement-palace-example');
    expect(invitationDemoUrl('https://x.test', 'wedding', 'regal')).toBe('https://x.test/c/demo-invite-wedding-regal-example');
    // An occasion with one look has no design in its link.
    expect(invitationDemoUrl('https://x.test', 'birthday', 'sage')).toBe('https://x.test/c/demo-invite-birthday-example');
  });
});

describe('names and titles', () => {
  it('joins a couple with an ampersand and leaves one name alone', () => {
    expect(invitationTitle(wedding())).toBe('Aarav & Priya');
    expect(invitationTitle({ occasion: 'birthday', nameOne: 'Meera', nameTwo: 'ignored' })).toBe('Meera');
  });

  it('shows only the first name while the second is still empty', () => {
    expect(invitationTitle(wedding({ nameTwo: '' }))).toBe('Aarav');
  });

  it('collapses runs of spaces so the title is tidy', () => {
    expect(invitationTitle(wedding({ nameOne: 'Mary   Ann', nameTwo: ' Joe ' }))).toBe('Mary Ann & Joe');
  });
});

describe('dates and times', () => {
  it('converts between the picker text and the stored day', () => {
    expect(isoToFieldDate('2027-02-23')).toBe('23/02/2027');
    expect(fieldDateToIso('23/02/2027')).toBe('2027-02-23');
    expect(fieldDateToIso('3/2/2027')).toBe('2027-02-03');
    expect(isoToFieldDate('')).toBe('');
  });

  it('refuses a day that does not exist', () => {
    expect(fieldDateToIso('31/02/2027')).toBe('');
    expect(fieldDateToIso('nonsense')).toBe('');
    expect(fieldDateToIso('')).toBe('');
  });

  it('turns a local Date into a stored day', () => {
    expect(dateToIso(new Date(2027, 1, 3))).toBe('2027-02-03');
  });

  it('writes a day and a time the way people say them', () => {
    expect(shortDay('2027-02-23')).toBe('23 Feb 2027');
    expect(shortDay('bad')).toBe('');
    expect(clockLabel('18:30')).toBe('6:30 PM');
    expect(clockLabel('00:05')).toBe('12:05 AM');
    expect(clockLabel('12:00')).toBe('12:00 PM');
    expect(clockLabel('')).toBe('');
  });
});

describe('the WhatsApp number', () => {
  it('joins the country code and the number, dropping spaces and a leading zero', () => {
    expect(whatsappDigits('91', '98765 43210')).toBe('919876543210');
    expect(whatsappDigits('+44', '07911 123456')).toBe('447911123456');
    expect(whatsappDigits('91', '')).toBe('');
  });

  it('splits stored digits back by a known country code', () => {
    expect(splitWhatsapp('919876543210')).toEqual({ country: '91', phone: '9876543210' });
    expect(splitWhatsapp('447911123456')).toEqual({ country: '44', phone: '7911123456' });
    expect(splitWhatsapp('971501234567')).toEqual({ country: '971', phone: '501234567' });
    expect(splitWhatsapp('')).toEqual({ country: '91', phone: '' });
  });

  it('round-trips a number through the payload and back', () => {
    const payload = toInvitationPayload(wedding({ rsvpCountry: '44', rsvpPhone: '07911 123456' }));
    expect(splitWhatsapp(payload.rsvpWhatsapp)).toEqual({ country: '44', phone: '7911123456' });
  });
});

describe('checking each step', () => {
  it('needs both names for a couple and one for everyone else', () => {
    expect(detailsProblem(wedding({ nameTwo: '' }))).toBe('Add both names');
    expect(detailsProblem(wedding({ nameOne: ' ' }))).toBe('Add both names');
    expect(detailsProblem({ ...emptyInvitation('birthday'), date: '2027-02-23', venueName: 'Hall' })).toBe('Add the name');
    expect(detailsProblem({ ...emptyInvitation('birthday'), nameOne: 'Meera', date: '2027-02-23', venueName: 'Hall' })).toBeNull();
  });

  it('needs a day and a venue, and says which is missing', () => {
    expect(detailsProblem(wedding({ date: '' }))).toBe('Pick the day');
    expect(detailsProblem(wedding({ date: '2027-02-31' }))).toBe('Pick the day');
    expect(detailsProblem(wedding({ venueName: '  ' }))).toBe('Add the venue');
    expect(detailsProblem(wedding())).toBeNull();
  });

  it('ignores event rows with no name and only complains about too many', () => {
    const blankRows = Array.from({ length: 10 }, () => ({ title: '', date: '', time: '', venue: '' }));
    expect(planProblem(wedding({ events: blankRows }))).toBeNull();
    const many = Array.from({ length: MAX_INVITATION_EVENTS + 1 }, (_, i) => ({ title: `E${i}`, date: '', time: '', venue: '' }));
    expect(planProblem(wedding({ events: many }))).toBe('Add up to 6 events');
  });

  it('lets the reply details stay empty, but checks them when they are filled in', () => {
    expect(replyProblem(wedding())).toBeNull();
    expect(replyProblem(wedding({ rsvpPhone: '12' }))).toBe('Check the WhatsApp number, with the country code');
    expect(replyProblem(wedding({ rsvpPhone: '98765 43210' }))).toBeNull();
    expect(replyProblem(wedding({ rsvpBy: '2027-03-01' }))).toBe('The reply-by day should be before the day itself');
    expect(replyProblem(wedding({ rsvpBy: '2027-02-01' }))).toBeNull();
  });

  it('is ready only when every step is', () => {
    expect(invitationProblem(wedding())).toBeNull();
    expect(isInvitationReady(wedding())).toBe(true);
    expect(isInvitationReady(wedding({ venueName: '' }))).toBe(false);
    expect(isInvitationReady(null)).toBe(false);
  });
});

describe('what goes to the server', () => {
  it('tidies the names, drops empty events, defaults an event to the main day and sorts them', () => {
    const payload = toInvitationPayload(
      wedding({
        tagline: '  together   forever ',
        events: [
          { title: 'Wedding', date: '', time: '18:30', venue: 'Hall' },
          { title: '', date: '', time: '', venue: '' },
          { title: 'Mehendi', date: '2027-02-21', time: '16:00', venue: '' },
        ],
        rsvpPhone: '9876543210',
      }),
    );
    expect(payload.nameOne).toBe('Aarav');
    expect(payload.tagline).toBe('together forever');
    expect(payload.events.map((e) => e.title)).toEqual(['Mehendi', 'Wedding']);
    expect(payload.events[1]!.date).toBe('2027-02-23');
    expect(payload.rsvpWhatsapp).toBe('919876543210');
  });

  it('sends no second name and no blessing for an occasion that has neither', () => {
    const payload = toInvitationPayload({
      ...emptyInvitation('birthday'),
      nameOne: 'Meera',
      nameTwo: 'Someone',
      blessing: 'ganesh',
      date: '2027-02-23',
      venueName: 'Cafe',
    });
    expect(payload.nameTwo).toBe('');
    expect(payload.blessing).toBe('none');
  });

  it('keeps the blessing where it is offered', () => {
    expect(toInvitationPayload(wedding({ blessing: 'ganesh' })).blessing).toBe('ganesh');
  });

  it('caps long text at the limits the server enforces', () => {
    const payload = toInvitationPayload(wedding({ nameOne: 'a'.repeat(90), dressCode: 'd'.repeat(200), venueAddress: 'x'.repeat(400) }));
    expect(payload.nameOne).toHaveLength(36);
    expect(payload.dressCode).toHaveLength(60);
    expect(payload.venueAddress).toHaveLength(160);
  });

  it('never sends more than six events', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ title: `E${i}`, date: '', time: '', venue: '' }));
    expect(toInvitationPayload(wedding({ events: many })).events).toHaveLength(MAX_INVITATION_EVENTS);
  });
});

describe('editing a stored invitation', () => {
  it('rebuilds the form from what the server stored', () => {
    const stored = toInvitationPayload(
      wedding({
        blessing: 'ganesh',
        rsvpPhone: '9876543210',
        rsvpBy: '2027-02-01',
        events: [{ title: 'Sangeet', date: '2027-02-22', time: '19:30', venue: 'Hall' }],
      }),
    );
    const back = invitationFromStored(stored);
    expect(back).not.toBeNull();
    expect(back!.nameOne).toBe('Aarav');
    expect(back!.rsvpCountry).toBe('91');
    expect(back!.rsvpPhone).toBe('9876543210');
    expect(back!.events).toEqual([{ title: 'Sangeet', date: '2027-02-22', time: '19:30', venue: 'Hall' }]);
    // And it is the same invitation again once it is sent back.
    expect(toInvitationPayload(back!)).toEqual(stored);
  });

  it('gives nothing for something that is not an invitation', () => {
    expect(invitationFromStored(null)).toBeNull();
    expect(invitationFromStored('x')).toBeNull();
    expect(invitationFromStored({ occasion: 'funeral' })).toBeNull();
  });

  it('survives half-written data', () => {
    const back = invitationFromStored({ occasion: 'party', nameOne: 'Sam', events: [null, { title: 5 }] });
    expect(back!.nameOne).toBe('Sam');
    expect(back!.events).toHaveLength(2);
    expect(back!.events[0]).toEqual({ title: '', date: '', time: '', venue: '' });
  });
});

describe('the summary line and the card type', () => {
  it('summarises the occasion, the day and the number of events', () => {
    expect(
      invitationSummaryLine(
        wedding({ events: [{ title: 'A', date: '', time: '', venue: '' }, { title: 'B', date: '', time: '', venue: '' }, { title: '', date: '', time: '', venue: '' }] }),
      ),
    ).toBe('Wedding · 23 Feb 2027 · 2 events');
    expect(invitationSummaryLine(wedding())).toBe('Wedding · 23 Feb 2027');
  });

  it('knows invitation as a card type, with a label History can show', () => {
    expect(parseTemplateType('invitation')).toBe('invitation');
    expect(parseTemplateType('nonsense')).toBeNull();
    expect(parseTemplateType(5)).toBeNull();
    expect(templateLabel('invitation')).toBe('Invitation');
  });
});
