/**
 * Who may spend the one free card, and what "already had it" means.
 *
 * The free card is meant to be once per person, but an account is cheap to make, and so is a
 * "confirmed" throwaway inbox. So the card is tied to a Google or Apple identity, which costs
 * real effort to fake. Email and password accounts can still pay for cards, just not claim
 * this one. Each claim leaves a one-way record that outlives the account, so deleting the
 * account and signing up again does not refill it.
 *
 * What this cannot stop: one person with several real Google or Apple accounts. That needs a
 * device signal (see docs/free-card-abuse.md).
 */
import { createHash } from 'node:crypto';
import { FREE_CARD_LIMIT, freeCardsUsed, freeClaimId, type AllowanceUserDoc } from './cardAllowance';

/** What the sign-in proved about the person. `email` is only ever a verified one. */
export type FreeIdentity = {
  email: string | null;
  /** Google or Apple vouches for them. An email and password, confirmed or not, does not. */
  verified: boolean;
  /** Stable ids from Google or Apple, such as `google.com:1234`. They survive a changed email. */
  subjects: readonly string[];
};

export type FreeEligibility =
  | { ok: true }
  | { ok: false; reason: 'needs_provider' | 'disposable' };

/**
 * Throwaway inbox providers. A short list of the common ones, not a promise to catch every
 * one: it stops the casual "make an account with a 10-minute address" and nothing cleverer.
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'anonbox.net', 'burnermail.io',
  'byom.de', 'cock.li', 'discard.email', 'discardmail.com', 'dispostable.com', 'dropmail.me',
  'emailondeck.com', 'fakeinbox.com', 'fakemail.net', 'getairmail.com', 'getnada.com',
  'guerrillamail.biz', 'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamailblock.com', 'harakirimail.com', 'inboxbear.com',
  'inboxkitten.com', 'jetable.org', 'mail-temporaire.fr', 'mailcatch.com', 'maildrop.cc',
  'mailinator.com', 'mailinator.net', 'mailnesia.com', 'mailnull.com', 'mailsac.com',
  'mailtemp.info', 'meltmail.com', 'mintemail.com', 'mohmal.com', 'moakt.com', 'mt2015.com',
  'mytemp.email', 'nada.email', 'sharklasers.com', 'spam4.me', 'spamavert.com', 'spambox.us',
  'spamgourmet.com', 'spamherelots.com', 'temp-mail.io', 'temp-mail.org', 'tempail.com',
  'tempinbox.com', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempr.email',
  'throwawaymail.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org', 'trash-mail.com',
  'trashmail.com', 'trashmail.de', 'trashmail.net', 'trbvm.com', 'wegwerfmail.de',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'zzrgg.com',
]);

function domainOf(email: string): string | null {
  const at = email.trim().toLowerCase().lastIndexOf('@');
  return at > 0 ? email.trim().toLowerCase().slice(at + 1).replace(/\.+$/, '') : null;
}

/** True for a known throwaway provider, including a subdomain of one (`x.mailinator.com`). */
export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = domainOf(email);
  if (!domain) return false;
  const labels = domain.split('.');
  for (let i = 0; i < labels.length - 1; i += 1) {
    if (DISPOSABLE_DOMAINS.has(labels.slice(i).join('.'))) return true;
  }
  return false;
}

export function freeEligibility(identity: FreeIdentity): FreeEligibility {
  if (!identity.verified) return { ok: false, reason: 'needs_provider' };
  if (isDisposableEmail(identity.email)) return { ok: false, reason: 'disposable' };
  return { ok: true };
}

function subjectClaimId(subject: string): string {
  return createHash('sha256').update(`subject:${subject}`).digest('hex');
}

/**
 * Every claim this person holds: their inbox (spelled any way) and each Google or Apple id.
 * The free card is spent if ANY of them is already held by another account, and spending it
 * writes all of them, so the same person cannot come back through a different door.
 */
export function freeClaimIds(identity: FreeIdentity): string[] {
  const ids = new Set<string>();
  const inbox = freeClaimId(identity.email);
  if (inbox) ids.add(inbox);
  for (const subject of identity.subjects) {
    if (subject.trim()) ids.add(subjectClaimId(subject.trim()));
  }
  return [...ids];
}

/** What to tell the app when the free card is refused for one of these reasons. */
export function eligibilityRefusal(reason: 'needs_provider' | 'disposable'): {
  status: 403;
  code: 'FREE_CARD_NEEDS_PROVIDER' | 'EMAIL_NOT_ALLOWED';
  message: string;
} {
  return reason === 'needs_provider'
    ? {
        status: 403,
        code: 'FREE_CARD_NEEDS_PROVIDER',
        message: 'The free card is for Google or Apple sign-in. Sign in with one of them, or choose a plan.',
      }
    : {
        status: 403,
        code: 'EMAIL_NOT_ALLOWED',
        message:
          'That email address cannot be used for the free card. Use a Google or Apple account with a regular email address, or choose a plan.',
      };
}

/**
 * What to answer when nothing paid covers this card: ask for Google or Apple sign-in if a free
 * card is waiting on it, otherwise null (the caller says the plan has no cards left). Also the
 * answer when the plan lookup itself fails, because an email account cannot use the free card
 * either way, so an outage at the billing provider must not hide that step.
 */
export function heldBackRefusal(
  freeHeldBack: boolean,
  eligibility: FreeEligibility,
): ReturnType<typeof eligibilityRefusal> | null {
  return freeHeldBack && !eligibility.ok ? eligibilityRefusal(eligibility.reason) : null;
}

/**
 * The account's counters as the allowance decision should see them. When this person may not
 * spend the free card now (not signed in with Google or Apple, or somebody under this identity already had it) it
 * reads as spent, so the decision falls through to paid plans. `freeHeldBack` says they still
 * have a free card that only a Google or Apple sign-in would unlock, which is a different answer to give.
 */
export function applyFreeRules(
  doc: AllowanceUserDoc,
  eligibility: FreeEligibility,
  claimedElsewhere: boolean,
): { seen: AllowanceUserDoc; freeHeldBack: boolean } {
  const usable = eligibility.ok && !claimedElsewhere;
  return {
    seen: usable ? doc : { ...doc, freeCardsUsed: Math.max(1, freeCardsUsed(doc)) },
    freeHeldBack: !eligibility.ok && freeCardsUsed(doc) < FREE_CARD_LIMIT,
  };
}
