import { forwardRef, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { CircleAlert, Eye, EyeOff, X } from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Text } from './Text';
import { TextInput } from './TextInput';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** What is wrong, in words. Turns the field red and is read out to screen readers. */
  error?: string | null;
  /** Quiet help under the field; replaced by the error when there is one. */
  hint?: string;
  /** A small icon at the start of the field. */
  leftIcon?: ComponentType<LucideProps>;
  /** A password: hidden by default, with an eye button to show or hide it. */
  secret?: boolean;
  /** A clear (x) button while the field has text and focus. */
  clearable?: boolean;
};

const ICON_SIZE = 20;
const FIELD_HEIGHT = 54;

/**
 * The app's text field: label above, optional icon, a coral ring when focused,
 * a red one with the reason underneath when something is wrong. Passwords get an
 * eye button, because nobody should have to retype a password to be sure of it.
 * Pass `returnKeyType` and `onSubmitEditing` to move on to the next field.
 */
export const TextField = forwardRef<import('react-native').TextInput, Props>(function TextFieldImpl(
  {
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    secret = false,
    clearable = false,
    value,
    onChangeText,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error);
  const iconColor = hasError ? colors.error : focused ? colors.accent : colors.muted;
  const showClear = clearable && focused && Boolean(value) && editable && !secret;

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          hasError && styles.boxError,
          !editable && styles.boxDisabled,
        ]}
      >
        {LeftIcon ? (
          <View style={styles.leading} pointerEvents="none">
            <LeftIcon size={ICON_SIZE} color={iconColor} strokeWidth={2} absoluteStrokeWidth />
          </View>
        ) : null}
        <TextInput
          {...rest}
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={secret && !revealed}
          // Passwords are never auto-corrected or capitalised, or remembered by the keyboard.
          autoCapitalize={secret ? 'none' : rest.autoCapitalize}
          autoCorrect={secret ? false : rest.autoCorrect}
          spellCheck={secret ? false : rest.spellCheck}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          accessibilityLabel={label}
          accessibilityHint={error ?? undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, LeftIcon ? styles.inputWithIcon : null]}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: revealed }}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={6}
            style={({ pressed }) => [styles.trailing, pressed && styles.trailingPressed]}
          >
            {revealed ? (
              <EyeOff size={ICON_SIZE} color={colors.inkSoft} strokeWidth={2} absoluteStrokeWidth />
            ) : (
              <Eye size={ICON_SIZE} color={colors.inkSoft} strokeWidth={2} absoluteStrokeWidth />
            )}
          </Pressable>
        ) : null}
        {showClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            onPress={() => onChangeText?.('')}
            hitSlop={6}
            style={({ pressed }) => [styles.trailing, pressed && styles.trailingPressed]}
          >
            <X size={18} color={colors.muted} strokeWidth={2.2} absoluteStrokeWidth />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <CircleAlert size={14} color={colors.error} strokeWidth={2.2} absoluteStrokeWidth />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  box: {
    minHeight: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    // A constant width, so focusing never nudges the layout; only the colour changes.
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  boxFocused: {
    borderColor: colors.accent,
  },
  boxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  boxDisabled: {
    backgroundColor: colors.sidebar,
    opacity: 0.8,
  },
  leading: {
    width: ICON_SIZE + spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: FIELD_HEIGHT - 4,
    fontSize: typography.sizeMd,
    color: colors.ink,
    paddingVertical: 0,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  trailing: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  trailingPressed: {
    backgroundColor: colors.sidebar,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  error: {
    flex: 1,
    fontSize: typography.sizeXs + 1,
    lineHeight: (typography.sizeXs + 1) * 1.4,
    color: colors.error,
  },
  hint: {
    fontSize: typography.sizeXs + 1,
    lineHeight: (typography.sizeXs + 1) * 1.4,
    color: colors.muted,
  },
});
