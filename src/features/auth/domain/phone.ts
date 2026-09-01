const INDIA_COUNTRY_CODE = '91';
const INDIA_MOBILE_LENGTH = 10;

/** Normalize Indian mobile input to E.164 (+91XXXXXXXXXX) or null if invalid. */
export function normalizeIndiaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  if (digits.length === INDIA_MOBILE_LENGTH) {
    return `+${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === 12 && digits.startsWith(INDIA_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  if (digits.length === 13 && digits.startsWith(`0${INDIA_COUNTRY_CODE}`)) {
    return `+${digits.slice(1)}`;
  }

  return null;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
