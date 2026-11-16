import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_COACH_STATE, type CoachState } from '../domain/festivalCoach';

const keyFor = (uid: string) => `occasio.festivalCoach.v1.${uid}`;

function stringMap(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item === 'string') out[key] = item;
    }
  }
  return out;
}

function parse(raw: string | null): CoachState {
  if (!raw) return EMPTY_COACH_STATE;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const shown: CoachState['shown'] = {};
    if (value.shown && typeof value.shown === 'object') {
      for (const [key, item] of Object.entries(value.shown as Record<string, unknown>)) {
        const entry = item as { count?: unknown; lastAt?: unknown };
        if (typeof entry?.count === 'number' && typeof entry?.lastAt === 'string') shown[key] = { count: entry.count, lastAt: entry.lastAt };
      }
    }
    return {
      snoozed: stringMap(value.snoozed),
      shown,
      lastNudgeAt: typeof value.lastNudgeAt === 'string' ? value.lastNudgeAt : null,
      lastNudgeKey: typeof value.lastNudgeKey === 'string' ? value.lastNudgeKey : null,
      prompts: stringMap(value.prompts),
      dismissedPrompts: stringMap(value.dismissedPrompts),
      lastPromptAt: typeof value.lastPromptAt === 'string' ? value.lastPromptAt : null,
    };
  } catch {
    return EMPTY_COACH_STATE;
  }
}

/** What the coach already showed and what was snoozed, on this device for this account. Never throws. */
export async function readCoachState(uid: string): Promise<CoachState> {
  try {
    return parse(await AsyncStorage.getItem(keyFor(uid)));
  } catch {
    return EMPTY_COACH_STATE;
  }
}

export async function writeCoachState(uid: string, state: CoachState): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(uid), JSON.stringify(state));
  } catch {
    // A nudge shown twice is better than a crash.
  }
}
