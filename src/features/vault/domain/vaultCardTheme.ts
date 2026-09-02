import type { RelationshipType } from './types';

export type VaultCardTheme = {
  tagLabel: string;
  accent: string;
  softBackground: string;
  occasionIcon: string;
};

const THEMES: Record<string, VaultCardTheme> = {
  partner: {
    tagLabel: 'PARTNER',
    accent: '#C94E4A',
    softBackground: '#FAE8E8',
    occasionIcon: '❤️',
  },
  friend: {
    tagLabel: 'FRIEND',
    accent: '#E8615D',
    softBackground: '#FCEEE8',
    occasionIcon: '🎂',
  },
  family: {
    tagLabel: 'FAMILY',
    accent: '#E07A8A',
    softBackground: '#FCEEF2',
    occasionIcon: '🌸',
  },
  default: {
    tagLabel: 'INNER CIRCLE',
    accent: '#857371',
    softBackground: '#F5EDEA',
    occasionIcon: '📅',
  },
};

export function getVaultCardTheme(relationshipType: RelationshipType): VaultCardTheme {
  if (relationshipType === 'partner') return THEMES.partner;
  if (relationshipType === 'friend') return THEMES.friend;
  if (
    relationshipType === 'parent' ||
    relationshipType === 'mom' ||
    relationshipType === 'dad' ||
    relationshipType === 'sibling'
  ) {
    return THEMES.family;
  }
  return THEMES.default;
}

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
