import type { WidgetOccasion } from './widgetSnapshot';

/**
 * Deep links the native widgets open. The strings are built in Swift/Kotlin, so
 * this file is the contract: change a path here and in
 * `ios/OccasioWidgets/WidgetLinks.swift` and `android/.../widgets/WidgetLinks.kt`.
 */
export const WIDGET_SCHEME = 'occasio';

export type WidgetLink =
  | { kind: 'quick_create' }
  | { kind: 'card'; personId: string; occasion: WidgetOccasion }
  | { kind: 'vault' }
  | { kind: 'add_person' };

const PERSON_ID = /^[A-Za-z0-9_-]{1,128}$/;

function parseQuery(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) {
    return out;
  }
  for (const pair of raw.split('&')) {
    const [key, value = ''] = pair.split('=');
    if (!key) {
      continue;
    }
    try {
      out[decodeURIComponent(key)] = decodeURIComponent(value);
    } catch {
      // malformed escape — ignore this pair
    }
  }
  return out;
}

export function parseWidgetLink(url: string | null | undefined): WidgetLink | null {
  if (!url) {
    return null;
  }
  const match = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^?#]*)(?:\?([^#]*))?/.exec(url.trim());
  if (!match || match[1]!.toLowerCase() !== WIDGET_SCHEME) {
    return null;
  }

  const path = (match[2] ?? '').split('/').filter(Boolean).join('/');
  const query = parseQuery(match[3]);

  switch (path) {
    case 'create/quick':
      return { kind: 'quick_create' };
    case 'vault':
      return { kind: 'vault' };
    case 'vault/add':
      return { kind: 'add_person' };
    case 'card/new': {
      const personId = query.person ?? '';
      if (!PERSON_ID.test(personId)) {
        return null;
      }
      return {
        kind: 'card',
        personId,
        occasion: query.occasion === 'anniversary' ? 'anniversary' : 'birthday',
      };
    }
    default:
      return null;
  }
}

export function widgetLinkUrl(link: WidgetLink): string {
  switch (link.kind) {
    case 'quick_create':
      return `${WIDGET_SCHEME}://create/quick`;
    case 'vault':
      return `${WIDGET_SCHEME}://vault`;
    case 'add_person':
      return `${WIDGET_SCHEME}://vault/add`;
    case 'card':
      return `${WIDGET_SCHEME}://card/new?person=${encodeURIComponent(link.personId)}&occasion=${link.occasion}`;
  }
}
