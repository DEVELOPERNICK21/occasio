import type { ComposedEmail } from './compose';

/** Sends an already-composed message through Resend. The only place that talks to Resend. */
export async function sendViaResend(
  apiKey: string,
  email: ComposedEmail,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    });
    return res.ok ? { ok: true } : { ok: false, error: `resend_${res.status}` };
  } catch {
    return { ok: false, error: 'resend_network' };
  }
}
