import { getWidgetsNativeModule } from '../../../shared/platform/widgetsNative';
import type { WidgetSnapshot } from '../domain/widgetSnapshot';

/**
 * The only file that touches the native widget bridge (`OccasioWidgets`).
 * It writes into App Group storage on iOS and SharedPreferences on Android,
 * then asks the system to redraw. Missing module (Jest, older builds) is a no-op.
 */
export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<boolean> {
  const mod = getWidgetsNativeModule();
  if (!mod) {
    return false;
  }
  try {
    await mod.setSnapshot(JSON.stringify(snapshot));
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widgets] could not write snapshot', error);
    }
    return false;
  }
}

/** Sign-out and account deletion call this so nothing lingers on the home screen. */
export async function clearWidgetSnapshot(): Promise<boolean> {
  const mod = getWidgetsNativeModule();
  if (!mod) {
    return false;
  }
  try {
    await mod.clear();
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widgets] could not clear snapshot', error);
    }
    return false;
  }
}
