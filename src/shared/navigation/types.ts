import type { NavigatorScreenParams } from '@react-navigation/native';

export type CreateStackParamList = {
  TemplatePicker: undefined;
  AddPhotos: undefined;
  Details: undefined;
  Preview: undefined;
  ShareSuccess: { shareUrl: string; expiresAt: string };
};

export type MainTabParamList = {
  CreateTab: NavigatorScreenParams<CreateStackParamList>;
  VaultTab: undefined;
  HistoryTab: undefined;
  AccountTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
