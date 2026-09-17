import type { AutoSendPack, OccasionType } from './types';

const DEFAULT_MESSAGE = 'Thinking of you today.';

export type AutoSendLastCreation = {
  templateType: string;
  templateId: string;
  photoRefs: string[];
  message: string;
  fromName: string | null;
};

export type AutoSendContentSource = 'pack' | 'last_creation' | 'default';

export type ResolvedAutoSendContent = {
  templateType: string;
  templateId: string | null;
  photoRefs: string[];
  message: string;
  fromName: string | null;
  source: AutoSendContentSource;
};

export type ResolveAutoSendContentInput = {
  occasionType: OccasionType;
  pack: AutoSendPack | null;
  lastCreation: AutoSendLastCreation | null;
};

export type LinkCreationFields = {
  templateType: string | null;
  templateId: string | null;
  photoRefs: string[];
  message: string;
  fromName: string | null;
};

export function packFromLinkedCreation(
  fields: LinkCreationFields,
): Partial<AutoSendPack> {
  return {
    preferredTemplateType: fields.templateType,
    preferredTemplateId: fields.templateId,
    photoRefs: fields.photoRefs,
    defaultMessage: fields.message,
    fromName: fields.fromName,
  };
}

function isPackEligible(pack: AutoSendPack): boolean {
  const hasTemplate =
    pack.preferredTemplateId != null || pack.preferredTemplateType != null;
  return pack.photoRefs.length > 0 && hasTemplate;
}

export function resolveAutoSendContent(
  input: ResolveAutoSendContentInput,
): ResolvedAutoSendContent {
  const { occasionType, pack, lastCreation } = input;

  if (pack && isPackEligible(pack)) {
    return {
      templateType: pack.preferredTemplateType ?? occasionType,
      templateId: pack.preferredTemplateId,
      photoRefs: pack.photoRefs,
      message: pack.defaultMessage,
      fromName: pack.fromName,
      source: 'pack',
    };
  }

  if (lastCreation) {
    return {
      templateType: lastCreation.templateType,
      templateId: lastCreation.templateId,
      photoRefs: lastCreation.photoRefs,
      message: lastCreation.message,
      fromName: lastCreation.fromName,
      source: 'last_creation',
    };
  }

  return {
    templateType: occasionType,
    templateId: null,
    photoRefs: [],
    message: DEFAULT_MESSAGE,
    fromName: null,
    source: 'default',
  };
}
