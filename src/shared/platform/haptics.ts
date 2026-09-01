import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
} as const;

/** Light tap feedback for tab selection and primary chrome actions. */
export function triggerTabHaptic(): void {
  ReactNativeHapticFeedback.trigger('impactLight', HAPTIC_OPTIONS);
}
