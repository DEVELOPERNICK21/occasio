import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../../../shared/theme/tokens';

type Props = {
  size?: number;
  color?: string;
};

export function EmailOutlineIcon({
  size = 20,
  color = colors.white,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M3 7.5 12 13.5 21 7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
