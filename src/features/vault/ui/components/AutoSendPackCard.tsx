import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { formatPackSummary } from '../../domain/vaultOccasion';
import type { AutoSendPack } from '../../domain/types';

type Props = {
  pack: AutoSendPack | null;
  lastCreationId: string | null;
  editing: boolean;
  message: string;
  onChangeMessage: (text: string) => void;
};

export function AutoSendPackCard({
  pack,
  lastCreationId,
  editing,
  message,
  onChangeMessage,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Auto-send pack</Text>
      {editing ? (
        <>
          <TextInput
            value={message}
            onChangeText={onChangeMessage}
            placeholder="Message for the next card"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Text style={styles.hint}>
            Photos come from your last card or the Create flow. Save for auto-send
            after you share a card.
          </Text>
        </>
      ) : (
        <Text style={styles.summary}>{formatPackSummary(pack, lastCreationId)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summary: {
    fontSize: typography.sizeMd,
    color: colors.ink,
    lineHeight: typography.sizeMd * 1.4,
  },
  input: {
    minHeight: 88,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    fontSize: typography.sizeMd,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.inkSoft,
  },
});
