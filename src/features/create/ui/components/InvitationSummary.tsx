import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import {
  OCCASION_INFO,
  clockLabel,
  invitationTitle,
  shortDay,
  toInvitationPayload,
  type InvitationDraft,
} from '../../domain/invitation';

type Props = {
  invitation: InvitationDraft;
  /** The first photo is the portrait guests see on the page. */
  photoUri: string | null;
  note: string;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/**
 * What the invitation says, in the order guests read it. The page itself opens on the web, so this
 * is a faithful list of its contents, not a picture of it.
 */
export function InvitationSummary({ invitation, photoUri, note }: Props) {
  const info = OCCASION_INFO[invitation.occasion];
  const payload = toInvitationPayload(invitation);
  const replies = payload.rsvpWhatsapp
    ? `Guests reply to +${invitation.rsvpCountry} ${invitation.rsvpPhone.trim()} on WhatsApp`
    : 'No reply button: guests will not be able to answer on the page';

  return (
    <View style={styles.card}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" /> : null}
      <View style={styles.body}>
        <Text style={styles.kicker}>{`${info.label} invitation`}</Text>
        <Text style={styles.title}>{invitationTitle(invitation)}</Text>
        {payload.tagline ? <Text style={styles.tagline}>{payload.tagline}</Text> : null}

        <View style={styles.rows}>
          <Row label="Day" value={shortDay(payload.date)} />
          <Row label="Venue" value={[payload.venueName, payload.venueAddress].filter(Boolean).join(', ')} />
          {payload.dressCode ? <Row label="Dress code" value={payload.dressCode} /> : null}
          {payload.rsvpBy ? <Row label="Reply by" value={shortDay(payload.rsvpBy)} /> : null}
        </View>

        {payload.events.length > 0 ? (
          <View style={styles.events}>
            <Text style={styles.eventsLabel}>The plan</Text>
            {payload.events.map((event) => (
              <Text key={`${event.title}-${event.date}-${event.time}`} style={styles.event}>
                {[event.title, shortDay(event.date), clockLabel(event.time)].filter(Boolean).join(' · ')}
              </Text>
            ))}
          </View>
        ) : null}

        {note.trim() ? <Text style={styles.note}>{`“${note.trim()}”`}</Text> : null}
        <Text style={styles.replies}>{replies}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    aspectRatio: 5 / 4,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kicker: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  title: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  tagline: {
    fontSize: typography.sizeMd,
    color: colors.inkSoft,
  },
  rows: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowLabel: {
    width: 84,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  rowValue: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  events: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  eventsLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  event: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  note: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    fontStyle: 'italic',
    color: colors.inkSoft,
  },
  replies: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
