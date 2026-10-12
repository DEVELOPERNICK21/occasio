import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as RNTextInput,
} from 'react-native';
import { PenLine } from 'lucide-react-native';
import { Field } from '../../../../shared/ui/Field';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { useAuth } from '../../../auth/application/useAuth';
import { AccountToggle } from '../../../auth/ui/components/AccountToggle';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
} from '../../domain/experienceMode';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';
import { MAX_REASONS, REASON_MAX_CHARS } from '../../domain/creationRules';
import { messageStarters } from '../../domain/messageStarters';

type Props = NativeStackScreenProps<CreateStackParamList, 'Details'>;

const MESSAGE_MAX = 280;
const STARTER_WIDTH = 236;

export function DetailsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    draft,
    isEditing,
    setRecipientName,
    setFromName,
    setMessage,
    setBalloonLine,
    setReasons,
    setPasscode,
    setPasscodeHint,
    setExperienceMode,
  } = useCreateDraftContext();

  useEffect(() => {
    if (draft.fromName.trim()) return;
    const accountName = user?.displayName?.trim();
    if (accountName) {
      setFromName(accountName);
    }
  }, [draft.fromName, setFromName, user?.displayName]);

  const interactiveDefault = isInteractiveExperience(draft.templateType);
  const interactiveOn =
    resolveDraftExperienceMode(draft.templateType, draft.experienceMode) ===
    'story';
  const reasonRows =
    draft.reasons.length > 0 ? draft.reasons : ['', '', ''];
  const [lockOn, setLockOn] = useState(draft.passcode.length > 0);
  const messageRef = useRef<RNTextInput>(null);
  const starters = messageStarters(draft.occasion);
  const balloonWords = draft.balloonLine
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <Screen
      title="Your words"
      subtitle="Their name and a line from you."
      progress={<CreateProgress stage="details" />}
      onBack={() => navigation.goBack()}
      headerAction={
        <ScreenHeaderAction
          label="Preview"
          disabled={!draft.recipientName.trim()}
          onPress={() => navigation.navigate('Preview')}
        />
      }
    >
      <CreateNudge stage="details" />
      <View style={styles.form}>
        <Field
          label="To"
          hint={
            isEditing
              ? 'A link is for one person — spelling fixes only'
              : undefined
          }
        >
          <TextInput
            placeholder="Recipient name"
            placeholderTextColor={colors.muted}
            value={draft.recipientName}
            onChangeText={setRecipientName}
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>
        <Field label="From" hint="Signs the card so they know who sent it">
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            value={draft.fromName}
            onChangeText={setFromName}
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>
        <Field
          label="Message"
          hint={`${draft.message.length}/${MESSAGE_MAX} characters`}
        >
          <View style={styles.messageStack}>
            {draft.message.trim().length === 0 ? (
              <View style={styles.starters}>
                <Text style={styles.startersLabel}>Not sure where to start? Tap one and finish it.</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.starterRow}
                >
                  {starters.map((starter) => (
                    <Pressable
                      key={starter}
                      accessibilityRole="button"
                      accessibilityLabel={`Start with: ${starter.trim()}`}
                      onPress={() => {
                        setMessage(starter);
                        messageRef.current?.focus();
                      }}
                      style={({ pressed }) => [styles.starter, pressed && styles.starterPressed]}
                    >
                      <PenLine size={14} color={colors.accentHover} strokeWidth={2} absoluteStrokeWidth />
                      <Text style={styles.starterText} numberOfLines={2}>
                        {starter.trim()}…
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <TextInput
              ref={messageRef}
              placeholder="Write something personal"
              placeholderTextColor={colors.muted}
              value={draft.message}
              onChangeText={(text) => setMessage(text.slice(0, MESSAGE_MAX))}
              multiline
              style={[styles.input, styles.textArea]}
            />
          </View>
        </Field>

        {interactiveDefault ? (
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>Interactive experience</Text>
              <Text style={styles.toggleHint}>
                Balloons, candle, gift, then photos and your letter
              </Text>
            </View>
            <AccountToggle
              value={interactiveOn}
              onValueChange={(on) =>
                setExperienceMode(on ? 'story' : 'classic')
              }
            />
          </View>
        ) : null}

        {interactiveDefault && interactiveOn ? (
          <Field
            label="Balloon line"
            hint={
              draft.balloonLine.trim()
                ? `${balloonWords}/8 words · pops inside balloons`
                : 'Optional · default: “You are so special”'
            }
          >
            <TextInput
              placeholder="You are so special"
              placeholderTextColor={colors.muted}
              value={draft.balloonLine}
              onChangeText={(text) => {
                const words = text.trim().split(/\s+/).filter(Boolean);
                if (words.length > 8) {
                  setBalloonLine(words.slice(0, 8).join(' '));
                  return;
                }
                setBalloonLine(text.slice(0, 72));
              }}
              style={styles.input}
              maxLength={72}
              autoCapitalize="sentences"
            />
          </Field>
        ) : null}

        {interactiveDefault && interactiveOn ? (
          <Field
            label="Reasons they open one by one"
            hint="Optional · up to 5 short lines, like “You laugh at my worst jokes”"
          >
            <View style={styles.reasons}>
              {reasonRows.map((value, index) => (
                <TextInput
                  key={index}
                  placeholder={`Reason ${index + 1}`}
                  placeholderTextColor={colors.muted}
                  value={value}
                  onChangeText={(text) => {
                    const next = [...reasonRows];
                    next[index] = text.slice(0, REASON_MAX_CHARS);
                    setReasons(next);
                  }}
                  style={styles.input}
                  maxLength={REASON_MAX_CHARS}
                />
              ))}
              {reasonRows.length < MAX_REASONS ? (
                <Text
                  style={styles.addReason}
                  onPress={() => setReasons([...reasonRows, ''])}
                  accessibilityRole="button"
                >
                  Add another reason
                </Text>
              ) : null}
            </View>
          </Field>
        ) : null}

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Lock with a passcode</Text>
            <Text style={styles.toggleHint}>
              {draft.hasPasscode && !lockOn
                ? 'This card is already locked. Turn on to set a new code.'
                : 'They enter 4 digits to open it — try your anniversary date'}
            </Text>
          </View>
          <AccountToggle
            value={lockOn}
            onValueChange={(on) => {
              setLockOn(on);
              if (!on) {
                setPasscode('');
                setPasscodeHint('');
              }
            }}
          />
        </View>

        {lockOn ? (
          <>
            <Field
              label="Passcode"
              hint={
                draft.passcode.length > 0 && draft.passcode.length < 4
                  ? '4 digits needed'
                  : 'Tell them the code separately, or hint at it'
              }
            >
              <TextInput
                placeholder="0000"
                placeholderTextColor={colors.muted}
                value={draft.passcode}
                onChangeText={setPasscode}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={4}
              />
            </Field>
            <Field label="Hint" hint="Optional · shown on the lock screen">
              <TextInput
                placeholder="The day we met"
                placeholderTextColor={colors.muted}
                value={draft.passcodeHint}
                onChangeText={setPasscodeHint}
                style={styles.input}
                maxLength={60}
              />
            </Field>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  textArea: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: typography.sizeMd,
    fontWeight: '600',
    color: colors.ink,
  },
  reasons: {
    gap: spacing.sm,
  },
  messageStack: {
    gap: spacing.sm,
  },
  starters: {
    gap: spacing.sm,
  },
  startersLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  starterRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  starter: {
    width: STARTER_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  starterPressed: {
    backgroundColor: colors.sidebar,
  },
  starterText: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.35,
    color: colors.inkSoft,
  },
  addReason: {
    fontSize: typography.sizeSm,
    color: colors.accent,
    paddingVertical: spacing.xs,
  },
  toggleHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.4,
  },
});
