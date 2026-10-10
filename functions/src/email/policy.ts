/**
 * Every email Occasio sends is one of three kinds. The kind decides what the
 * message MUST carry, and `composeEmail` enforces it, so nobody can add a new
 * email that skips the legal footer by accident.
 *
 *  - `transactional`  To the account holder about their own account or purchase
 *                     (receipts, subscription confirmations). CAN-SPAM exempts
 *                     these, so they have no unsubscribe link. KEEP THEM PURELY
 *                     TRANSACTIONAL: no offers, upsells, news or "tips". The
 *                     moment a message promotes anything it is `marketing`.
 *  - `delivery`       A card sent on a user's behalf to someone who never signed
 *                     up (auto-send). Not advertising, but the recipient never
 *                     agreed to hear from us, so it carries an unsubscribe link,
 *                     our postal address and one-click headers.
 *  - `marketing`      Anything commercial (launches, newsletters, promos,
 *                     re-engagement). Same requirements as `delivery`, and only
 *                     ever sent to people who opted in. There are none today.
 */
export type EmailKind = 'transactional' | 'delivery' | 'marketing';

export function requiresOptOut(kind: EmailKind): boolean {
  return kind !== 'transactional';
}

export class EmailPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailPolicyError';
  }
}

/** Heuristic used by tests to keep transactional templates free of promotion. */
export function looksPromotional(text: string): boolean {
  return (
    /\b(?:sale|discount|promo(?:tion|code)?|offer ends|limited[- ]time|upgrade now|newsletter|exclusive deal|refer a friend|buy now)\b/i.test(
      text,
    ) || /\d+\s?% off|save \d+\s?%/i.test(text)
  );
}
