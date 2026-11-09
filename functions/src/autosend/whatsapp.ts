import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { istCalendarDate } from './dates';
import type { DeliveryProvider } from './providers';

/**
 * Card delivery on WhatsApp, through Meta's official Cloud API from Occasio's own business number.
 *
 * Never through a user's own WhatsApp: linking a personal account to a server (Baileys, WhatsApp Web
 * automation) breaks WhatsApp's terms, can get that person's number banned and hands us their chats.
 * Here the wish arrives from Occasio, by an approved template, only to someone the sender recorded as
 * having agreed, and anyone who replies STOP is never sent another.
 */

/** A person never costs more than this many WhatsApp wishes a calendar year (IST). */
export const WHATSAPP_YEARLY_CAP = 100;
export const WHATSAPP_USAGE = 'whatsapp_usage';
export const WHATSAPP_OPTOUTS = 'whatsapp_optouts';
export const DEFAULT_TEMPLATE_NAME = 'occasio_wish_delivery';

const DEFAULT_API_VERSION = 'v23.0';
const SEND_TIMEOUT_MS = 8000;
/** Template variables are one line of plain text; Meta rejects newlines, tabs and long runs of spaces. */
const PARAM_MAX = 60;

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  languageCode: string;
  apiVersion: string;
  yearlyCap: number;
};

function positiveInt(raw: string | undefined): number | null {
  const value = Number.parseInt(raw?.trim() ?? '', 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * WhatsApp delivery is only switched on when the token and the sending number are both configured.
 * Anything missing keeps it OFF, so the engine falls back to email or to the owner sharing the link.
 */
export function whatsappConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): WhatsAppConfig | null {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!accessToken || !phoneNumberId || !/^\d{5,20}$/.test(phoneNumberId)) {
    return null;
  }
  const version = env.WHATSAPP_API_VERSION?.trim();
  return {
    accessToken,
    phoneNumberId,
    templateName: env.WHATSAPP_TEMPLATE_NAME?.trim() || DEFAULT_TEMPLATE_NAME,
    languageCode: env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en',
    apiVersion: version && /^v\d+\.\d+$/.test(version) ? version : DEFAULT_API_VERSION,
    yearlyCap: positiveInt(env.WHATSAPP_YEARLY_CAP) ?? WHATSAPP_YEARLY_CAP,
  };
}

/** How many wishes a user has sent on WhatsApp this year. Counted so that cost has a ceiling. */
export interface WhatsAppUsage {
  count(uid: string, year: number): Promise<number>;
  record(uid: string, year: number): Promise<void>;
}

/** Numbers that replied STOP, kept as hashes so the list cannot be read back into phone numbers. */
export interface WhatsAppOptOuts {
  has(digits: string): Promise<boolean>;
  add(digits: string): Promise<void>;
}

export function optOutKey(digits: string): string {
  return createHash('sha256').update(digits).digest('hex');
}

export function firestoreWhatsAppUsage(db: FirebaseFirestore.Firestore): WhatsAppUsage {
  const ref = (uid: string, year: number) => db.collection(WHATSAPP_USAGE).doc(`${uid}_${year}`);
  return {
    async count(uid, year) {
      const count = (await ref(uid, year).get()).data()?.count;
      return typeof count === 'number' ? count : 0;
    },
    async record(uid, year) {
      await ref(uid, year).set(
        {
          userId: uid,
          year,
          count: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: true },
      );
    },
  };
}

export function firestoreWhatsAppOptOuts(db: FirebaseFirestore.Firestore): WhatsAppOptOuts {
  return {
    async has(digits) {
      return (await db.collection(WHATSAPP_OPTOUTS).doc(optOutKey(digits)).get()).exists;
    },
    async add(digits) {
      await db
        .collection(WHATSAPP_OPTOUTS)
        .doc(optOutKey(digits))
        .set({ createdAt: admin.firestore.Timestamp.now() });
    },
  };
}

/** `+91 98765 43210` becomes `919876543210`, the form the Cloud API wants; null if it is not a number. */
export function whatsappDigits(to: string): string | null {
  const digits = to.replace(/\D/g, '');
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

/** The part of a card link the template's button adds to `…/c/`; null for any other address. */
export function slugFromShareUrl(shareUrl: string | null): string | null {
  if (!shareUrl) return null;
  try {
    return new URL(shareUrl).pathname.match(/^\/c\/([A-Za-z0-9_-]{1,120})\/?$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

/** One line of plain text that fits a template variable. */
export function templateParam(value: string | null | undefined, fallback: string): string {
  const clean = (value ?? '').replace(/\s+/g, ' ').trim().slice(0, PARAM_MAX).trim();
  return clean || fallback;
}

type GraphError = { error?: { code?: unknown; error_subcode?: unknown } };

/**
 * A short, stable reason for a refusal from the Cloud API. These end up on the scheduled send, and the
 * dispatcher moves on to the next channel (email) whenever this one fails.
 */
export function classifyGraphError(status: number, body: unknown): string {
  const error = (body as GraphError | null)?.error;
  const code = typeof error?.code === 'number' ? error.code : null;
  if (code === 131026) return 'whatsapp_not_on_whatsapp';
  if (code === 131049) return 'whatsapp_not_delivered';
  if (code === 130429 || code === 131048 || code === 131056 || code === 80007) {
    return 'whatsapp_rate_limited';
  }
  if (code !== null && code >= 132000 && code <= 132999) return 'whatsapp_template';
  if (code === 190 || code === 10 || (code !== null && code >= 200 && code <= 299)) {
    return 'whatsapp_auth';
  }
  return `whatsapp_${status}`;
}

type SendClock = () => Date;

export function createWhatsAppCloudProvider(
  config: WhatsAppConfig,
  usage: WhatsAppUsage,
  optOuts: WhatsAppOptOuts,
  fetchImpl: typeof fetch = fetch,
  now: SendClock = () => new Date(),
): DeliveryProvider {
  return {
    channel: 'whatsapp',
    async send(input) {
      const slug = slugFromShareUrl(input.shareUrl);
      if (!slug) return { ok: false, error: 'whatsapp_bad_share_url' };
      const to = whatsappDigits(input.to);
      if (!to) return { ok: false, error: 'whatsapp_bad_number' };
      // Every send is counted against someone, so one with no owner is not sent.
      const uid = input.userId?.trim();
      if (!uid) return { ok: false, error: 'whatsapp_no_owner' };

      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), SEND_TIMEOUT_MS);
      try {
        if (await optOuts.has(to)) return { ok: false, error: 'whatsapp_opted_out' };
        const year = istCalendarDate(now()).year;
        if ((await usage.count(uid, year)) >= config.yearlyCap) {
          return { ok: false, error: 'whatsapp_yearly_cap' };
        }

        const res = await fetchImpl(
          `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
            signal: timeout.signal,
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to,
              type: 'template',
              template: {
                name: config.templateName,
                language: { code: config.languageCode },
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: templateParam(input.personName, 'there') },
                      { type: 'text', text: templateParam(input.fromName, 'A friend') },
                      {
                        type: 'text',
                        text: input.occasionType === 'anniversary' ? 'anniversary' : 'birthday',
                      },
                    ],
                  },
                  {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{ type: 'text', text: slug }],
                  },
                ],
              },
            }),
          },
        );

        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const error = classifyGraphError(res.status, body);
          // Never the number or the token: this line is read by whoever is on call.
          console.error('AUTOSEND_WHATSAPP_SEND_FAILED', { error, status: res.status });
          return { ok: false, error };
        }
        const messages = (body as { messages?: Array<{ id?: unknown }> } | null)?.messages;
        if (typeof messages?.[0]?.id !== 'string') {
          return { ok: false, error: 'whatsapp_no_message_id' };
        }
      } catch {
        return { ok: false, error: 'whatsapp_network' };
      } finally {
        clearTimeout(timer);
      }

      // The wish is out. A failure to count it must not report a failure, or email would send it again.
      try {
        await usage.record(uid, istCalendarDate(now()).year);
      } catch (error) {
        console.error('AUTOSEND_WHATSAPP_USAGE_FAILED', error instanceof Error ? error.message : 'unknown');
      }
      return { ok: true };
    },
  };
}

/* ---------------------------------------------------------------- replies: STOP and the webhook */

const OPT_OUT_WORDS = /^(stop|stop all|unsubscribe|cancel|end|quit|opt ?out)[\s.!]*$/i;

export function isOptOutText(text: string): boolean {
  return OPT_OUT_WORDS.test(text.trim());
}

type WebhookMessage = { from?: unknown; type?: unknown; text?: { body?: unknown }; button?: { text?: unknown } };

/** The numbers (digits) in a Meta webhook delivery whose message asks us to stop. */
export function optOutNumbersFrom(body: unknown): string[] {
  const numbers = new Set<string>();
  const entries = (body as { entry?: unknown } | null)?.entry;
  if (!Array.isArray(entries)) return [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown } | null)?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const messages = (change as { value?: { messages?: unknown } } | null)?.value?.messages;
      if (!Array.isArray(messages)) continue;
      for (const raw of messages as WebhookMessage[]) {
        const text = typeof raw?.text?.body === 'string' ? raw.text.body : raw?.button?.text;
        const from = typeof raw?.from === 'string' ? whatsappDigits(raw.from) : null;
        if (from && typeof text === 'string' && isOptOutText(text)) numbers.add(from);
      }
    }
  }
  return [...numbers];
}

/** Meta signs each delivery: `sha256=` and an HMAC of the exact bytes, keyed with the app secret. */
export function verifyMetaSignature(raw: Buffer | undefined, header: unknown, appSecret: string): boolean {
  if (!raw || typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const expected = Buffer.from(createHmac('sha256', appSecret).update(raw).digest('hex'));
  const given = Buffer.from(header.slice('sha256='.length));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function sameSecret(a: unknown, b: string): boolean {
  if (typeof a !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export type RawBodyRequest = Request & { rawBody?: Buffer };

/**
 * `GET`: Meta checks the address once when the webhook is added. `POST`: replies from people we sent to.
 * Only a signed delivery is believed, and the only thing it can do is stop us writing to a number.
 */
export async function handleWhatsAppWebhook(
  req: RawBodyRequest,
  res: Response,
  optOuts: WhatsAppOptOuts,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  if (req.method === 'GET') {
    const verifyToken = env.WHATSAPP_VERIFY_TOKEN?.trim();
    const challenge = req.query['hub.challenge'];
    if (
      verifyToken &&
      req.query['hub.mode'] === 'subscribe' &&
      sameSecret(req.query['hub.verify_token'], verifyToken) &&
      typeof challenge === 'string'
    ) {
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    res.status(403).json({ code: 'FORBIDDEN' });
    return;
  }

  const appSecret = env.WHATSAPP_APP_SECRET?.trim();
  if (!appSecret) {
    res.status(503).json({ code: 'NOT_CONFIGURED' });
    return;
  }
  if (!verifyMetaSignature(req.rawBody, req.header('x-hub-signature-256'), appSecret)) {
    res.status(401).json({ code: 'BAD_SIGNATURE' });
    return;
  }
  for (const digits of optOutNumbersFrom(req.body)) {
    await optOuts.add(digits);
  }
  res.status(200).json({ ok: true });
}
