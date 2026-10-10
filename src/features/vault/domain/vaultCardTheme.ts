import { colors } from '../../../shared/theme/tokens';
import type { RelationshipType } from './types';

export type VaultCardTheme = {
  tagLabel: string;
  /** Hue for non-text accents (avatar ring, status dot). Text stays on ink. */
  accent: string;
  softBackground: string;
};

const THEMES: Record<string, VaultCardTheme> = {
  partner: {
    tagLabel: 'Partner',
    accent: colors.accentHover,
    softBackground: colors.roseSoft,
  },
  friend: {
    tagLabel: 'Friend',
    accent: colors.accent,
    softBackground: colors.sidebar,
  },
  family: {
    tagLabel: 'Family',
    accent: colors.rose,
    softBackground: colors.amberSoft,
  },
  default: {
    tagLabel: 'Inner circle',
    accent: colors.muted,
    softBackground: colors.sidebar,
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
