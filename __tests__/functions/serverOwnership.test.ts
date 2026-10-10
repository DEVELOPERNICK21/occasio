import { billingStateFromSubscriber } from '../../functions/src/billing';
import { matchesMonthDay } from '../../functions/src/autosend/dates';
import { resolveAutoSendContent } from '../../functions/src/autosend/content';

describe('billingStateFromSubscriber', () => {
  const now = new Date('2026-10-01T00:00:00Z');

  it('grants personal only while occasio_pro is unexpired', () => {
    expect(
      billingStateFromSubscriber(
        { entitlements: { occasio_pro: { expires_date: '2026-12-01T00:00:00Z' } } },
        now,
      ).tier,
    ).toBe('personal');
    expect(
      billingStateFromSubscriber(
        { entitlements: { occasio_pro: { expires_date: '2026-09-01T00:00:00Z' } } },
        now,
      ).tier,
    ).toBe('free');
    expect(billingStateFromSubscriber({}, now).tier).toBe('free');
  });

  it('treats a null expiry as lifetime', () => {
    expect(
      billingStateFromSubscriber(
        { entitlements: { occasio_pro: { expires_date: null } } },
        now,
      ).tier,
    ).toBe('personal');
  });

  it('counts single-wish purchases across both product ids', () => {
    const state = billingStateFromSubscriber(
      {
        non_subscriptions: {
          occasio_wish_single: [{}, {}],
          single_wish: [{}],
          other: [{}],
        },
      },
      now,
    );
    expect(state.creditsPurchased).toBe(3);
  });
});

describe('Feb 29 birthdays', () => {
  const leapDay = { month: 2, day: 29 };
  it('fire on Feb 28 in non-leap years only', () => {
    expect(matchesMonthDay(leapDay, { month: 2, day: 28, year: 2027 })).toBe(true);
    expect(matchesMonthDay(leapDay, { month: 2, day: 28, year: 2028 })).toBe(false);
    expect(matchesMonthDay(leapDay, { month: 2, day: 29, year: 2028 })).toBe(true);
  });
});

describe('auto-send media', () => {
  it('borrows display urls when the pack only holds inline refs', () => {
    const content = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 'B01',
        photoRefs: ['inline:0'],
        defaultMessage: 'Hi',
        fromName: null,
      },
      lastCreation: {
        templateType: 'birthday',
        templateId: 'B01',
        photoRefs: ['inline:0'],
        mediaUrls: ['data:image/jpeg;base64,AAA'],
        message: 'Hi',
        fromName: null,
      },
    });
    expect(content.source).toBe('pack');
    expect(content.mediaUrls).toEqual(['data:image/jpeg;base64,AAA']);
  });
});

describe('Resend email provider', () => {
  const { createResendEmailProvider, deliveryProviders } = require('../../functions/src/autosend/providers');
  const input = { to: 'mom@example.com', shareUrl: 'https://x/c/abc', personName: '<b>Mom</b>', occasionType: 'birthday' };
  const config = {
    apiKey: 'key',
    from: 'Occasio <hi@occasio.app>',
    postalAddress: 'Occasio, 12 Example St, Pune, India',
    unsubscribeSecret: 'a-secret-that-is-at-least-32-characters-long',
    siteBase: 'https://occasio-greetings.vercel.app',
  };
  const notSuppressed = async () => false;

  it('posts to Resend with bearer auth and escapes the name', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200 }));
    const result = await createResendEmailProvider(config, notSuppressed, fetchMock).send(input);
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer key');
    const sent = JSON.parse(init.body) as { html: string; text: string };
    expect(sent.html).toContain('&lt;b&gt;Mom');
    expect(sent.html).not.toContain('<b>Mom');
    // The plain-text part is not HTML, so the name is left as typed there.
    expect(sent.text).toContain('Mom');
  });

  it('reports upstream failure instead of pretending it sent', async () => {
    const failing = jest.fn(async () => ({ ok: false, status: 403 }));
    expect(await createResendEmailProvider(config, notSuppressed, failing).send(input)).toEqual({
      ok: false,
      error: 'resend_403',
    });
  });

  it('has no providers in production until keys are set', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.OCCASIO_EMAIL_FROM;
    delete process.env.OCCASIO_POSTAL_ADDRESS;
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET;
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.OCCASIO_MOCK_DELIVERY;
    expect(deliveryProviders()).toEqual([]);
  });
});
