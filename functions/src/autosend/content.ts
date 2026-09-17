import type {
  AutoSendPack,
  RelationshipRecord,
  ResolveAutoSendContentInput,
  ResolvedAutoSendContent,
} from './types';

const DEFAULT_MESSAGE = 'Thinking of you today.';

function isPackEligible(pack: AutoSendPack): boolean {
  const hasTemplate =
    pack.preferredTemplateId != null || pack.preferredTemplateType != null;
  return pack.photoRefs.length > 0 && hasTemplate;
}

export function packFromRelationship(
  data: RelationshipRecord,
): AutoSendPack | null {
  const hasPack =
    data.preferredTemplateId != null ||
    data.preferredTemplateType != null ||
    (data.photoRefs?.length ?? 0) > 0 ||
    data.defaultMessage != null ||
    data.fromName != null;

  if (!hasPack) {
    return null;
  }

  return {
    preferredTemplateId: data.preferredTemplateId ?? null,
    preferredTemplateType: data.preferredTemplateType ?? null,
    photoRefs: data.photoRefs ?? [],
    defaultMessage: data.defaultMessage ?? '',
    fromName: data.fromName ?? null,
  };
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
