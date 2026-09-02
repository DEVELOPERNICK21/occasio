import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
} as const;

/** Light tap feedback for tab selection and primary chrome actions. */
export function triggerTabHaptic(): void {
  ReactNativeHapticFeedback.trigger('impactLight', HAPTIC_OPTIONS);
}

/** Occasion card selection — slightly stronger than tab taps. */
export function triggerCardHaptic(): void {
  ReactNativeHapticFeedback.trigger('impactMedium', HAPTIC_OPTIONS);
}

/** Copy / success confirmation — subtle but distinct from tab taps. */
export function triggerSuccessHaptic(): void {
  ReactNativeHapticFeedback.trigger('notificationSuccess', HAPTIC_OPTIONS);
}
