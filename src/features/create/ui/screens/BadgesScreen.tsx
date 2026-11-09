import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Button } from '../../../../shared/ui/Button';
import { Pip } from '../../../../shared/ui/Pip';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { useAuth } from '../../../auth/application/useAuth';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useWishJourney } from '../../application/useWishJourney';
import {
  BADGE_DESCRIPTIONS,
  badgePipLine,
  badgePipMood,
  type WishBadge,
} from '../../domain/wishJourney';
import { BadgeMedal } from '../components/BadgeMedal';

type Props = NativeStackScreenProps<CreateStackParamList, 'Badges'>;

/** Every badge, earned or not, and how to earn it. Tap one to see how close you are. */
export function BadgesScreen({ navigation }: Props) {
  const { isSignedIn } = useAuth();
  const { startQuickCreate } = useCreateDraftContext();
  const { journey } = useWishJourney(isSignedIn);
  const [selectedId, setSelectedId] = useState<WishBadge['id'] | null>(null);

  // Open on the one to aim for next, or the first earned once everything is.
  useEffect(() => {
    if (selectedId === null) {
      setSelectedId((journey.nextBadge ?? journey.badges[0])?.id ?? null);
    }
  }, [journey.badges, journey.nextBadge, selectedId]);

  const selected = journey.badges.find((badge) => badge.id === selectedId) ?? null;
  const earned = journey.badges.filter((badge) => badge.unlocked).length;

  const makeWish = () => {
    triggerCardHaptic();
    startQuickCreate();
    navigation.navigate('AddPhotos');
  };

  return (
    <Screen
      title="Badges"
      subtitle={`${earned} of ${journey.badges.length} earned`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.level}>
        <View style={styles.levelTile}>
          <Trophy size={20} color={colors.white} strokeWidth={2.2} absoluteStrokeWidth />
        </View>
        <View style={styles.levelCopy}>
          <Text style={styles.levelTitle}>
            Level {journey.level.level} · {journey.level.title}
          </Text>
          <Text style={styles.levelCaption}>{journey.caption}</Text>
        </View>
      </View>

      {selected ? (
        <View style={styles.detail} accessibilityLiveRegion="polite">
          <View style={styles.detailTop}>
            <BadgeMedal id={selected.id} label={selected.label} unlocked={selected.unlocked} size={64} />
            <View style={styles.detailCopy}>
              <Text style={styles.detailTitle}>{selected.label}</Text>
              <Text style={styles.detailText}>
                {selected.unlocked ? BADGE_DESCRIPTIONS[selected.id] : selected.hint}
              </Text>
            </View>
          </View>
          {selected.unlocked ? (
            <View style={styles.pip}>
              <Pip mood={badgePipMood(selected.id)} size={52} bob={false} />
              <Text style={styles.pipLine}>{badgePipLine(selected.id, journey.firstRecipient)}</Text>
            </View>
          ) : (
            <View
              style={styles.bar}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: selected.need, now: selected.have }}
            >
              <View style={[styles.fill, { width: `${Math.max(4, (selected.have / selected.need) * 100)}%` }]} />
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.grid}>
        {journey.badges.map((badge, index) => (
          <View key={badge.id} style={styles.gridCell}>
            <BadgeMedal
              id={badge.id}
              label={badge.label}
              unlocked={badge.unlocked}
              index={index}
              size={52}
              selected={badge.id === selectedId}
              onPress={() => setSelectedId(badge.id)}
            />
          </View>
        ))}
      </View>

      <ScreenActions>
        <Button label="Make a wish" onPress={makeWish} />
      </ScreenActions>
    </Screen>
  );
}

const styles = StyleSheet.create({
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  levelTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCopy: {
    flex: 1,
    minWidth: 0,
  },
  levelTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  levelCaption: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  detail: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  detailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  detailText: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  pip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
  },
  pipLine: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.ink,
  },
  bar: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    rowGap: spacing.md,
  },
  gridCell: {
    width: '25%',
    alignItems: 'center',
  },
});
