import { attemptChannels } from '../../functions/src/autosend/dispatch';
import {
  channelDestinations,
  createMockProvider,
  mockDeliveryProviders,
  mockFailChannels,
} from '../../functions/src/autosend/providers';
import {
  hasCreationPhotos,
  isAutosendDispatchEnabled,
  isReviewExpired,
  shouldAutoDispatchOnDeadline,
} from '../../functions/src/autosend/types';

describe('autosend deadline rules', () => {
  it('auto-dispatches only with photos after deadline', () => {
    expect(shouldAutoDispatchOnDeadline(true, true)).toBe('dispatch');
    expect(shouldAutoDispatchOnDeadline(false, true)).toBe('incomplete_pack');
    expect(shouldAutoDispatchOnDeadline(true, false)).toBe('wait');
  });

  it('treats missing deadline as not expired', () => {
    const now = new Date('2026-09-13T12:00:00.000Z');
    expect(isReviewExpired(null, now)).toBe(false);
    expect(isReviewExpired(new Date('2026-09-13T11:59:59.000Z'), now)).toBe(
      true,
    );
    expect(isReviewExpired(new Date('2026-09-13T12:00:00.000Z'), now)).toBe(
      false,
    );
  });

  it('requires a photoRef or mediaUrl', () => {
    expect(hasCreationPhotos(['p1'], [])).toBe(true);
    expect(hasCreationPhotos([], ['https://cdn/x.jpg'])).toBe(true);
    expect(hasCreationPhotos([], [])).toBe(false);
    expect(hasCreationPhotos([''], [])).toBe(false);
  });
});

describe('OCCASIO_AUTOSEND_DISPATCH', () => {
  const original = process.env.OCCASIO_AUTOSEND_DISPATCH;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.OCCASIO_AUTOSEND_DISPATCH;
    } else {
      process.env.OCCASIO_AUTOSEND_DISPATCH = original;
    }
  });

  it('is off unless the env value is exactly true', () => {
    delete process.env.OCCASIO_AUTOSEND_DISPATCH;
    expect(isAutosendDispatchEnabled()).toBe(false);
    process.env.OCCASIO_AUTOSEND_DISPATCH = '1';
    expect(isAutosendDispatchEnabled()).toBe(false);
    process.env.OCCASIO_AUTOSEND_DISPATCH = 'true';
    expect(isAutosendDispatchEnabled()).toBe(true);
  });
});

describe('mock delivery providers', () => {
  const original = process.env.OCCASIO_MOCK_DELIVERY_FAIL;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    if (original === undefined) {
      delete process.env.OCCASIO_MOCK_DELIVERY_FAIL;
    } else {
      process.env.OCCASIO_MOCK_DELIVERY_FAIL = original;
    }
  });

  it('parses OCCASIO_MOCK_DELIVERY_FAIL', () => {
    expect(mockFailChannels(undefined).size).toBe(0);
    expect([...mockFailChannels('whatsapp,sms')]).toEqual([
      'whatsapp',
      'sms',
    ]);
  });

  it('succeeds unless the channel is in the fail list', async () => {
    process.env.OCCASIO_MOCK_DELIVERY_FAIL = 'whatsapp,sms';
    const wa = createMockProvider('whatsapp');
    const email = createMockProvider('email');
    const payload = {
      to: '+9198',
      shareUrl: 'https://occasio.app/c/x',
      personName: 'Mom',
      occasionType: 'birthday',
    };
    expect(await wa.send(payload)).toEqual({ ok: false, error: 'mock_fail' });
    expect(await email.send(payload)).toEqual({ ok: true });
  });

  it('uses whatsapp number for SMS when phone is missing', () => {
    expect(
      channelDestinations({ whatsapp: '+919876543210', email: 'a@b.c' }),
    ).toEqual({
      whatsapp: '+919876543210',
      sms: '+919876543210',
      email: 'a@b.c',
    });
  });

  it('falls through whatsapp → sms → email on mock fail', async () => {
    process.env.OCCASIO_MOCK_DELIVERY_FAIL = 'whatsapp,sms';
    const result = await attemptChannels(
      mockDeliveryProviders(),
      channelDestinations({
        whatsapp: '+9198',
        email: 'mom@example.com',
      }),
      {
        shareUrl: 'https://occasio.app/c/x',
        personName: 'Mom',
        occasionType: 'birthday',
      },
    );
    expect(result).toEqual({
      used: 'email',
      attempted: ['whatsapp', 'sms', 'email'],
      lastError: null,
    });
  });

  it('fails when every channel is missing or mocked to fail', async () => {
    process.env.OCCASIO_MOCK_DELIVERY_FAIL = 'email';
    const result = await attemptChannels(
      mockDeliveryProviders(),
      channelDestinations({ email: 'mom@example.com' }),
      {
        shareUrl: 'https://occasio.app/c/x',
        personName: 'Mom',
        occasionType: 'birthday',
      },
    );
    expect(result.used).toBeNull();
    expect(result.attempted).toEqual(['whatsapp', 'sms', 'email']);
    expect(result.lastError).toBe('mock_fail');
  });
});
