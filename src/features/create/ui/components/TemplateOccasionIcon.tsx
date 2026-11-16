import {
  Baby,
  Bell,
  BookOpen,
  Cake,
  Egg,
  Flag,
  Flame,
  Flower2,
  Gem,
  Ghost,
  GraduationCap,
  HandHeart,
  Heart,
  Lamp,
  MailOpen,
  Moon,
  Palette,
  PartyPopper,
  Shield,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Sunrise,
  TreePine,
  Users,
  Wheat,
  type LucideIcon,
} from '../../../../shared/ui/icons/lucide';
import { holidayById, type HolidayIcon } from '../../domain/holidays';
import type { BaseTemplateType, TemplateType } from '../../domain/types';

type Props = {
  templateType: TemplateType;
  size?: number;
  color: string;
  strokeWidth?: number;
};

/** The drawing for each festival icon name. */
export const HOLIDAY_ICONS: Record<HolidayIcon, LucideIcon> = {
  party: PartyPopper,
  heart: Heart,
  flower: Flower2,
  egg: Egg,
  shield: Shield,
  users: Users,
  ghost: Ghost,
  wheat: Wheat,
  tree: TreePine,
  star: Star,
  lamp: Lamp,
  flag: Flag,
  graduation: GraduationCap,
  baby: Baby,
  flame: Flame,
  sun: Sun,
  sprout: Sprout,
  sunrise: Sunrise,
  sparkles: Sparkles,
  moon: Moon,
  palette: Palette,
  handHeart: HandHeart,
  book: BookOpen,
  bell: Bell,
};

const ICONS: Record<BaseTemplateType, LucideIcon> = {
  birthday: Cake,
  anniversary: Heart,
  sorry: Flower2,
  proposal: Gem,
  thank_you: Flower2,
  congratulations: PartyPopper,
  just_because: Sparkles,
  invitation: MailOpen,
};

export function TemplateOccasionIcon({
  templateType,
  size = 20,
  color,
  strokeWidth = 2,
}: Props) {
  const holiday = holidayById(templateType);
  const Icon = holiday ? HOLIDAY_ICONS[holiday.icon] : ICONS[templateType as BaseTemplateType];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
