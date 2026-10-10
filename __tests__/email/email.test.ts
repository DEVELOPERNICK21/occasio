import { composeEmail } from '../../functions/src/email/compose';
import { emailConfigFromEnv, transactionalConfigFromEnv } from '../../functions/src/email/config';
import { EmailPolicyError, looksPromotional } from '../../functions/src/email/policy';
import {
  cardDeliveryEmail,
  subscriptionConfirmationEmail,
} from '../../functions/src/email/templates';
import * as fn from '../../functions/src/email/unsubscribe';
import * as site from '../../docs-site/src/lib/email/unsubscribe';
import {
  createResendEmailProvider,
  deliveryProviders,
} from '../../functions/src/autosend/providers';
import {
  receiptFromEvent,
  sendSubscriptionConfirmation,
} from '../../functions/src/subscriptionEmail';

const SECRET = 'unsubscribe-secret-of-at-least-32-characters!';
const ADDRESS = 'Occasio, 12 Example Street, Pune 411001, India';
const CONFIG = {
  apiKey: 're_test',
  from: 'Occasio <hello@example.com>',
  postalAddress: ADDRESS,
  unsubscribeSecret: SECRET,
  siteBase: 'https://occasio-greetings.vercel.app',
};

describe('unsubscribe tokens: functions and website agree', () => {
  it('produce the same key and the same token', () => {
    expect(fn.emailKey('  Mom@Example.com ')).toBe(site.emailKey('mom@example.com'));
    expect(fn.createUnsubscribeToken('Mom@Example.com', SECRET)).toBe(
      site.createUnsubscribeToken('mom@example.com', SECRET),
    );
  });

  it('a link made by the sender verifies on the website, and vice versa', () => {
    const token = fn.createUnsubscribeToken('a@b.co', SECRET);
    expect(site.verifyUnsubscribeToken(token, SECRET)).toBe(fn.emailKey('a@b.co'));
    expect(fn.verifyUnsubscribeToken(site.createUnsubscribeToken('a@b.co', SECRET), SECRET)).toBe(
      fn.emailKey('a@b.co'),
    );
  });

  it('rejects forged, edited and garbage tokens', () => {
    const token = fn.createUnsubscribeToken('a@b.co', SECRET);
    const [key, sig] = token.split('.') as [string, string];
    const otherKey = fn.emailKey('victim@b.co');
    expect(fn.verifyUnsubscribeToken(`${otherKey}.${sig}`, SECRET)).toBeNull();
    expect(fn.verifyUnsubscribeToken(`${key}.${sig}x`, SECRET)).toBeNull();
    expect(fn.verifyUnsubscribeToken(token, 'a-different-secret-that-is-32-chars-long!!')).toBeNull();
    for (const bad of ['', 'abc', 'a.b.c', null, undefined, 7, 'x'.repeat(300)]) {
      expect(fn.verifyUnsubscribeToken(bad, SECRET)).toBeNull();
    }
  });

  it('never puts the address in the token', () => {
    expect(fn.createUnsubscribeToken('mom@example.com', SECRET)).not.toContain('mom');
  });
});

describe('composeEmail enforces the CAN-SPAM requirements', () => {
  const optOut = {
    postalAddress: ADDRESS,
    unsubscribePageUrl: 'https://x.test/unsubscribe?t=T',
    unsubscribePostUrl: 'https://x.test/api/v1/email/unsubscribe?t=T',
    reason: 'You are getting this because someone sent you a card.',
  };
  const base = { from: 'a@x.test', to: 'b@y.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' };

  it.each(['delivery', 'marketing'] as const)(
    '%s emails carry the address, an unsubscribe link and both one-click headers',
    (kind) => {
      const mail = composeEmail({ ...base, kind, optOut });
      expect(mail.html).toContain('Pune 411001');
      expect(mail.html).toContain('https://x.test/unsubscribe?t=T');
      expect(mail.text).toContain('Pune 411001');
      expect(mail.text).toContain('https://x.test/unsubscribe?t=T');
      expect(mail.headers['List-Unsubscribe']).toBe('<https://x.test/api/v1/email/unsubscribe?t=T>');
      expect(mail.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    },
  );

  it.each(['delivery', 'marketing'] as const)('%s refuses to build without opt-out details', (kind) => {
    expect(() => composeEmail({ ...base, kind })).toThrow(EmailPolicyError);
    expect(() => composeEmail({ ...base, kind, optOut: { ...optOut, postalAddress: '  ' } })).toThrow(
      EmailPolicyError,
    );
    expect(() => composeEmail({ ...base, kind, optOut: { ...optOut, unsubscribePostUrl: '' } })).toThrow(
      EmailPolicyError,
    );
  });

  it('transactional emails stay clean: no footer, no opt-out headers', () => {
    const mail = composeEmail({ ...base, kind: 'transactional' });
    expect(mail.html).toBe(base.html);
    expect(mail.headers).toEqual({});
  });

  it('escapes the postal address in HTML', () => {
    const mail = composeEmail({
      ...base,
      kind: 'delivery',
      optOut: { ...optOut, postalAddress: 'A & B <script>' },
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('A &amp; B &lt;script&gt;');
  });
});

describe('email configuration fails closed', () => {
  const env = {
    RESEND_API_KEY: 're_x',
    OCCASIO_EMAIL_FROM: 'Occasio <hi@x.test>',
    OCCASIO_POSTAL_ADDRESS: ADDRESS,
    EMAIL_UNSUBSCRIBE_SECRET: SECRET,
  };

  it('is on only when everything the law needs is set', () => {
    expect(emailConfigFromEnv(env)).not.toBeNull();
    expect(emailConfigFromEnv({ ...env, OCCASIO_POSTAL_ADDRESS: '' })).toBeNull();
    expect(emailConfigFromEnv({ ...env, EMAIL_UNSUBSCRIBE_SECRET: 'short' })).toBeNull();
    expect(emailConfigFromEnv({ ...env, RESEND_API_KEY: undefined })).toBeNull();
  });

  it('transactional email needs only the sending account', () => {
    expect(transactionalConfigFromEnv({ RESEND_API_KEY: 'k', OCCASIO_EMAIL_FROM: 'f' })).not.toBeNull();
    expect(transactionalConfigFromEnv({ RESEND_API_KEY: 'k' })).toBeNull();
  });

  it('registers no email provider without a database or without config', () => {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    delete process.env.OCCASIO_MOCK_DELIVERY;
    delete process.env.FUNCTIONS_EMULATOR;
    try {
      expect(deliveryProviders()).toHaveLength(0);
      delete process.env.OCCASIO_POSTAL_ADDRESS;
      expect(deliveryProviders({} as FirebaseFirestore.Firestore)).toHaveLength(0);
    } finally {
      process.env = saved;
    }
  });
});

describe('card delivery email provider', () => {
  const input = { to: 'mom@example.com', shareUrl: 'https://s.test/c/abc', personName: 'Mom <b>', occasionType: 'birthday' };

  it('does not send to an unsubscribed address', async () => {
    const fetchImpl = jest.fn();
    const provider = createResendEmailProvider(CONFIG, async () => true, fetchImpl as never);
    await expect(provider.send(input)).resolves.toEqual({ ok: false, error: 'unsubscribed' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends with the footer, the address and one-click headers, and a working link', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: true }));
    const provider = createResendEmailProvider(CONFIG, async () => false, fetchImpl as never);
    await expect(provider.send(input)).resolves.toEqual({ ok: true });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(body.to).toEqual(['mom@example.com']);
    expect(body.html).toContain('Pune 411001');
    expect(body.html).toContain('Mom &lt;b&gt;');
    expect(body.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    const url = /<(https:[^>]+)>/.exec(body.headers['List-Unsubscribe'])![1]!;
    const token = new URL(url).searchParams.get('t');
    expect(site.verifyUnsubscribeToken(token, SECRET)).toBe(site.emailKey('mom@example.com'));
  });

  it('has no promotional wording', () => {
    const mail = cardDeliveryEmail(input);
    expect(looksPromotional(`${mail.subject} ${mail.text}`)).toBe(false);
  });
});

describe('subscription confirmation email', () => {
  const receipt = {
    productName: 'Occasio Pro',
    interval: 'yearly' as const,
    amount: '$79.98',
    renewsOn: new Date('2027-10-09T00:00:00Z'),
    isTrial: false,
    store: 'android' as const,
  };

  it('repeats the price, the renewal terms and how to cancel without emailing us', () => {
    const mail = subscriptionConfirmationEmail(receipt);
    expect(mail.text).toContain('$79.98');
    expect(mail.text).toContain('renews automatically every year');
    expect(mail.text).toContain('9 October 2027');
    expect(mail.text).toContain('Account → Cancel or manage subscription');
    expect(mail.text).toContain('Google Play');
    expect(mail.text).toContain('You do not need to email us');
  });

  it('explains a trial and when the first charge happens', () => {
    const mail = subscriptionConfirmationEmail({ ...receipt, isTrial: true, interval: 'monthly', store: 'ios' });
    expect(mail.subject).toMatch(/trial/);
    expect(mail.text).toMatch(/trial ends on 9 October 2027/);
    expect(mail.text).toContain('Apple ID');
  });

  it('stays transactional: nothing promotional in the template', () => {
    for (const r of [receipt, { ...receipt, isTrial: true }, { ...receipt, interval: null, amount: null, renewsOn: null }]) {
      const mail = subscriptionConfirmationEmail(r);
      expect(looksPromotional(`${mail.subject} ${mail.text}`)).toBe(false);
    }
  });
});

describe('receiptFromEvent and sendSubscriptionConfirmation', () => {
  const event = {
    id: 'evt_1',
    type: 'INITIAL_PURCHASE',
    product_id: 'occasio_pro:yearly',
    store: 'PLAY_STORE',
    currency: 'USD',
    price_in_purchased_currency: 79.98,
    period_type: 'NORMAL',
    expiration_at_ms: Date.parse('2027-10-09T00:00:00Z'),
  };

  it('is only for a new subscription, not renewals, cancellations or single wishes', () => {
    expect(receiptFromEvent(event)).toMatchObject({ interval: 'yearly', store: 'android', isTrial: false, amount: '$79.98' });
    expect(receiptFromEvent({ ...event, type: 'RENEWAL' })).toBeNull();
    expect(receiptFromEvent({ ...event, type: 'CANCELLATION' })).toBeNull();
    expect(receiptFromEvent({ ...event, product_id: 'occasio_wish_single' })).toBeNull();
    expect(receiptFromEvent({ ...event, period_type: 'TRIAL' })?.isTrial).toBe(true);
  });

  function setup() {
    const created = new Set<string>();
    const db = {
      collection: () => ({
        doc: (id: string) => ({
          create: async () => {
            if (created.has(id)) throw new Error('already exists');
            created.add(id);
          },
        }),
      }),
    } as unknown as FirebaseFirestore.Firestore;
    const auth = { getUser: jest.fn(async () => ({ email: 'user@example.com' })) } as never;
    return { db, auth };
  }

  it('sends once per webhook event even if RevenueCat retries', async () => {
    process.env.RESEND_API_KEY = 're_x';
    process.env.OCCASIO_EMAIL_FROM = 'Occasio <hi@x.test>';
    const { db, auth } = setup();
    const fetchImpl = jest.fn(async () => ({ ok: true }));
    await expect(sendSubscriptionConfirmation(db, auth, 'u1', event, fetchImpl as never)).resolves.toBe('sent');
    await expect(sendSubscriptionConfirmation(db, auth, 'u1', event, fetchImpl as never)).resolves.toBe('skipped');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(body.to).toEqual(['user@example.com']);
    expect(body.headers).toEqual({});
    delete process.env.RESEND_API_KEY;
    delete process.env.OCCASIO_EMAIL_FROM;
  });

  it('does nothing when email is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    const { db, auth } = setup();
    await expect(sendSubscriptionConfirmation(db, auth, 'u1', event, jest.fn() as never)).resolves.toBe('skipped');
  });
});

describe('looksPromotional', () => {
  it('catches sales language and ignores normal receipt wording', () => {
    for (const promo of ['Save 20% today', '30% off for you', 'Limited time offer', 'Upgrade now', 'Our newsletter', 'Use promo code X']) {
      expect(looksPromotional(promo)).toBe(true);
    }
    for (const fine of [
      'Your subscription renews yearly until you cancel.',
      'Your Occasio Pro free trial has started.',
      'Cancel any time in Account.',
    ]) {
      expect(looksPromotional(fine)).toBe(false);
    }
  });
});
