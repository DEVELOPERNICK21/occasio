import type { SubscriptionTier } from './quota';

/** Public greeting links — guest and free manual cards. */
export const SHARE_LINK_TTL_DAYS = {
  guest: 30,
  free: 30,
  paid: 365,
  /** Dev / local API only — short TTL for faster expiry testing. */
  dev: 3,
} as const;

type ShareLinkTtlOptions = {
  /** Dev builds only — links expire in 3 days. */
  devShortTtl?: boolean;
};

export function shareLinkTtlDays(
  tier: SubscriptionTier = 'free',
  isGuest = true,
  options: ShareLinkTtlOptions = {},
): number {
  if (options.devShortTtl) {
    return SHARE_LINK_TTL_DAYS.dev;
  }
  if (isGuest) {
    return SHARE_LINK_TTL_DAYS.guest;
  }
  if (tier === 'free') {
    return SHARE_LINK_TTL_DAYS.free;
  }
  return SHARE_LINK_TTL_DAYS.paid;
}

/**
 * Addressed to the person receiving it, not describing the app. Kept short so
 * chat previews are not pushed out of view.
 */
export function shareMessage(recipientName: string, fromName: string): string {
  const to = recipientName.trim();
  const from = fromName.trim();
  if (to && from) {
    return `${to}, ${from} made you something. Open it when you have a minute.`;
  }
  if (to) {
    return `${to}, I made you something. Open it when you have a minute.`;
  }
  return 'I made you something. Open it when you have a minute.';
}

export function computeShareLinkExpiresAt(
  createdAt: Date,
  tier: SubscriptionTier = 'free',
  isGuest = true,
  options: ShareLinkTtlOptions = {},
): Date {
  const days = shareLinkTtlDays(tier, isGuest, options);
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}

const STORY_CAPTIONS: Record<string, string> = {
  birthday: 'I made a birthday surprise for {name}. Watch their face when they open it.',
  anniversary: 'I locked our anniversary surprise for {name}. Guess the code.',
  thank_you: 'A thank-you {name} did not see coming.',
  congratulations: 'A little celebration for {name}, because you deserve it.',
  just_because: '{name} signed the terms. No refunds.',
};

/**
 * Ready-to-post caption for the sender's own story or reel. The card is the
 * content; the sender's reaction video is what travels, so the caption invites
 * that.
 */
export function storyCaption(
  templateType: string | null,
  recipientName: string,
  shareUrl: string,
): string {
  const name = recipientName.trim() || 'them';
  const line = (templateType && STORY_CAPTIONS[templateType]) || 'I made {name} something. Watch their reaction.';
  return `${line.replace('{name}', name)}\n${shareUrl}`;
}
