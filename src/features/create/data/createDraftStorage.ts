import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Audience, Occasion } from '../domain/templateSchema';
import type { CreationDraft, TemplateType } from '../domain/types';

const STORAGE_KEY = 'occasio.create.draft';

const TEMPLATE_TYPES = new Set<TemplateType>([
  'birthday',
  'anniversary',
  'sorry',
  'proposal',
  'mothers_day',
  'fathers_day',
  'thank_you',
  'congratulations',
  'just_because',
]);

const AUDIENCES = new Set<Audience>([
  'mom',
  'dad',
  'partner',
  'friend',
  'family',
  'someone_special',
]);

const OCCASIONS = new Set<Occasion>([
  'birthday',
  'anniversary',
  'thank_you',
  'congratulations',
  'just_because',
]);

export function isCreationDraftEmpty(draft: CreationDraft): boolean {
  return (
    draft.templateType === null &&
    (draft.templateId === null || draft.templateId.trim() === '') &&
    draft.audience === null &&
    draft.occasion === null &&
    draft.photoUris.length === 0 &&
    draft.recipientName.trim() === '' &&
    draft.fromName.trim() === '' &&
    draft.message.trim() === '' &&
    draft.balloonLine.trim() === '' &&
    (draft.editingCreationId === null || draft.editingCreationId.trim() === '')
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
  const templateId =
    typeof record.templateId === 'string' && record.templateId.trim() !== ''
      ? record.templateId
      : null;
  const audience =
    typeof record.audience === 'string' && AUDIENCES.has(record.audience as Audience)
      ? (record.audience as Audience)
      : null;
  const occasion =
    typeof record.occasion === 'string' && OCCASIONS.has(record.occasion as Occasion)
      ? (record.occasion as Occasion)
      : null;

  const photoUris = Array.isArray(record.photoUris)
    ? record.photoUris.filter((uri): uri is string => typeof uri === 'string')
    : [];

  const recipientName =
    typeof record.recipientName === 'string' ? record.recipientName : '';
  const fromName = typeof record.fromName === 'string' ? record.fromName : '';
  const message = typeof record.message === 'string' ? record.message : '';
  const experienceMode =
    record.experienceMode === 'story' || record.experienceMode === 'classic'
      ? record.experienceMode
      : null;
  const balloonLine =
    typeof record.balloonLine === 'string' ? record.balloonLine : '';
  const editingCreationId =
    typeof record.editingCreationId === 'string' &&
    record.editingCreationId.trim() !== ''
      ? record.editingCreationId
      : null;
  const editingShareSlug =
    typeof record.editingShareSlug === 'string' &&
    record.editingShareSlug.trim() !== ''
      ? record.editingShareSlug
      : null;
  const editingShareUrl =
    typeof record.editingShareUrl === 'string' &&
    record.editingShareUrl.trim() !== ''
      ? record.editingShareUrl
      : null;
  const editingExpiresAt =
    typeof record.editingExpiresAt === 'string' &&
    record.editingExpiresAt.trim() !== ''
      ? record.editingExpiresAt
      : null;

  const draft: CreationDraft = {
    templateType,
    templateId,
    audience,
    occasion,
    photoUris,
    recipientName,
    fromName,
    message,
    experienceMode,
    balloonLine,
    editingCreationId,
    editingShareSlug,
    editingShareUrl,
    editingExpiresAt,
  };

  return isCreationDraftEmpty(draft) ? null : draft;
}
