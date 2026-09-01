import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseConfig } from '../../../shared/firebase/config';

let configured = false;

/** Call once at app start — configures Google Sign-In for Firebase Auth. */
export function configureGoogleSignIn(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: firebaseConfig.googleWebClientId,
  });
  configured = true;
}
