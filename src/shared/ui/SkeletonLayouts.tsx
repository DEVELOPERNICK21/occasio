import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme/tokens';
import { SkeletonBone } from './SkeletonBone';

type Props = {
  /** Reserve space above the floating tab bar. */
  withTabBar?: boolean;
};

export function SessionBootSkeleton({ withTabBar = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing['2xl'],
          paddingBottom: insets.bottom + (withTabBar ? spacing['2xl'] : spacing.lg),
        },
      ]}
    >
      <SkeletonBone width={88} height={88} borderRadius={radius.full} style={styles.logo} />
      <SkeletonBone width={160} height={18} borderRadius={radius.sm} />
      <SkeletonBone width={220} height={14} borderRadius={radius.sm} style={styles.gapSm} />
      <SkeletonBone width={200} height={14} borderRadius={radius.sm} />
    </View>
  );
}

export function AppBootSkeleton() {
  return (
    <View style={styles.appBoot}>
      <SkeletonBone width={72} height={72} borderRadius={radius.full} />
      <SkeletonBone width={120} height={16} borderRadius={radius.sm} style={styles.gapMd} />
    </View>
  );
}

export function SearchFieldSkeleton() {
  return <SkeletonBone height={44} borderRadius={radius.full} />;
}

export function MilestoneCardSkeleton() {
  return (
    <View style={styles.milestone}>
      <SkeletonBone width="36%" height={12} />
      <SkeletonBone width="72%" height={16} style={styles.gapSm} />
      <SkeletonBone width="100%" height={14} style={styles.gapSm} />
      <SkeletonBone width="88%" height={14} />
    </View>
  );
}

export function OccasionCardSkeleton() {
  return (
    <View style={styles.occasionCard}>
      <SkeletonBone height={3} borderRadius={0} />
      <View style={styles.occasionBody}>
        <View style={styles.row}>
          <SkeletonBone width={40} height={40} borderRadius={radius.md} />
          <View style={styles.rowCopy}>
            <SkeletonBone width="70%" height={14} />
            <SkeletonBone width="45%" height={12} style={styles.gapSm} />
          </View>
          <SkeletonBone width={56} height={24} borderRadius={radius.full} />
        </View>
        <View style={styles.rowActions}>
          <SkeletonBone width="48%" height={48} borderRadius={radius.full} />
          <SkeletonBone width="48%" height={48} borderRadius={radius.full} />
        </View>
      </View>
    </View>
  );
}

function ListCardSkeleton() {
  return (
    <View style={styles.listCard}>
      <View style={styles.row}>
        <SkeletonBone width={44} height={44} borderRadius={radius.md} />
        <View style={styles.rowCopy}>
          <SkeletonBone width="55%" height={16} />
          <SkeletonBone width="32%" height={12} borderRadius={radius.full} style={styles.gapSm} />
        </View>
        <SkeletonBone width={20} height={20} borderRadius={radius.sm} />
      </View>
      <SkeletonBone width="100%" height={14} style={styles.gapMd} />
      <SkeletonBone width="78%" height={14} style={styles.gapSm} />
      <View style={styles.rowActions}>
        <SkeletonBone width="48%" height={36} borderRadius={radius.md} />
        <SkeletonBone width="48%" height={36} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function VaultListSkeleton() {
  return (
    <View style={styles.stack}>
      <SearchFieldSkeleton />
      <ListCardSkeleton />
      <ListCardSkeleton />
      <ListCardSkeleton />
    </View>
  );
}

export function HistorySummarySkeleton() {
  return (
    <View style={styles.summary}>
      <SkeletonBone width="40%" height={14} />
      <View style={styles.summaryRow}>
        <SkeletonBone width="30%" height={28} borderRadius={radius.sm} />
        <SkeletonBone width="30%" height={28} borderRadius={radius.sm} />
        <SkeletonBone width="30%" height={28} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export function HistoryListSkeleton() {
  return (
    <View style={styles.stack}>
      <SearchFieldSkeleton />
      <HistorySummarySkeleton />
      <ListCardSkeleton />
      <ListCardSkeleton />
    </View>
  );
}

export function PersonDetailSkeleton() {
  return (
    <View style={styles.detailCard}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.detailRow}>
          <SkeletonBone width="38%" height={12} />
          <SkeletonBone width="52%" height={16} style={styles.gapSm} />
        </View>
      ))}
      <SkeletonBone height={48} borderRadius={radius.md} style={styles.gapLg} />
    </View>
  );
}

export function PreviewCardSkeleton() {
  return (
    <View style={styles.previewCard}>
      <SkeletonBone height={180} borderRadius={0} />
      <View style={styles.previewBody}>
        <SkeletonBone width="32%" height={12} style={styles.centerSelf} />
        <SkeletonBone width="68%" height={18} style={[styles.gapMd, styles.centerSelf]} />
        <SkeletonBone width="54%" height={22} style={[styles.gapSm, styles.centerSelf]} />
        <SkeletonBone width="100%" height={14} style={styles.gapMd} />
        <SkeletonBone width="92%" height={14} style={styles.gapSm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  appBoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: spacing.lg,
  },
  gapSm: {
    marginTop: spacing.sm,
  },
  gapMd: {
    marginTop: spacing.md,
  },
  gapLg: {
    marginTop: spacing.lg,
  },
  stack: {
    gap: spacing.lg,
  },
  milestone: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
  },
  occasionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  occasionBody: {
    padding: spacing.md,
  },
  listCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowCopy: {
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  summary: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  previewBody: {
    padding: spacing.md,
  },
  centerSelf: {
    alignSelf: 'center',
  },
});
