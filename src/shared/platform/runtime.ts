import { Image, Platform } from 'react-native';

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

/** The file or URL a bundled asset (`require('./x.png')`) is served from, or null if it has none. */
export function resolveAssetUri(asset: number): string | null {
  const uri = Image.resolveAssetSource(asset)?.uri;
  return typeof uri === 'string' && uri ? uri : null;
}
