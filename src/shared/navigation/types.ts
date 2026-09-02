import type { NavigatorScreenParams } from '@react-navigation/native';

export type CreateStackParamList = {
  CreateHome: undefined;
  TemplatePicker: undefined;
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

export type VaultStackParamList = {
  VaultList: undefined;
  AddPerson: { prefilledName?: string };
  PersonDetail: { personId: string };
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
