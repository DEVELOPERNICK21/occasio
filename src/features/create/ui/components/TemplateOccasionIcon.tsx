import {
  Cake,
  Flower2,
  Gem,
  Heart,
  PartyPopper,
  Shield,
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
  anniversary: PartyPopper,
  sorry: Flower2,
  proposal: Gem,
  mothers_day: Heart,
  fathers_day: Shield,
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
