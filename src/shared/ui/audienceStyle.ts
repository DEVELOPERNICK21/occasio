import { Gem, Heart, Home, Shield, Sparkles, Users, type LucideIcon } from 'lucide-react-native';
import { colors } from '../theme/tokens';

/**
 * How each "who is it for" choice looks: one warm colour and one icon per relationship, so a grid
 * of them scans at a glance. Both the create flow and onboarding draw it, so it lives here and
 * not in either feature. Keyed by the audience id (a string) so shared UI needs no feature type;
 * an id it does not know gets the "someone special" look.
 */
const FALLBACK = 'someone_special';

export type AudienceTone = {
  /** Solid icon tile. */
  tile: string;
  iconColor: string;
  /** Card tint. */
  soft: string;
  border: string;
};

/** One warm colour per relationship — helps the grid scan at a glance. */
const TONES: Record<string, AudienceTone> = {
  someone_special: {
    tile: colors.accent,
    iconColor: colors.white,
    soft: colors.sidebar,
    border: colors.accentSoft,
  },
  mom: {
    tile: colors.rose,
    iconColor: colors.white,
    soft: colors.roseSoft,
    border: colors.roseSoft,
  },
  dad: {
    tile: colors.sage,
    iconColor: colors.white,
    soft: colors.sageSoft,
    border: colors.sageSoft,
  },
  friend: {
    tile: colors.secondary,
    iconColor: colors.white,
    soft: colors.amberSoft,
    border: colors.amberSoft,
  },
  partner: {
    tile: colors.accentHover,
    iconColor: colors.white,
    soft: colors.roseSoft,
    border: colors.accentSoft,
  },
  family: {
    tile: colors.butter,
    iconColor: colors.ink,
    soft: colors.butterSoft,
    border: colors.butterSoft,
  },
};

const ICONS: Record<string, LucideIcon> = {
  someone_special: Sparkles,
  mom: Heart,
  dad: Shield,
  friend: Users,
  partner: Gem,
  family: Home,
};

export function audienceTone(audience: string): AudienceTone {
  return TONES[audience] ?? TONES[FALLBACK]!;
}

export function audienceIcon(audience: string): LucideIcon {
  return ICONS[audience] ?? ICONS[FALLBACK]!;
}
