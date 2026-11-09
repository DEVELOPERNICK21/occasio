import { createHmac } from 'node:crypto';
import { attemptChannels } from '../../functions/src/autosend/dispatch';
import {
  applyDeliveryConsent,
  channelDestinations,
  createMockProvider,
} from '../../functions/src/autosend/providers';
import {
  WHATSAPP_YEARLY_CAP,
  classifyGraphError,
  createWhatsAppCloudProvider,
  handleWhatsAppWebhook,
  isOptOutText,
  optOutKey,
  optOutNumbersFrom,
  slugFromShareUrl,
  templateParam,
  verifyMetaSignature,
  whatsappConfigFromEnv,
  whatsappDigits,
  type RawBodyRequest,
  type WhatsAppConfig,
  type WhatsAppOptOuts,
  type WhatsAppUsage,
} from '../../functions/src/autosend/whatsapp';

const config: WhatsAppConfig = {
  accessToken: 'test-token',
  phoneNumberId: '1234567890',
  templateName: 'occasio_wish_delivery',
  languageCode: 'en',
  apiVersion: 'v23.0',
  yearlyCap: 3,
};

const input = {
  to: '+91 98765 43210',
  shareUrl: 'https://occasio-greetings.vercel.app/c/abc-123_XYZ',
  personName: 'Priya',
  occasionType: 'birthday',
  userId: 'user-1',
  fromName: 'Aarav',
};

function memoryUsage(start: Record<string, number> = {}): WhatsAppUsage & { counts: Record<string, number> } {
  const counts = { ...start };
  return {
    counts,
    async count(uid, year) {
      return counts[`${uid}_${year}`] ?? 0;
    },
    async record(uid, year) {
      counts[`${uid}_${year}`] = (counts[`${uid}_${year}`] ?? 0) + 1;
    },
  };
}

function memoryOptOuts(blocked: string[] = []): WhatsAppOptOuts & { added: string[] } {
  const added: string[] = [];
  return {
    added,
    async has(digits) {
      return blocked.includes(digits) || added.includes(digits);
    },
    async add(digits) {
      added.push(digits);
    },
  };
}

function reply(ok: boolean, status: number, body: unknown) {
  return jest.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response);
}

const accepted = { messages: [{ id: 'wamid.ABC' }] };
const noon2026 = () => new Date('2026-11-04T06:30:00.000Z');

describe('whatsappConfigFromEnv', () => {
  it('is off unless both the token and the sending number are set', () => {
    expect(whatsappConfigFromEnv({})).toBeNull();
    expect(whatsappConfigFromEnv({ WHATSAPP_ACCESS_TOKEN: 'x' })).toBeNull();
    expect(whatsappConfigFromEnv({ WHATSAPP_PHONE_NUMBER_ID: '1234567890' })).toBeNull();
    expect(
      whatsappConfigFromEnv({ WHATSAPP_ACCESS_TOKEN: 'x', WHATSAPP_PHONE_NUMBER_ID: 'not-a-number' }),
    ).toBeNull();
  });

  it('fills in the template, language, version and the 100-a-year cap', () => {
    expect(
      whatsappConfigFromEnv({ WHATSAPP_ACCESS_TOKEN: ' tok ', WHATSAPP_PHONE_NUMBER_ID: '1234567890' }),
    ).toEqual({
      accessToken: 'tok',
      phoneNumberId: '1234567890',
      templateName: 'occasio_wish_delivery',
      languageCode: 'en',
      apiVersion: 'v23.0',
      yearlyCap: WHATSAPP_YEARLY_CAP,
    });
    expect(WHATSAPP_YEARLY_CAP).toBe(100);
  });

  it('takes overrides, and ignores a nonsense version or cap', () => {
    const base = { WHATSAPP_ACCESS_TOKEN: 'x', WHATSAPP_PHONE_NUMBER_ID: '1234567890' };
    expect(
      whatsappConfigFromEnv({
        ...base,
        WHATSAPP_TEMPLATE_NAME: 'my_template',
        WHATSAPP_TEMPLATE_LANGUAGE: 'en_IN',
        WHATSAPP_API_VERSION: 'v24.0',
        WHATSAPP_YEARLY_CAP: '40',
      }),
    ).toMatchObject({ templateName: 'my_template', languageCode: 'en_IN', apiVersion: 'v24.0', yearlyCap: 40 });
    expect(
      whatsappConfigFromEnv({ ...base, WHATSAPP_API_VERSION: 'latest', WHATSAPP_YEARLY_CAP: '-5' }),
    ).toMatchObject({ apiVersion: 'v23.0', yearlyCap: 100 });
  });
});

describe('small helpers', () => {
  it('turns a number into the digits the API wants', () => {
    expect(whatsappDigits('+91 98765-43210')).toBe('919876543210');
    expect(whatsappDigits('12')).toBeNull();
    expect(whatsappDigits('not a number')).toBeNull();
  });

  it('takes only the slug of a card link', () => {
    expect(slugFromShareUrl('https://occasio-greetings.vercel.app/c/abc-123_XYZ')).toBe('abc-123_XYZ');
    expect(slugFromShareUrl('https://occasio-greetings.vercel.app/c/abc/')).toBe('abc');
    expect(slugFromShareUrl('https://occasio-greetings.vercel.app/other/abc')).toBeNull();
    expect(slugFromShareUrl('https://x.test/c/a b')).toBeNull();
    expect(slugFromShareUrl('nonsense')).toBeNull();
    expect(slugFromShareUrl(null)).toBeNull();
  });

  it('keeps a template variable to one plain line', () => {
    expect(templateParam('  Priya \n\t  Sharma  ', 'there')).toBe('Priya Sharma');
    expect(templateParam('', 'there')).toBe('there');
    expect(templateParam(null, 'A friend')).toBe('A friend');
    expect(templateParam('x'.repeat(200), 'there')).toHaveLength(60);
  });

  it('names the reasons Meta refuses a message', () => {
    expect(classifyGraphError(400, { error: { code: 131026 } })).toBe('whatsapp_not_on_whatsapp');
    expect(classifyGraphError(400, { error: { code: 131049 } })).toBe('whatsapp_not_delivered');
    expect(classifyGraphError(429, { error: { code: 130429 } })).toBe('whatsapp_rate_limited');
    expect(classifyGraphError(400, { error: { code: 132001 } })).toBe('whatsapp_template');
    expect(classifyGraphError(401, { error: { code: 190 } })).toBe('whatsapp_auth');
    expect(classifyGraphError(500, null)).toBe('whatsapp_500');
  });
});

describe('createWhatsAppCloudProvider', () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('sends the approved template to the number, with the names and a button that carries the card slug', async () => {
    const fetchImpl = reply(true, 200, accepted);
    const usage = memoryUsage();
    const provider = createWhatsAppCloudProvider(config, usage, memoryOptOuts(), fetchImpl, noon2026);

    expect(provider.channel).toBe('whatsapp');
    expect(await provider.send(input)).toEqual({ ok: true });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v23.0/1234567890/messages');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'template',
      template: {
        name: 'occasio_wish_delivery',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Priya' },
              { type: 'text', text: 'Aarav' },
              { type: 'text', text: 'birthday' },
            ],
          },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: 'abc-123_XYZ' }] },
        ],
      },
    });
  });

  it('says "anniversary" for an anniversary and "A friend" when there is no sender name', async () => {
    const fetchImpl = reply(true, 200, accepted);
    const provider = createWhatsAppCloudProvider(config, memoryUsage(), memoryOptOuts(), fetchImpl, noon2026);
    await provider.send({ ...input, occasionType: 'anniversary', fromName: null });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual([
      'Priya',
      'A friend',
      'anniversary',
    ]);
  });

  it('counts the wish against the user for this calendar year (IST)', async () => {
    const usage = memoryUsage();
    const provider = createWhatsAppCloudProvider(config, usage, memoryOptOuts(), reply(true, 200, accepted), noon2026);
    await provider.send(input);
    expect(usage.counts).toEqual({ 'user-1_2026': 1 });
  });

  it('stops at the yearly cap without calling Meta, so email can take over', async () => {
    const fetchImpl = reply(true, 200, accepted);
    const usage = memoryUsage({ 'user-1_2026': 3 });
    const provider = createWhatsAppCloudProvider(config, usage, memoryOptOuts(), fetchImpl, noon2026);
    expect(await provider.send(input)).toEqual({ ok: false, error: 'whatsapp_yearly_cap' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(usage.counts['user-1_2026']).toBe(3);
  });

  it('starts a fresh count in the new year', async () => {
    const usage = memoryUsage({ 'user-1_2026': 3 });
    const provider = createWhatsAppCloudProvider(
      config,
      usage,
      memoryOptOuts(),
      reply(true, 200, accepted),
      () => new Date('2027-01-02T06:30:00.000Z'),
    );
    expect(await provider.send(input)).toEqual({ ok: true });
    expect(usage.counts['user-1_2027']).toBe(1);
  });

  it('never writes to a number that replied STOP', async () => {
    const fetchImpl = reply(true, 200, accepted);
    const provider = createWhatsAppCloudProvider(
      config,
      memoryUsage(),
      memoryOptOuts(['919876543210']),
      fetchImpl,
      noon2026,
    );
    expect(await provider.send(input)).toEqual({ ok: false, error: 'whatsapp_opted_out' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses what it cannot count or address', async () => {
    const fetchImpl = reply(true, 200, accepted);
    const provider = createWhatsAppCloudProvider(config, memoryUsage(), memoryOptOuts(), fetchImpl, noon2026);
    expect(await provider.send({ ...input, userId: undefined })).toEqual({ ok: false, error: 'whatsapp_no_owner' });
    expect(await provider.send({ ...input, to: 'abc' })).toEqual({ ok: false, error: 'whatsapp_bad_number' });
    expect(await provider.send({ ...input, shareUrl: 'https://x.test/nope' })).toEqual({
      ok: false,
      error: 'whatsapp_bad_share_url',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports why Meta refused, and does not count a wish that was not sent', async () => {
    const usage = memoryUsage();
    const provider = createWhatsAppCloudProvider(
      config,
      usage,
      memoryOptOuts(),
      reply(false, 400, { error: { code: 131026, message: 'Message undeliverable' } }),
      noon2026,
    );
    expect(await provider.send(input)).toEqual({ ok: false, error: 'whatsapp_not_on_whatsapp' });
    expect(usage.counts).toEqual({});
  });

  it('does not log the number or the token when it fails', async () => {
    const provider = createWhatsAppCloudProvider(
      config,
      memoryUsage(),
      memoryOptOuts(),
      reply(false, 401, { error: { code: 190 } }),
      noon2026,
    );
    await provider.send(input);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain('919876543210');
    expect(logged).not.toContain('test-token');
  });

  it('is a failure when Meta answers without a message id, and when the network fails', async () => {
    const empty = createWhatsAppCloudProvider(config, memoryUsage(), memoryOptOuts(), reply(true, 200, {}), noon2026);
    expect(await empty.send(input)).toEqual({ ok: false, error: 'whatsapp_no_message_id' });

    const down = createWhatsAppCloudProvider(
      config,
      memoryUsage(),
      memoryOptOuts(),
      jest.fn(async () => {
        throw new Error('offline');
      }),
      noon2026,
    );
    expect(await down.send(input)).toEqual({ ok: false, error: 'whatsapp_network' });
  });

  it('still reports success when the count cannot be written, so the wish is not sent twice', async () => {
    const usage: WhatsAppUsage = {
      count: async () => 0,
      record: async () => {
        throw new Error('firestore down');
      },
    };
    const provider = createWhatsAppCloudProvider(config, usage, memoryOptOuts(), reply(true, 200, accepted), noon2026);
    expect(await provider.send(input)).toEqual({ ok: true });
  });
});

describe('WhatsApp in the channel order', () => {
  it('falls through to email when WhatsApp cannot deliver', async () => {
    const whatsapp = createWhatsAppCloudProvider(
      config,
      memoryUsage(),
      memoryOptOuts(),
      reply(false, 400, { error: { code: 131026 } }),
      noon2026,
    );
    const email = createMockProvider('email');
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await attemptChannels(
      [whatsapp, email],
      { whatsapp: '+919876543210', sms: '', email: 'priya@example.com' },
      { shareUrl: input.shareUrl, personName: 'Priya', occasionType: 'birthday', userId: 'user-1', fromName: 'Aarav' },
    );
    info.mockRestore();
    err.mockRestore();
    expect(result).toEqual({ used: 'email', attempted: ['whatsapp', 'email'], lastError: null });
  });

  it('only uses WhatsApp for a person who agreed to it', () => {
    const destinations = channelDestinations({ whatsapp: '+919876543210', email: 'priya@example.com' });
    expect(applyDeliveryConsent(destinations, { email: true }).whatsapp).toBe('');
    expect(applyDeliveryConsent(destinations, { whatsapp: true }).whatsapp).toBe('+919876543210');
    expect(applyDeliveryConsent(destinations, undefined).whatsapp).toBe('');
  });
});

describe('STOP and the webhook', () => {
  const secret = 'app-secret';
  const delivery = (text: string, from = '919876543210') => ({
    entry: [{ changes: [{ value: { messages: [{ from, type: 'text', text: { body: text } }] } }] }],
  });

  function sign(raw: Buffer) {
    return `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
  }

  function response() {
    const res = {
      statusCode: 0,
      payload: undefined as unknown,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(value: unknown) {
        res.payload = value;
        return res;
      },
      type() {
        return res;
      },
      send(value: unknown) {
        res.payload = value;
        return res;
      },
    };
    return res;
  }

  function post(body: unknown, header?: string, rawOverride?: Buffer) {
    const raw = rawOverride ?? Buffer.from(JSON.stringify(body));
    return {
      method: 'POST',
      body,
      rawBody: raw,
      query: {},
      header: (name: string) => (name.toLowerCase() === 'x-hub-signature-256' ? header : undefined),
    } as unknown as RawBodyRequest;
  }

  it('reads STOP in the usual ways and nothing else', () => {
    for (const word of ['STOP', 'stop', ' Stop. ', 'unsubscribe', 'Stop all', 'opt out', 'optout', 'cancel']) {
      expect(isOptOutText(word)).toBe(true);
    }
    for (const text of ['thanks!', 'please do not stop', 'stop it, I love it', '']) {
      expect(isOptOutText(text)).toBe(false);
    }
  });

  it('finds the numbers that asked to stop in a delivery', () => {
    expect(optOutNumbersFrom(delivery('STOP'))).toEqual(['919876543210']);
    expect(optOutNumbersFrom(delivery('Thank you!'))).toEqual([]);
    expect(optOutNumbersFrom(delivery('stop', 'not-a-number'))).toEqual([]);
    expect(optOutNumbersFrom(null)).toEqual([]);
    expect(optOutNumbersFrom({ entry: [{ changes: [{ value: {} }] }] })).toEqual([]);
  });

  it('keeps an opt-out as a hash, not a number', () => {
    expect(optOutKey('919876543210')).toMatch(/^[0-9a-f]{64}$/);
    expect(optOutKey('919876543210')).not.toContain('9198765');
  });

  it('only believes a delivery Meta signed', () => {
    const raw = Buffer.from('{"a":1}');
    expect(verifyMetaSignature(raw, sign(raw), secret)).toBe(true);
    expect(verifyMetaSignature(raw, sign(Buffer.from('{"a":2}')), secret)).toBe(false);
    expect(verifyMetaSignature(raw, 'sha256=' + 'a'.repeat(64), secret)).toBe(false);
    expect(verifyMetaSignature(raw, undefined, secret)).toBe(false);
    expect(verifyMetaSignature(undefined, sign(raw), secret)).toBe(false);
  });

  it('records a STOP from a signed delivery', async () => {
    const optOuts = memoryOptOuts();
    const body = delivery('STOP');
    const req = post(body, sign(Buffer.from(JSON.stringify(body))));
    const res = response();
    await handleWhatsAppWebhook(req, res as never, optOuts, { WHATSAPP_APP_SECRET: secret });
    expect(res.statusCode).toBe(200);
    expect(optOuts.added).toEqual(['919876543210']);
  });

  it('records nothing from an unsigned or wrongly signed delivery, or when it is not configured', async () => {
    const optOuts = memoryOptOuts();
    const body = delivery('STOP');

    const unsigned = response();
    await handleWhatsAppWebhook(post(body), unsigned as never, optOuts, { WHATSAPP_APP_SECRET: secret });
    expect(unsigned.statusCode).toBe(401);

    const wrong = response();
    await handleWhatsAppWebhook(post(body, 'sha256=' + 'b'.repeat(64)), wrong as never, optOuts, {
      WHATSAPP_APP_SECRET: secret,
    });
    expect(wrong.statusCode).toBe(401);

    const unconfigured = response();
    await handleWhatsAppWebhook(post(body, sign(Buffer.from(JSON.stringify(body)))), unconfigured as never, optOuts, {});
    expect(unconfigured.statusCode).toBe(503);

    expect(optOuts.added).toEqual([]);
  });

  it('answers Meta\'s one-time address check only with the right token', async () => {
    const get = (query: Record<string, string>) =>
      ({ method: 'GET', query, header: () => undefined }) as unknown as RawBodyRequest;
    const env = { WHATSAPP_VERIFY_TOKEN: 'verify-me' };

    const ok = response();
    await handleWhatsAppWebhook(
      get({ 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '12345' }),
      ok as never,
      memoryOptOuts(),
      env,
    );
    expect(ok.statusCode).toBe(200);
    expect(ok.payload).toBe('12345');

    const bad = response();
    await handleWhatsAppWebhook(
      get({ 'hub.mode': 'subscribe', 'hub.verify_token': 'guess', 'hub.challenge': '12345' }),
      bad as never,
      memoryOptOuts(),
      env,
    );
    expect(bad.statusCode).toBe(403);

    const unset = response();
    await handleWhatsAppWebhook(
      get({ 'hub.mode': 'subscribe', 'hub.verify_token': '', 'hub.challenge': '12345' }),
      unset as never,
      memoryOptOuts(),
      {},
    );
    expect(unset.statusCode).toBe(403);
  });
});
