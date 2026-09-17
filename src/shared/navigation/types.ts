import type { NavigatorScreenParams } from '@react-navigation/native';

export type CreateStackParamList = {
  CreateHome: undefined;
  WhoFor: undefined;
  Occasion: undefined;
  TemplateRecommend: undefined;
  AddPhotos: undefined;
  Details: undefined;
  Preview: undefined;
  ShareSuccess: {
    shareUrl: string;
    expiresAt: string;
    creationId: string;
    shareSlug: string;
  };
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
  VaultTab: NavigatorScreenParams<VaultStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  AccountTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
