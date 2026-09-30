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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Email via Resend (https://resend.com). Enabled when RESEND_API_KEY + OCCASIO_EMAIL_FROM are set. */
export function createResendEmailProvider(
  apiKey: string,
  from: string,
): DeliveryProvider {
  return {
    channel: 'email',
    async send(input) {
      const occasion = input.occasionType === 'anniversary' ? 'anniversary' : 'birthday';
      const name = escapeHtml(input.personName || 'there');
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [input.to],
            subject: `Someone made you a ${occasion} surprise`,
            html:
              `<p>Hi ${name},</p>` +
              `<p>Someone who cares about you made a little ${occasion} surprise. Tap to open it:</p>` +
              `<p><a href="${escapeHtml(input.shareUrl)}">Open your surprise</a></p>`,
          }),
        });
        if (!res.ok) {
          return { ok: false, error: `resend_${res.status}` };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'resend_network' };
      }
    },
  };
}

/**
 * Real providers configured from env. Mock providers are only used in the
 * emulator or when OCCASIO_MOCK_DELIVERY=true, so production can never mark a
 * send as delivered without actually delivering it.
 */
export function deliveryProviders(): DeliveryProvider[] {
  if (
    process.env.OCCASIO_MOCK_DELIVERY === 'true' ||
    process.env.FUNCTIONS_EMULATOR === 'true'
  ) {
    return mockDeliveryProviders();
  }
  const providers: DeliveryProvider[] = [];
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.OCCASIO_EMAIL_FROM;
  if (resendKey && emailFrom) {
    providers.push(createResendEmailProvider(resendKey, emailFrom));
  }
  return providers;
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
