import { EmailPolicyError, requiresOptOut, type EmailKind } from './policy';

export type OptOut = {
  /** Our postal address (CAN-SPAM). */
  postalAddress: string;
  /** Page a person opens in a browser to unsubscribe. */
  unsubscribePageUrl: string;
  /** Endpoint that accepts the RFC 8058 one-click POST. */
  unsubscribePostUrl: string;
  /** Why this person is getting the email, in one sentence. */
  reason: string;
};

export type ComposeInput = {
  kind: EmailKind;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  optOut?: OptOut;
};

export type ComposedEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Builds the message, adding the legal footer and one-click headers to every
 * kind that needs them. Throws instead of sending a non-compliant email.
 */
export function composeEmail(input: ComposeInput): ComposedEmail {
  if (!requiresOptOut(input.kind)) {
    return {
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: {},
    };
  }

  const { optOut } = input;
  if (!optOut?.postalAddress.trim() || !optOut.unsubscribePageUrl || !optOut.unsubscribePostUrl) {
    throw new EmailPolicyError(
      `A ${input.kind} email needs a postal address and an unsubscribe link.`,
    );
  }

  const address = optOut.postalAddress.trim();
  const footerHtml =
    `<hr style="border:none;border-top:1px solid #EDD5CA;margin:24px 0 12px">` +
    `<p style="color:#857371;font-size:12px;line-height:1.5">${escapeHtml(optOut.reason)} ` +
    `<a href="${escapeHtml(optOut.unsubscribePageUrl)}">Unsubscribe</a> and we will not email this address again.<br>` +
    `Occasio · ${escapeHtml(address).replace(/\n/g, ', ')}</p>`;
  const footerText =
    `\n\n--\n${optOut.reason} Unsubscribe: ${optOut.unsubscribePageUrl}\n` +
    `Occasio · ${address.replace(/\n/g, ', ')}`;

  return {
    from: input.from,
    to: [input.to],
    subject: input.subject,
    html: input.html + footerHtml,
    text: input.text + footerText,
    headers: {
      'List-Unsubscribe': `<${optOut.unsubscribePostUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
