import { Platform } from 'react-native';

export type AppPlatform = 'ios' | 'android' | 'other';

export function appPlatform(): AppPlatform {
  if (Platform.OS === 'ios') {
    return 'ios';
  }
  if (Platform.OS === 'android') {
    return 'android';
  }
  return 'other';
}
