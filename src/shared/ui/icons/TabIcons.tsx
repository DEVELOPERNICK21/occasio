import {
  CircleUserRound,
  HeartPlus,
  History,
  WandSparkles,
  type LucideProps,
} from 'lucide-react-native';
import { colors } from '../../theme/tokens';

type IconProps = {
  size?: number;
  color: string;
  /** When true, icon renders for the elevated active bubble (white strokes). */
  active?: boolean;
};

/** Warm gray tuned for cream tab bar — reads clearer than flat muted brown. */
export const TAB_ICON_INACTIVE = '#A08E8A';

const INACTIVE_STROKE = 1.9;
const ACTIVE_STROKE = 2.2;

function iconProps({ size = 25, color, active = false }: IconProps): LucideProps {
  return {
    size,
    color: active ? colors.white : color,
    strokeWidth: active ? ACTIVE_STROKE : INACTIVE_STROKE,
    absoluteStrokeWidth: true,
  };
}

/** Magic wand — Create / compose a wish. */
export function CreateTabIcon(props: IconProps) {
  return <WandSparkles {...iconProps(props)} />;
}

/** Heart with plus — Vault / saved people. */
export function VaultTabIcon(props: IconProps) {
  return <HeartPlus {...iconProps(props)} />;
}

/** History clock — past shared wishes. */
export function HistoryTabIcon(props: IconProps) {
  return <History {...iconProps(props)} />;
}

/** Profile — Account settings. */
export function AccountTabIcon(props: IconProps) {
  return <CircleUserRound {...iconProps(props)} />;
}
