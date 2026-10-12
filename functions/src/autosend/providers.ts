import { composeEmail } from '../email/compose';
import { emailConfigFromEnv, type EmailConfig } from '../email/config';
import { sendViaResend } from '../email/resend';
import { cardDeliveryEmail } from '../email/templates';
import { createUnsubscribeToken, isSuppressed } from '../email/unsubscribe';
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

/**
 * Card delivery by email (Resend). It is a `delivery` email: it goes to someone
 * who never signed up, so it carries our postal address, an unsubscribe link and
 * one-click headers, and it is never sent to an address that unsubscribed.
 */
export function createResendEmailProvider(
  config: EmailConfig,
  isSuppressed: (email: string) => Promise<boolean>,
  fetchImpl: typeof fetch = fetch,
): DeliveryProvider {
  return {
    channel: 'email',
    async send(input) {
      if (await isSuppressed(input.to)) {
        return { ok: false, error: 'unsubscribed' };
      }
      const token = createUnsubscribeToken(input.to, config.unsubscribeSecret);
      const card = cardDeliveryEmail(input);
      const email = composeEmail({
        kind: 'delivery',
        from: config.from,
        to: input.to,
        subject: card.subject,
        html: card.html,
        text: card.text,
        optOut: {
          postalAddress: config.postalAddress,
          unsubscribePageUrl: `${config.siteBase}/unsubscribe?t=${token}`,
          unsubscribePostUrl: `${config.siteBase}/api/v1/email/unsubscribe?t=${token}`,
          reason: card.reason,
        },
      });
      return sendViaResend(config.apiKey, email, fetchImpl);
    },
  };
}

/**
 * Real providers configured from env. Mock providers are only used in the
 * emulator or when OCCASIO_MOCK_DELIVERY=true, so production can never mark a
 * send as delivered without actually delivering it.
 */
export function deliveryProviders(
  db?: FirebaseFirestore.Firestore,
): DeliveryProvider[] {
  if (
    process.env.OCCASIO_MOCK_DELIVERY === 'true' ||
    process.env.FUNCTIONS_EMULATOR === 'true'
  ) {
    return mockDeliveryProviders();
  }
  const providers: DeliveryProvider[] = [];
  const email = emailConfigFromEnv();
  // No database means no way to honour unsubscribes, so email stays off.
  if (email && db) {
    providers.push(
      createResendEmailProvider(email, (to) => isSuppressed(db, to)),
    );
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

/**
 * A channel is only used when the sender recorded that this person agreed to
 * get cards that way (`deliveryConsent.<channel> === true` on the relationship).
 */
export function applyDeliveryConsent(
  destinations: Record<DeliveryChannel, string>,
  consent: unknown,
): Record<DeliveryChannel, string> {
  const given =
    consent && typeof consent === 'object'
      ? (consent as Record<string, unknown>)
      : {};
  return {
    whatsapp: given.whatsapp === true ? destinations.whatsapp : '',
    sms: given.sms === true ? destinations.sms : '',
    email: given.email === true ? destinations.email : '',
  };
}

/** True when at least one registered provider has a consented destination. */
export function hasDeliverableChannel(
  providers: DeliveryProvider[],
  destinations: Record<DeliveryChannel, string>,
): boolean {
  return providers.some((provider) => Boolean(destinations[provider.channel]));
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
