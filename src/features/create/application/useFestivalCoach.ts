import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { readCoachState, writeCoachState } from '../data/festivalCoachStorage';
import {
  EMPTY_COACH_STATE,
  chooseNudge,
  markShown,
  planOpportunities,
  regionFromLocale,
  snooze,
  type CoachState,
  type Region,
} from '../domain/festivalCoach';
import { choosePlanPrompt, dismissPrompt, markPromptShown } from '../domain/homePlan';

type Source = {
  people: ReadonlyArray<{ id: string; personName: string; relationshipType: string | null }>;
  entries: ReadonlyArray<{ recipientName: string; templateType: string; createdAt: string }>;
};

type Args = Source & {
  /** The signed-in account, or null for a guest (nothing is remembered for a guest). */
  uid: string | null;
  now: Date;
  /** How many wishes can be made right now, when known. */
  wishesReady: number | null;
  /** Off while the screen is not in view, so nothing is counted as shown. */
  enabled: boolean;
  /** Overrides the device's region (for tests, or a person's own setting later). */
  region?: Region | null;
  /** On a paid plan, so nothing here ever asks for a sale. */
  isPro?: boolean;
  /** Birthdays coming up in the Vault, for a plan prompt that has no festival to point at. */
  birthdays?: ReadonlyArray<{ id: string; name: string; daysUntil: number }>;
};

const NO_BIRTHDAYS: ReadonlyArray<{ id: string; name: string; daysUntil: number }> = [];

/** The device's region, from its locale. Null when the device does not say. */
export function deviceRegion() {
  try {
    return regionFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return null;
  }
}

/**
 * The festival coach on the device: which festivals to put first for this person, who to wish for each, and the one
 * gentle nudge worth showing today. It reads the Vault and the history the screen already has, remembers what it
 * showed and what was snoozed, and counts a nudge as shown once per day.
 */
export function useFestivalCoach({ uid, now, people, entries, wishesReady, enabled, region: regionOverride, isPro = false, birthdays = NO_BIRTHDAYS }: Args) {
  const [state, setState] = useState<CoachState>(EMPTY_COACH_STATE);
  const [loaded, setLoaded] = useState(false);
  const region = useMemo(() => (regionOverride !== undefined ? regionOverride : deviceRegion()), [regionOverride]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    if (!uid) {
      setState(EMPTY_COACH_STATE);
      setLoaded(true);
      return undefined;
    }
    void readCoachState(uid).then((stored) => {
      if (cancelled) return;
      setState(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const coachPeople = useMemo(
    () => people.map((p) => ({ id: p.id, name: p.personName, relationship: p.relationshipType })),
    [people],
  );
  const wishes = useMemo(
    () => entries.map((e) => ({ recipientName: e.recipientName, templateType: e.templateType, createdAt: e.createdAt })),
    [entries],
  );

  const opportunities = useMemo(
    () => planOpportunities({ now, region, people: coachPeople, wishes, wishesReady, state }),
    [now, region, coachPeople, wishes, wishesReady, state],
  );
  // A plan, offered only to someone with no wish left who has a real reason to want one.
  const planPrompt = useMemo(
    () =>
      enabled && loaded
        ? choosePlanPrompt({ isPro, signedIn: uid !== null, wishesReady, opportunities, birthdays, state, now })
        : null,
    [enabled, loaded, isPro, uid, wishesReady, opportunities, birthdays, state, now],
  );
  // The prompt already names the festival and the people, so it replaces the nudge: Home says one thing at a time.
  // After "Not now" on a prompt, the nudge does not step into its place the same day.
  const promptedToday = !!state.lastPromptAt && new Date(state.lastPromptAt).toDateString() === now.toDateString();
  const nudge = useMemo(
    () => (enabled && loaded && !planPrompt && !promptedToday ? chooseNudge(opportunities, state, now, wishesReady) : null),
    [enabled, loaded, planPrompt, promptedToday, opportunities, state, now, wishesReady],
  );

  // A prompt counts as shown the first time it appears on a day.
  useEffect(() => {
    if (!planPrompt) return;
    const next = markPromptShown(state, planPrompt, now);
    if (next === state) return;
    setState(next);
    if (uid) void writeCoachState(uid, next);
    trackEvent(AnalyticsEvents.planPromptShown, { key: planPrompt.key, kind: planPrompt.kind });
  }, [planPrompt, state, now, uid]);

  // A nudge counts as shown the first time it appears on a day.
  useEffect(() => {
    if (!nudge) return;
    const next = markShown(state, nudge.opportunity, now);
    if (next === state) return;
    setState(next);
    if (uid) void writeCoachState(uid, next);
    trackEvent(AnalyticsEvents.festivalNudgeShown, {
      holiday: nudge.opportunity.holiday.id,
      score: nudge.opportunity.score,
      people: nudge.opportunity.suggested.length,
    });
  }, [nudge, state, now, uid]);

  /** "Not now": this festival stays quiet for the rest of the year. */
  const snoozeNudge = useCallback(() => {
    if (!nudge) return;
    const next = snooze(state, nudge.opportunity, new Date());
    setState(next);
    if (uid) void writeCoachState(uid, next);
    trackEvent(AnalyticsEvents.festivalNudgeDismissed, { holiday: nudge.opportunity.holiday.id });
  }, [nudge, state, uid]);

  /** "Not now" on a plan prompt: that reason stays quiet for a week. */
  const dismissPlanPrompt = useCallback(() => {
    if (!planPrompt) return;
    const next = dismissPrompt(state, planPrompt, new Date());
    setState(next);
    if (uid) void writeCoachState(uid, next);
    trackEvent(AnalyticsEvents.planPromptDismissed, { key: planPrompt.key, kind: planPrompt.kind });
  }, [planPrompt, state, uid]);

  return { opportunities, nudge, snoozeNudge, planPrompt, dismissPlanPrompt, region };
}
