import { ExternalLink } from 'lucide-react-native';
import { Alert, Linking, Pressable, StyleSheet } from 'react-native';
import { env } from '../../../../shared/config/env';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import {
  OCCASION_INFO,
  invitationDemoUrl,
  type InvitationDesign,
  type InvitationOccasion,
} from '../../domain/invitation';

type Props = {
  occasion: InvitationOccasion;
  design: InvitationDesign;
  /** Words on the link. */
  label?: string;
};

/** Opens a live sample of the invitation in the browser, so the host can see it move before choosing. */
export function InviteExampleLink({ occasion, design, label = 'See an example' }: Props) {
  const url = invitationDemoUrl(env.shareBaseUrl, occasion, design);
  const open = () => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open the example', `Open this address in your browser:\n${url}`);
    });
  };
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: a ${OCCASION_INFO[occasion].label.toLowerCase()} invitation, opens in your browser`}
      hitSlop={8}
      onPress={open}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <ExternalLink size={14} color={colors.accentHover} strokeWidth={2.2} absoluteStrokeWidth />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
});
