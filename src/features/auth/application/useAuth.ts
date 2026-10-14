import { useAuthContext } from './AuthProvider';
import { needsEmailVerification } from '../domain/emailVerification';
import type { GatedAction } from '../domain/types';

export function useAuth() {
  const {
    user,
    status,
    requestAuth,
    dismissSoftAuth,
    completeSoftAuth,
    signOutUser,
    deleteAccountUser,
    signInGoogle,
    signInEmail,
    createEmailAccount,
    sendVerificationEmail,
    refreshEmailVerification,
    softAuthRequest,
  } = useAuthContext();

  return {
    user,
    status,
    isSignedIn: status === 'signed_in' && user !== null,
    isLoading: status === 'loading',
    softAuthRequest,
    requestAuth,
    dismissSoftAuth,
    completeSoftAuth,
    signOutUser,
    deleteAccountUser,
    signInGoogle,
    signInEmail,
    createEmailAccount,
    sendVerificationEmail,
    refreshEmailVerification,
    needsEmailVerification: needsEmailVerification(user),
  };
}

export function useRequireAuth() {
  const { requestAuth, isSignedIn, isLoading } = useAuth();

  const requireAuth = (action: GatedAction, onAuthed: () => void) => {
    requestAuth(action, onAuthed);
  };

  return { requireAuth, isSignedIn, isLoading };
}
