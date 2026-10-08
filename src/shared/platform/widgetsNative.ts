import { NativeModules } from 'react-native';

/** Native side of the home-screen widgets (`OccasioWidgets`, Swift / Kotlin). */
export type OccasioWidgetsModule = {
  setSnapshot(json: string): Promise<void>;
  clear(): Promise<void>;
};

/** `null` when the app build has no widget module (Jest, older native builds). */
export function getWidgetsNativeModule(): OccasioWidgetsModule | null {
  const mod = NativeModules.OccasioWidgets as Partial<OccasioWidgetsModule> | undefined;
  return mod && typeof mod.setSnapshot === 'function' && typeof mod.clear === 'function'
    ? (mod as OccasioWidgetsModule)
    : null;
}
