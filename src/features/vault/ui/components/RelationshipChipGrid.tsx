import { Pressable, StyleSheet, View } from 'react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { ADD_PERSON_RELATIONSHIP_OPTIONS } from '../../domain/relationshipTypes';
import type { RelationshipType } from '../../domain/types';

type Props = {
  value: RelationshipType | null;
  onChange: (value: RelationshipType) => void;
};

export function RelationshipChipGrid({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {ADD_PERSON_RELATIONSHIP_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              triggerCardHaptic();
              onChange(option.id);
            }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {option.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.6,
    color: colors.accent,
  },
  chipLabelSelected: {
    color: colors.white,
  },
});
