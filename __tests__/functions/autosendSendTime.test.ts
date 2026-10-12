import { dispatchScheduledSend } from '../../functions/src/autosend/dispatch';
import {
  applyDeliveryConsent,
  hasDeliverableChannel,
  type DeliveryProvider,
} from '../../functions/src/autosend/providers';
import type { SendTimeTier } from '../../functions/src/autosend/tier';

type Docs = Record<string, Record<string, unknown>>;

/** Just enough Firestore for dispatch: get, update, and a pass-through transaction. */
function fakeDb(docs: Docs): FirebaseFirestore.Firestore {
  const ref = (path: string) => ({
    path,
    get: async () => ({ exists: path in docs, data: () => docs[path] }),
    update: async (patch: Record<string, unknown>) => {
      docs[path] = { ...docs[path], ...patch };
    },
  });
  return {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        get: (r: { get: () => Promise<unknown> }) => r.get(),
        update: (r: { update: (p: unknown) => Promise<void> }, p: unknown) => r.update(p),
      }),
  } as unknown as FirebaseFirestore.Firestore;
}

function emailProvider(sent: string[]): DeliveryProvider {
  return {
    channel: 'email',
    send: async (input) => {
      sent.push(input.to);
      return { ok: true };
    },
  };
}

const messaging = {} as never;

function seed(consent: unknown): Docs {
  return {
    'scheduled_sends/s1': {
      userId: 'u1',
      relationshipId: 'r1',
      status: 'approved',
      shareUrl: 'https://example.com/c/abc',
      personName: 'Mom',
      occasionType: 'birthday',
    },
    'relationships/r1': {
      contactChannel: { email: 'mom@example.com' },
      deliveryConsent: consent,
    },
  };
}

describe('send-time checks', () => {
  const original = process.env.OCCASIO_AUTOSEND_DISPATCH;
  beforeAll(() => {
    process.env.OCCASIO_AUTOSEND_DISPATCH = 'true';
  });
  afterAll(() => {
    if (original === undefined) delete process.env.OCCASIO_AUTOSEND_DISPATCH;
    else process.env.OCCASIO_AUTOSEND_DISPATCH = original;
  });

  const tier = (value: SendTimeTier) => async () => value;

  it('cancels and sends nothing when the subscription has lapsed', async () => {
    const docs = seed({ email: true });
    const sent: string[] = [];
    const result = await dispatchScheduledSend(
      fakeDb(docs),
      messaging,
      's1',
      [emailProvider(sent)],
      tier('lapsed'),
    );

    expect(result.status).toBe('cancelled');
    expect(result.lastError).toBe('subscription_inactive');
    expect(docs['scheduled_sends/s1']?.status).toBe('cancelled');
    expect(sent).toEqual([]);
  });

  it('waits and sends nothing when the plan cannot be checked', async () => {
    const docs = seed({ email: true });
    const sent: string[] = [];
    const result = await dispatchScheduledSend(
      fakeDb(docs),
      messaging,
      's1',
      [emailProvider(sent)],
      tier('unknown'),
    );

    expect(result.status).toBe('approved');
    expect(result.lastError).toBe('billing_unavailable');
    expect(docs['scheduled_sends/s1']?.dispatchAttempts).toBeUndefined();
    expect(sent).toEqual([]);
  });

  it('emails the card for an active subscriber with consent', async () => {
    const docs = seed({ email: true });
    const sent: string[] = [];
    const result = await dispatchScheduledSend(
      fakeDb(docs),
      messaging,
      's1',
      [emailProvider(sent)],
      tier('paid'),
    );

    expect(result.status).toBe('sent');
    expect(result.deliveryChannelUsed).toBe('email');
    expect(sent).toEqual(['mom@example.com']);
  });

  it('leaves the card for the owner to share when there is no consent', async () => {
    const docs = seed(undefined);
    const sent: string[] = [];
    const result = await dispatchScheduledSend(
      fakeDb(docs),
      messaging,
      's1',
      [emailProvider(sent)],
      tier('paid'),
    );

    expect(result.status).toBe('approved');
    expect(docs['scheduled_sends/s1']?.manual).toBe(true);
    expect(sent).toEqual([]);
  });
});

describe('delivery consent', () => {
  const destinations = { whatsapp: '+911', sms: '+911', email: 'a@b.co' };

  it('only keeps channels the person agreed to', () => {
    expect(applyDeliveryConsent(destinations, { email: true })).toEqual({
      whatsapp: '',
      sms: '',
      email: 'a@b.co',
    });
    expect(applyDeliveryConsent(destinations, undefined)).toEqual({
      whatsapp: '',
      sms: '',
      email: '',
    });
    expect(applyDeliveryConsent(destinations, { email: 'yes' }).email).toBe('');
  });

  it('is deliverable only when a provider has a consented destination', () => {
    const provider = emailProvider([]);
    expect(hasDeliverableChannel([provider], { ...destinations })).toBe(true);
    expect(hasDeliverableChannel([provider], { ...destinations, email: '' })).toBe(false);
    expect(hasDeliverableChannel([], destinations)).toBe(false);
  });
});
