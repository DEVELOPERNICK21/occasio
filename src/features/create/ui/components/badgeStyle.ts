import {
  BookHeart,
  CalendarHeart,
  Flame,
  Gem,
  HandHeart,
  Heart,
  PartyPopper,
  Palette,
  Rocket,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../../../../shared/theme/tokens';
import type { WishBadgeId } from '../../domain/wishJourney';

/** How each badge looks: its icon and its two colours. */
export const BADGE_STYLE: Record<WishBadgeId, { icon: LucideIcon; color: string; soft: string }> = {
  first_wish: { icon: Heart, color: colors.accent, soft: colors.accentSoft },
  three_wishes: { icon: Sparkles, color: colors.secondary, soft: colors.amberSoft },
  ten_wishes: { icon: Gem, color: colors.accentHover, soft: colors.accentSoft },
  vault_saved: { icon: BookHeart, color: colors.sage, soft: colors.sageSoft },
  five_people: { icon: Users, color: colors.accentHover, soft: colors.butterSoft },
  streak_two: { icon: Flame, color: colors.rose, soft: colors.roseSoft },
  thank_you: { icon: HandHeart, color: colors.sage, soft: colors.sageSoft },
  anniversary: { icon: CalendarHeart, color: colors.rose, soft: colors.roseSoft },
  invitation: { icon: PartyPopper, color: colors.secondary, soft: colors.butterSoft },
  three_occasions: { icon: Palette, color: colors.accent, soft: colors.amberSoft },
  auto_send: { icon: Rocket, color: colors.sage, soft: colors.sageSoft },
};
