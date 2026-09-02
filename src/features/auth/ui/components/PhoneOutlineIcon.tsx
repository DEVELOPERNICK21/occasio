import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../../../shared/theme/tokens';

type Props = {
  size?: number;
  color?: string;
};

export function PhoneOutlineIcon({
  size = 20,
  color = colors.white,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M10 6h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M11.5 17.5h1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}
