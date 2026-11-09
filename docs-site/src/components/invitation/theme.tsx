'use client';

import { createContext, useContext } from 'react';
import { THEMES, type InvitationTheme } from '@/lib/invitationTheme';

/** The look of the invitation being shown, for every ornament below it. */
export const ThemeContext = createContext<InvitationTheme>(THEMES.wedding);

export function useInvitationTheme(): InvitationTheme {
  return useContext(ThemeContext);
}
