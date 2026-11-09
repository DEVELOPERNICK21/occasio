import type { MouseEvent } from 'react';
import type { Invitation, InvitationEvent } from '@/lib/invitation';
import type { InvitationTheme } from '@/lib/invitationTheme';
import type { RecipientCard } from '@/lib/recipientCard';
import type { BurstKind } from '../bursts';

/**
 * Everything a scene needs from the player: the invitation, the shared game state (which events
 * are collected, whether the entrance is open) and the effects it can trigger. A scene owns its
 * entrance, its story and its art; it does not own any data.
 */
export type SceneContext = {
  card: RecipientCard & { invitation: Invitation };
  slug: string;
  invitation: Invitation;
  theme: InvitationTheme;
  title: string;
  initials: string;
  hostLine: string;
  /** Every photo, the first being the portrait. */
  photos: string[];
  /** The photos for the swipeable stack: the portrait comes last. */
  stackPhotos: string[];
  /** The events, or the day itself when none were listed. */
  entries: InvitationEvent[];
  hasReply: boolean;

  /** True from the moment the entrance starts to open. */
  opened: boolean;
  /** True once the entrance has left the screen. */
  gateGone: boolean;
  /** The entrance calls this as it starts to open, with the point it opens from. */
  open: (x: number, y: number) => void;
  /** The entrance calls this once it has left the screen. */
  gone: () => void;

  /** Which events have been collected (a garland, a leaf, a window). */
  lit: ReadonlySet<number>;
  toggleToken: (index: number, element: HTMLElement) => void;

  fire: (x: number, y: number, kind?: BurstKind, scale?: number) => void;
  fireFrom: (element: Element | null, kind?: BurstKind, scale?: number) => void;
  /** Called when the guest sends their reply, so the page can celebrate. */
  sendReply: (pass: HTMLElement | null, answer: 'yes' | 'no') => void;
  /** Smooth-scrolls to the reply pass. */
  goToReply: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** The page-wide warm glow, for a scene that wants to trigger its own. */
  flash: () => void;
};
