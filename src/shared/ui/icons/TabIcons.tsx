import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/tokens';

type IconProps = {
  size?: number;
  color: string;
  /** When true, icon renders for the elevated active bubble (white strokes). */
  active?: boolean;
};

const STROKE = 1.85;

function strokeColor(color: string, active: boolean): string {
  return active ? colors.white : color;
}

/** Magic wand — Create / compose a wish (Stitch-style line icon). */
export function CreateTabIcon({ size = 23, color, active = false }: IconProps) {
  const stroke = strokeColor(color, active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 19L15.5 8.5"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M14 6l4 4"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M17.5 3.5l1 1M19.5 7.5l1-1M15.5 5.5l-1 1"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M5 19l-1.5 3 3-1.5"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Bookmark ribbon — Vault / saved people. */
export function VaultTabIcon({ size = 23, color, active = false }: IconProps) {
  const stroke = strokeColor(color, active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5V20l-6.5-3.5L5.5 20V6a1.5 1.5 0 0 1 1.5-1.5z"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.5v5.5"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M9.5 11h5"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Circular clock — History / past cards. */
export function HistoryTabIcon({ size = 23, color, active = false }: IconProps) {
  const stroke = strokeColor(color, active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth={STROKE} />
      <Path
        d="M12 8v4.25l2.75 1.75"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!active ? (
        <Path
          d="M12 4V3M12 21v-1M4 12H3M21 12h-1"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.35}
        />
      ) : null}
    </Svg>
  );
}

/** Person silhouette — Account (Stitch profile style). */
export function AccountTabIcon({ size = 23, color, active = false }: IconProps) {
  const stroke = strokeColor(color, active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.25" r="3.25" stroke={stroke} strokeWidth={STROKE} />
      <Path
        d="M6.25 19.25c.65-2.85 2.75-4.25 5.75-4.25s5.1 1.4 5.75 4.25"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
