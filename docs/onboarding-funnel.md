# First-run onboarding funnel

Five steps, one decision each. Value comes before the ask, and the plan screen is last.

| # | Step | The person does | What it is for |
|---|---|---|---|
| 1 | **Who** | Picks who they never want to forget | Commitment + personalisation; sets the audience |
| 2 | **Moment** | Picks the occasion; watches their card redraw | Investment; "this is already my card" |
| 3 | **Feel** | Opens a gift themselves, in their occasion's colours | The "aha": what the *recipient* experiences |
| 4 | **Remember** | Flips an auto-send preview and watches the real sequence light up | Shows the retention product and the 2-hour approval window |
| 5 | **Plan** | Compares Free / Pro with real store prices, or continues free | The ask, once, after value |

Finishing hands the answers to the Create flow: the first card starts pre-filled
(audience + occasion) and opens on **Photos** (`useOnboardingHandoff`). Skipping at
any step carries nothing over.

## Design rules (persuasive, not deceptive)

| Do | Never |
|---|---|
| Real store prices; yearly saving computed from them, shown only if ≥ 5% | Invented discounts, "was $X" anchors, countdown timers, "limited time" |
| Nothing pre-selected on the plan screen; the store shows its own confirmation | Pre-ticked upsells, hidden free option |
| Free path is a full-width, plainly labelled button; Skip on every step; Back on every step | Confirm-shaming ("No, I don't want…"), hiding Skip |
| Renewal, cancel-anywhere, Restore, Terms and Privacy visible beside the price | Fine print that is smaller than the CTA's neighbours, or missing |
| Compare table lists only what the app really enforces (`quota.ts`, `tierLimits.ts`) | Promising "365-day links", "no watermark", trials or WhatsApp auto-send (not true today) |
| Auto-send is *previewed*, nothing is armed or sent | Arming anything the person has not confirmed in the Vault |

`__tests__/onboarding/onboardingFlow.test.ts` fails if any copy gains an exclamation
mark, emoji or pressure wording, or if the compare table drifts from the real limits.

## Behaviour levers used, and why

* **Commitment / endowed progress**: two quick choices before anything else; five filled progress segments.
* **IKEA effect**: the card preview is theirs and changes with each choice.
* **Peak moment**: opening the gift is the only animated reward; one calm motion, no confetti.
* **Loss framing, not fear**: "Never miss your partner's day" describes the benefit of remembering.
* **Reciprocity**: first card free, said plainly, before any price appears.
* **Trust line under every button** (one honest sentence per step).

## Events (see `src/shared/analytics/events.ts`)

`onboarding_started` → `onboarding_step_viewed {step,index}` → `onboarding_audience_picked` →
`onboarding_occasion_picked` → `onboarding_gift_opened` → `onboarding_auto_send_previewed` →
`paywall_shown {source:'onboarding'}` → `onboarding_plan_selected {planId}` → `subscribe_success` |
`onboarding_completed {steps,plan,hasIntent}` → `onboarding_first_card_started` · also
`onboarding_skipped {step}` and `onboarding_restore_tapped`.

> **Gap:** `trackEvent` is still a dev-only `console.log` stub. Until a real analytics
> backend is wired, none of these reach a dashboard, so conversion cannot be measured.

## What to measure once analytics is live

step-by-step drop-off · skip rate by step · gift-open rate · auto-send-preview rate ·
plan-screen → purchase · yearly vs monthly mix · onboarding → first card shared ·
D7 retention and paid conversion by cohort (those who opened the gift vs those who skipped it).
Change one thing at a time and read activation and retention beside conversion.

## Files

`src/features/onboarding/` — domain (`onboardingFlow`, `onboardingPlans`), application
(`useOnboardingFlow`, `useOnboardingPlans`, `onboardingHandoff`, `useOnboardingHandoff`),
ui (`OnboardingScreen` + step components). Tests: `__tests__/onboarding/`.

## Known deviations from the repo's own guidance

`docs-site/content/ui-design-principles.md` §11 calls an "onboarding carousel before first
create" slop. The app already had a three-slide carousel; this replaces it with a
funnel the product owner asked for. It is skippable at every step and never required.
