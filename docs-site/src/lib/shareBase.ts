const DEFAULT_SHARE_BASE = 'https://occasio-greetings.vercel.app';

export function getShareBaseUrl(): string {
  return process.env.OCCASIO_SHARE_BASE?.replace(/\/$/, '') ?? DEFAULT_SHARE_BASE;
}

export function shareUrlForSlug(slug: string): string {
  return `${getShareBaseUrl()}/c/${slug}`;
}
