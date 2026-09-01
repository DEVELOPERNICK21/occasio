import type { RelationshipType } from './types';

export const RELATIONSHIP_OPTIONS: ReadonlyArray<{
  id: RelationshipType;
  label: string;
}> = [
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
