import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreationDraft, TemplateType } from '../domain/types';

const STORAGE_KEY = 'occasio.create.draft';

const TEMPLATE_TYPES = new Set<TemplateType>([
  'birthday',
  'anniversary',
  'sorry',
  'proposal',
  'mothers_day',
  'fathers_day',
]);

export function isCreationDraftEmpty(draft: CreationDraft): boolean {
  return (
    draft.templateType === null &&
    draft.photoUris.length === 0 &&
    draft.recipientName.trim() === '' &&
    draft.message.trim() === ''
  );
}

export async function readCreationDraft(): Promise<CreationDraft | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseCreationDraft(parsed);
  } catch {
    return null;
  }
}

export async function writeCreationDraft(draft: CreationDraft): Promise<void> {
  if (isCreationDraftEmpty(draft)) {
    await clearCreationDraft();
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export async function clearCreationDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function parseCreationDraft(value: unknown): CreationDraft | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const templateType =
    record.templateType === null
      ? null
      : typeof record.templateType === 'string' &&
          TEMPLATE_TYPES.has(record.templateType as TemplateType)
        ? (record.templateType as TemplateType)
        : null;

  const photoUris = Array.isArray(record.photoUris)
    ? record.photoUris.filter((uri): uri is string => typeof uri === 'string')
    : [];

  const recipientName =
    typeof record.recipientName === 'string' ? record.recipientName : '';
  const message = typeof record.message === 'string' ? record.message : '';

  const draft: CreationDraft = {
    templateType,
    photoUris,
    recipientName,
    message,
  };

  return isCreationDraftEmpty(draft) ? null : draft;
}
