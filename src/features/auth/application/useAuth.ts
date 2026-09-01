import { useAuthContext } from './AuthProvider';
import type { GatedAction } from '../domain/types';

export function useAuth() {
  const {
    user,
    status,
    requestAuth,
    dismissSoftAuth,
    completeSoftAuth,
    signOutUser,
    signInGoogle,
    signInEmail,
    createEmailAccount,
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
    signInGoogle,
    signInEmail,
    createEmailAccount,
  };
}

export function useRequireAuth() {
  const { requestAuth, isSignedIn, isLoading } = useAuth();

  const requireAuth = (action: GatedAction, onAuthed: () => void) => {
    requestAuth(action, onAuthed);
  };

  return { requireAuth, isSignedIn, isLoading };
}
