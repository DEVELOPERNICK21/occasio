import type { RecipientCard } from '@/lib/recipientCard';

const PROJECT_ID = 'occasio-app-dev';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { nullValue: null };

function fieldString(fields: Record<string, FirestoreValue>, key: string): string | null {
  const v = fields[key];
  if (v && 'stringValue' in v) return v.stringValue;
  return null;
}

function fieldStringArray(fields: Record<string, FirestoreValue>, key: string): string[] {
  const v = fields[key];
  if (!v || !('arrayValue' in v) || !v.arrayValue.values) return [];
  return v.arrayValue.values
    .filter((item): item is { stringValue: string } => 'stringValue' in item)
    .map((item) => item.stringValue);
}

function fieldTimestamp(fields: Record<string, FirestoreValue>, key: string): Date | null {
  const v = fields[key];
  if (v && 'timestampValue' in v) return new Date(v.timestampValue);
  return null;
}

/** Fetch card from Firestore (Spark plan — no Cloud Functions). */
export async function fetchCardFromFirestore(slug: string): Promise<RecipientCard | null> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return null;

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'creations' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'shareSlug' },
              op: 'EQUAL',
              value: { stringValue: slug },
            },
          },
          limit: 1,
        },
      }),
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const rows = (await res.json()) as Array<{ document?: { fields: Record<string, FirestoreValue> } }>;
  const doc = rows.find((row) => row.document)?.document;
  if (!doc) return null;

  const expiresAt = fieldTimestamp(doc.fields, 'expiresAt');
  if (expiresAt && expiresAt < new Date()) return null;

  const recipientName = fieldString(doc.fields, 'recipientName');
  if (!recipientName) return null;

  return {
    recipientName,
    message: fieldString(doc.fields, 'message'),
    templateType: fieldString(doc.fields, 'templateType') ?? 'birthday',
    fromName: null,
    isDemo: false,
    mediaUrls: fieldStringArray(doc.fields, 'mediaUrls'),
  };
}
