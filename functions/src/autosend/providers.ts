import type { DeliveryChannel } from './types';

export type DeliverySendInput = {
  to: string;
  shareUrl: string;
  personName: string;
  occasionType: string;
};

export interface DeliveryProvider {
  channel: DeliveryChannel;
  send(
    input: DeliverySendInput,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
}

export function mockFailChannels(
  raw: string | undefined = process.env.OCCASIO_MOCK_DELIVERY_FAIL,
): Set<DeliveryChannel> {
  const fail = new Set<DeliveryChannel>();
  if (!raw) {
    return fail;
  }
  for (const part of raw.split(',')) {
    const channel = part.trim().toLowerCase();
    if (channel === 'whatsapp' || channel === 'sms' || channel === 'email') {
      fail.add(channel);
    }
  }
  return fail;
}

export function createMockProvider(channel: DeliveryChannel): DeliveryProvider {
  return {
    channel,
    async send(input) {
      const fail = mockFailChannels().has(channel);
      console.info('autosend mock delivery', {
        channel,
        to: input.to,
        shareUrl: input.shareUrl,
        personName: input.personName,
        occasionType: input.occasionType,
        ok: !fail,
      });
      if (fail) {
        return { ok: false, error: 'mock_fail' };
      }
      return { ok: true };
    },
  };
}

export function mockDeliveryProviders(): DeliveryProvider[] {
  return [
    createMockProvider('whatsapp'),
    createMockProvider('sms'),
    createMockProvider('email'),
  ];
}

export function channelDestinations(contact: {
  whatsapp?: unknown;
  phone?: unknown;
  email?: unknown;
}): Record<DeliveryChannel, string> {
  const whatsapp = asNonEmptyString(contact.whatsapp);
  const phone = asNonEmptyString(contact.phone);
  return {
    whatsapp,
    sms: phone || whatsapp,
    email: asNonEmptyString(contact.email),
  };
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
