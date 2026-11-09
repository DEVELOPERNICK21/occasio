import type { NavigatorScreenParams } from '@react-navigation/native';

export type CreateStackParamList = {
  CreateHome: undefined;
  /** Every badge and how to earn it. */
  Badges: undefined;
  WhoFor: undefined;
  Occasion: undefined;
  /** Every festival and holiday. `fromOccasion`: they already said who it is for, so keep that. */
  Holidays: { fromOccasion?: boolean } | undefined;
  /** `openFrame`: a frame to open straight away (set when coming back from adding photos for it). */
  TemplateRecommend: { openFrame?: string } | undefined;
  /** `forFrame`: the frame the person chose that needs more photos than they have. */
  AddPhotos: { forFrame?: string } | undefined;
  Details: undefined;
  Preview: undefined;
  ShareSuccess: {
    shareUrl: string;
    expiresAt: string;
    creationId: string;
    shareSlug: string;
    /** True when Preview saved via PATCH — same public URL. */
    wasUpdated?: boolean;
  };
};

/**
 * The Invitations tab. It makes its own invitation steps, then hands over to the same photo, review
 * and share screens as cards do, so the allowance, paywall and upload rules live in one place.
 */
export type InviteStackParamList = {
  InviteHome: undefined;
  InviteDesign: undefined;
  InviteDetails: undefined;
  InvitePlan: undefined;
  InviteReply: undefined;
  AddPhotos: CreateStackParamList['AddPhotos'];
  Preview: CreateStackParamList['Preview'];
  ShareSuccess: CreateStackParamList['ShareSuccess'];
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { entryId: string };
};

export type LinkCreationParam = {
  creationId: string;
  templateType: string | null;
  templateId: string | null;
  photoRefs: string[];
  message: string;
  fromName: string | null;
};

export type VaultStackParamList = {
  VaultList: { linkCreation?: LinkCreationParam } | undefined;
  AddPerson: { prefilledName?: string; linkCreation?: LinkCreationParam };
  PersonDetail: { personId: string };
  ScheduledSendReview: { sendId: string };
};

export type MainTabParamList = {
  CreateTab: NavigatorScreenParams<CreateStackParamList>;
  InvitesTab: NavigatorScreenParams<InviteStackParamList>;
  VaultTab: NavigatorScreenParams<VaultStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  AccountTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
