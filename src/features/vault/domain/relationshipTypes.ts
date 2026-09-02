import type { RelationshipType } from './types';

/** Chips shown on the Add Person screen (mockup order). */
export const ADD_PERSON_RELATIONSHIP_OPTIONS: ReadonlyArray<{
  id: RelationshipType;
  label: string;
}> = [
  { id: 'mom', label: 'Mom' },
  { id: 'dad', label: 'Dad' },
  { id: 'partner', label: 'Partner' },
  { id: 'friend', label: 'Friend' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'other', label: 'Other' },
] as const;

export const RELATIONSHIP_OPTIONS: ReadonlyArray<{
  id: RelationshipType;
  label: string;
}> = [
  { id: 'mom', label: 'Mom' },
  { id: 'dad', label: 'Dad' },
  { id: 'parent', label: 'Parent' },
  { id: 'partner', label: 'Partner' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'friend', label: 'Friend' },
  { id: 'colleague', label: 'Colleague' },
  { id: 'other', label: 'Other' },
] as const;

export function relationshipLabel(type: RelationshipType): string {
  return RELATIONSHIP_OPTIONS.find((option) => option.id === type)?.label ?? 'Other';
}
