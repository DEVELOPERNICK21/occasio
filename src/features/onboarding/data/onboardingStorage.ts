import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'occasio.onboarding.completed';

export async function readOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === 'true';
}

export async function writeOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}
