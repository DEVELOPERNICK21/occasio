import {
  Cake,
  Flower2,
  Gem,
  Heart,
  PartyPopper,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import type { TemplateType } from '../../domain/types';

type Props = {
  templateType: TemplateType;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const ICONS: Record<TemplateType, LucideIcon> = {
  birthday: Cake,
  anniversary: Heart,
  sorry: Flower2,
  proposal: Gem,
  mothers_day: Heart,
  fathers_day: Shield,
  thank_you: Flower2,
  congratulations: PartyPopper,
  just_because: Sparkles,
};

export function TemplateOccasionIcon({
  templateType,
  size = 20,
  color,
  strokeWidth = 2,
}: Props) {
  const Icon = ICONS[templateType];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
