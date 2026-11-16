# What Home shows, and when it asks for a sale

Home used to show everyone the same stack. Someone opening the app for the first time saw a badge journey with nothing in it, a wish balance and an empty Vault section. That is noise, and noise makes an app feel like work. Home now decides what to show from who is looking, puts the thing they most likely came to do first, and asks for a sale only at a moment when a plan would obviously help.

The rules are plain code in `src/features/create/domain/homePlan.ts` (pure, on the device, tested in `__tests__/create/homePlan.test.ts`). The screen is `CreateHomeScreen.tsx`; `homeBlocks.test.tsx` renders it for each kind of person.

## Who is looking

| Stage | Who | What Home shows, in order |
|---|---|---|
| New guest | Not signed in, nothing made | Festivals coming up, who it is for, the quick wish |
| New member | Signed in, nothing made yet | The same, plus the wish balance |
| Starting | One or two cards made | The festival reminder if there is one, festivals, who it is for, the quick wish, the balance, the badge journey, then the Vault (birthdays soon, or the prompt to save someone) |
| Regular | Three or more cards, made in the last 60 days | The reminder, **the quick wish first**, festivals, who it is for, the balance only when 3 or fewer wishes are left (or on Pro), birthdays soon, then the journey |
| Away | Last card more than 60 days ago | The reminder, festivals, the quick wish, who it is for, birthdays soon. **No journey or badges**, so there is no progress to feel behind on |

The greeting is always first. While the history is loading, Home shows a placeholder instead of an order it would have to change a moment later.

## When it asks for a sale

A plan prompt (a card that says what a plan is and offers "See plans") appears only when all of these hold:

- the person is signed in, is not on Pro, and has **no wish left** (`wishesReady === 0`; unknown is not zero);
- there is something they would obviously spend one on: a widely kept festival (or one they have sent before) within 14 days with people from the Vault it is for, or, failing that, a birthday in the Vault within 7 days;
- that reason has not been shown in the last 7 days or put away in the last 7 days, and no prompt was shown in the last 3 days (a prompt already showing today carries on through the day).

The words say what is on offer and nothing more:

> **Diwali is in 2 days**
> Mom and Priya are in your Vault and your wishes are used. One wish for each, or Occasio Pro for 24 cards a year.
> See plans · Not now

The free path is in the same sentence ("One wish for each"), the quick wish and the Who-is-it-for grid stay on the page, and "Not now" puts that reason away for a week.

Related rules:

- **One voice at a time.** The prompt replaces the festival nudge and the balance card (the balance card at zero already says "See plans"). After "Not now" the nudge does not step into its place that day.
- **The share screen.** After a festival card is made, if that was the last wish, "Wish someone else this Diwali" stops offering buttons that would start a card that cannot be finished. It names the people and offers "See plans" with the same words.
- **Pip stays off** the paywall and money screens, as before.

## What this does not do, on purpose

The request behind this was to make people "addicted". That is not built, because the project's own rules (calm, no guilt, no hype) and the store policies rule it out, and it would work against the thing that sells here: someone who trusts the app wishes people every year.

- No streaks that punish a missed day, no "you are about to lose" counters, no fake urgency or countdowns on offers.
- No hiding or shrinking the free path to push the paid one.
- No offer to someone who has wishes left, is on Pro, or is not signed in.
- Nothing pushed when the app is closed (see the push note in [festival-art-and-coach.md](festival-art-and-coach.md)).
- A test fails on exclamation marks, emoji, "last chance", "hurry", "don't miss" and "only N left" in any of this copy.

## Measuring it

Events: `plan_prompt_shown` (with the reason key and kind), `plan_prompt_tapped` (also sent from the share screen, with kind `share_success`), `plan_prompt_dismissed`. The numbers to watch: taps over shows (does the reason fit), dismissals over shows (is it too much), and whether purchases follow a tap. If dismissals are high, raise `PROMPT_REST_DAYS` or narrow the reasons before anything else.

## Tuning

Constants at the top of `homePlan.ts`: `LAPSED_AFTER_DAYS` (60), `LOW_WISHES` (3), `PROMPT_FESTIVAL_WITHIN_DAYS` (14), `PROMPT_BIRTHDAY_WITHIN_DAYS` (7), `PROMPT_REST_DAYS` (7), `PROMPT_MIN_GAP_DAYS` (3). The block lists are in `planHome`; the tests pin each stage's list, so a change shows exactly which promise it breaks.

## What has and has not been seen

- **Tested:** the stage and block rules, the prompt rules and caps, the saved state, the hook, the cards, and the whole Home screen rendered for a guest, a new member, a regular, someone away, and each sale case (`homePlan`, `festivalCoachUi` and `homeBlocks` tests).
- **Not seen on a device with real data:** the prompt card, the new ordering for a regular, and the share-screen "See plans" variant. Whether the copy converts is unknown until it has been live.
