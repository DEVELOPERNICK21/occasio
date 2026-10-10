const DEFAULT_SITE = 'https://occasio-greetings.vercel.app';

export type EmailConfig = {
  apiKey: string;
  from: string;
  /** CAN-SPAM: a valid postal address, printed in every non-transactional email. */
  postalAddress: string;
  unsubscribeSecret: string;
  siteBase: string;
};

/**
 * Email is only switched on when everything the law requires is configured.
 * A missing postal address or unsubscribe secret keeps email OFF instead of
 * sending something non-compliant.
 */
export function emailConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.OCCASIO_EMAIL_FROM?.trim();
  const postalAddress = env.OCCASIO_POSTAL_ADDRESS?.trim();
  const unsubscribeSecret = env.EMAIL_UNSUBSCRIBE_SECRET?.trim();
  if (!apiKey || !from || !postalAddress || !unsubscribeSecret || unsubscribeSecret.length < 32) {
    return null;
  }
  return {
    apiKey,
    from,
    postalAddress,
    unsubscribeSecret,
    siteBase: (env.OCCASIO_SHARE_BASE?.trim() || DEFAULT_SITE).replace(/\/$/, ''),
  };
}

/** Transactional email needs only the sending account; it has no marketing footer. */
export function transactionalConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): { apiKey: string; from: string } | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.OCCASIO_EMAIL_FROM?.trim();
  return apiKey && from ? { apiKey, from } : null;
}
