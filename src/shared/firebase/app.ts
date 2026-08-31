import firebase from '@react-native-firebase/app';
import { firebaseConfig } from './config';

/** Default Firebase app (initialized via google-services.json / plist). */
export function getFirebaseApp() {
  return firebase.app();
}

export function isFirebaseConfigured(): boolean {
  try {
    const app = firebase.app();
    return app.options.projectId === firebaseConfig.projectId;
  } catch {
    return false;
  }
}

export function getFirebaseProjectId(): string | undefined {
  try {
    return firebase.app().options.projectId;
  } catch {
    return undefined;
  }
}
