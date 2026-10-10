export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A card delivered on a user's behalf to someone who did not sign up. Kind: `delivery`. */
export function cardDeliveryEmail(input: {
  personName: string;
  occasionType: string;
  shareUrl: string;
}): { subject: string; html: string; text: string; reason: string } {
  const occasion = input.occasionType === 'anniversary' ? 'anniversary' : 'birthday';
  const name = input.personName.trim() || 'there';
  return {
    subject: `Someone made you a ${occasion} surprise`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Someone who cares about you made a little ${occasion} surprise. Tap to open it:</p>` +
      `<p><a href="${escapeHtml(input.shareUrl)}">Open your surprise</a></p>`,
    text:
      `Hi ${name},\n\nSomeone who cares about you made a little ${occasion} surprise. Open it here:\n${input.shareUrl}`,
    reason: 'You are getting this because someone sent you a card through Occasio.',
  };
}

export type SubscriptionReceipt = {
  /** e.g. "Occasio Pro" */
  productName: string;
  interval: 'monthly' | 'yearly' | null;
  /** Store-formatted, e.g. "$79.98 USD". */
  amount: string | null;
  /** First date the person is charged again, or the date a trial ends. */
  renewsOn: Date | null;
  isTrial: boolean;
  store: 'ios' | 'android' | 'other';
};

function whereToCancel(store: SubscriptionReceipt['store']): string {
  if (store === 'ios') return 'your Apple ID subscription settings (Settings → your name → Subscriptions)';
  if (store === 'android') return 'Google Play (Play Store → profile → Payments & subscriptions → Subscriptions)';
  return 'your store account subscription settings';
}

function dateText(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Sent after a subscription starts. TRANSACTIONAL ONLY: it repeats the renewal
 * terms and how to cancel, and nothing else. Do not add offers or news here.
 */
export function subscriptionConfirmationEmail(r: SubscriptionReceipt): {
  subject: string;
  html: string;
  text: string;
} {
  const every = r.interval === 'yearly' ? 'every year' : r.interval === 'monthly' ? 'every month' : 'on each renewal date';
  const price = r.amount ? ` for ${r.amount}` : '';
  const lines: string[] = [];
  lines.push(
    r.isTrial
      ? `Your ${r.productName} free trial has started.`
      : `Thank you for subscribing to ${r.productName}${price}.`,
  );
  if (r.isTrial && r.renewsOn) {
    lines.push(`Your trial ends on ${dateText(r.renewsOn)}. After that you are charged${price} ${every} until you cancel.`);
  } else if (r.renewsOn) {
    lines.push(`Your subscription renews automatically ${every}${price}, next on ${dateText(r.renewsOn)}, until you cancel.`);
  } else {
    lines.push(`Your subscription renews automatically ${every}${price} until you cancel.`);
  }
  lines.push(
    `To cancel, open Occasio → Account → Cancel or manage subscription, or go to ${whereToCancel(r.store)}. You do not need to email us. If you cancel, you keep access until the end of the period you paid for.`,
  );
  return {
    subject: r.isTrial ? `Your ${r.productName} trial has started` : `Your ${r.productName} subscription`,
    html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
    text: lines.join('\n\n'),
  };
}
