# 07: Onboarding funnel (Pip, dream → fear → relief → offer)

You asked for two things: fix the onboarding UI, and use the character from the recipient web gate (Pip) to carry the emotion: a dream, a fear, then some urgency. This is built, type-checked, tested and walked through on the iPhone 17 Pro Max simulator. Nothing is committed.

**One rule I held throughout:** the emotion is allowed to be strong; the facts are not allowed to be invented. Every number on screen is either the person's own date counting down or something the app really enforces. There is no timer, no "only N left", no fake social proof, and no shaming. A test fails the build if any of that creeps in (§5).

---

## 1. What was wrong (audit of the old flow)

Screens: `images/onboarding/before-1-who.png`, `before-2-moment.png`, `before-3-gift.png`.

**UI**

| # | Problem | Evidence |
|---|---|---|
| U1 | The audience tiles were meant to be a 2-column grid but wrapped into one column and ran under the button. The cause: tiles are `48%` wide and the container also had a horizontal `gap`, so two never fit on a row. | before-1 |
| U2 | The "moment" step was a flat card plus a pile of chips, with no mood and a lot of dead space. | before-2 |
| U3 | The gift was a generic red box, with none of the character that the recipient actually meets on the web. | before-3 |
| U4 | Every step looked the same: the same sans headline, the same background, no change of pace. | all |
| U5 | The offer came with a comparison table above the plans, so the price was below the fold. | old plan step |

**Funnel**

| # | Problem | Why it costs sales |
|---|---|---|
| F1 | No emotional arc. The old flow showed features, then asked for money. | People pay to avoid a feeling or to get one, not for a feature list. |
| F2 | It never asked for the date. | A real date is the only honest urgency we have, and it is also the best signal of intent. |
| F3 | The offer came before the person had felt why they would want it. | |
| F4 | One claim, that the card is "sent to them" automatically, is not verified live. | It is a refund and review risk (guideline 2.3 / 3.1.2). The new copy says the person approves and sends. |
| F5 | No character, so nothing carried over from the recipient's web page, which is where much of the word of mouth happens. | |

---

## 2. The new funnel

Screens: `images/onboarding/after-1-who.png` … `after-6-offer.png` (1320 × 2868, the 6.9" size).

| Step | Emotion | What happens | Button | Event |
|---|---|---|---|---|
| 1 **who** | Warmth, a small commitment | Pip says hi. "Who do you never want to forget?" Six tiles. | Continue (needs a pick) | `onboarding_audience_picked` |
| 2 **when** | Investment | "When is Mom's birthday?" Birthday/Anniversary chip, a date, and an honest escape: "I'll add the date later". | Continue (needs a real date) | `onboarding_date_set` / `onboarding_date_skipped` |
| 3 **dream** | **Dream** | "Picture Mom opening this." They tap Pip's gift: Pip jumps for joy, confetti, the actual card appears in the occasion's colours. "That look when someone feels remembered." | Continue | `onboarding_gift_opened` |
| 4 **fear** | **Fear** | "Now picture the day you forget." Pip cries and plays the tiny violin (the same joke the recipient gate makes). Their own countdown: "Mom's birthday is in 5 days." | **I won't forget** (a small pledge) | `onboarding_pledged` |
| 5 **ready** | **Relief + honest urgency** | "Be ready before Mom's birthday." Winking Pip. The real auto-send sequence lights up one row at a time, ending on the 2-hour review window. If the day is within 30 days: "That is close. A card takes about two minutes." | See the plans | |
| 6 **offer** | Resolution | "Never be the one who forgot." Their countdown again as the anchor, the plans (yearly first, saving computed from the real prices), a compact free-vs-Pro table, renewal terms, Restore, Terms, Privacy. | **Start with my free card** (or buy a plan) | `onboarding_plan_selected`, `onboarding_completed` |

The free path is as easy as the paid one: "Your first card is free either way." The person lands in Create at step 2 of 5 with audience and occasion already filled in (verified on the simulator).

### Why this order

1. **Dream first** makes the person feel what the *other* person feels, so the reason to pay is already theirs.
2. **Fear second, once**, while they hold their own date in mind. One screen, no repetition.
3. **Relief immediately after** so the fear does not stay with them. The button promises a solution, not a threat.
4. **The offer last**, framed as the way to keep the promise they just made ("I won't forget").
5. **Urgency is only ever real**: a date they typed in. If they skip the date, there is no number anywhere and no urgency line. The funnel works either way (tested).

---

## 3. Copy deck (all in `src/features/onboarding/domain/onboardingFlow.ts`)

- who: "Who do you never want to forget?" · Pip: "Hi, I'm Pip. I help people remember."
- when: "When is {Mom's birthday}?" · "I'll count the days for you." · skip: "I'll add the date later" · trust: "Only used to count the days. It stays on this phone."
- dream: "Picture {Mom} opening this." · "Tap the gift." → "That look when someone feels remembered. You can give it every year." · "They open it from a link in their browser. No app or account needed."
- fear: "Now picture the day you forget." · "A late “happy birthday” never lands the same. {Mom's birthday} comes once a year, and it does not wait." · pill: "{Mom's birthday} is in N days." · button: "I won't forget"
- ready: "Be ready before {Mom's birthday}." · "Save the date once. Occasio prepares the card on the day, and you approve it before anything is sent." · Pip: "Leave the remembering to me." · urgency (only if ≤ 30 days): "That is close. A card takes about two minutes."
- offer: "Never be the one who forgot." · "Start free and upgrade when it helps. Your first card is free whichever you choose." · Pip: "Let us remember them together."

The personalisation uses the relationship (Mom, your partner, your best friend…), never a name.

---

## 4. Honesty guardrails

| We do | We do not |
|---|---|
| Use their own date to count down | Show a timer, "ends tonight", or "only N left" |
| Say a card takes about two minutes (it does) | Invent a number of users, cards or stars |
| Say the person approves and sends the card | Claim the card is sent to the recipient automatically (not verified live) |
| Say the first card is free either way | Pre-select a plan, hide the free path, or use "No thanks, I don't care" style buttons |
| Show real store prices and a saving computed from them | Show a discount that is not real |
| Allow Skip on every step and Back from step 2 | Trap them in a step (even "date" has an escape) |

**On the product principles:** `§7` of the product principles says "invitation, not guilt." The fear step deliberately goes closer to the line than that principle, because you asked for it. It stays on the right side by naming the cost (a late greeting) instead of blaming the person, by using no number and no shaming words, and by making the next screen the fix. If you want to dial it down, change the one sentence in `stepCopy('fear')`. If you want it stronger, test it first (§6).

---

## 5. What is built and how it is checked

**Code** (all under `src/`):
- New: `shared/ui/Pip.tsx` (the mascot, ported from the web), `shared/theme/tokens.ts` (`mascot` palette), onboarding `StepBackdrop`, `PipStage`, `PipSays`, `DateStep`, `DreamStep`, `FearStep`, `ReadyStep`, `OfferStep`, `onboardingStyle.ts`.
- Rewritten: `onboardingFlow.ts` (domain), `useOnboardingFlow.ts`, `OnboardingScreen.tsx`, `AutoSendTimeline.tsx`.
- Changed: `PlanStep.tsx` (plans before the compare table), `AudienceChoiceTile.tsx` (unselected tiles have no outline), `events.ts` (three new events).
- Removed: `GiftReveal`, `CardPreview`, `OccasionChoice`.
- Fixed the grid: `rowGap` instead of `gap`, so the 48% tiles share a row.
- Animations are finite (`PIP_BOB_CYCLES`), so the accessibility tree can refresh.

**Checks run:**
- `npx tsc --noEmit`: clean.
- `npx jest`: 38 suites, 346 tests, all passing (onboarding: 46).
- `npx eslint` on the changed files: 0 errors; 5 `no-void` warnings, the same fire-and-forget style the rest of the app uses.
- **Tone guard** (`__tests__/onboarding/onboardingFlow.test.ts`) scans every line of copy for every audience and both occasions: no `!`, no emoji, no pressure phrases (limited time, last chance, act now, expires…), no invented counts or social proof, no shaming, and no digits except the person's own countdown, the 2-hour window and the real tier caps.
- **Claims tests** tie the compare table to the real quota and tier caps and to the Vault's auto-send gate.
- Walked on the simulator: who → when (real date picker) → dream (open the gift) → fear → ready → offer → free card → Create prefilled. Also the no-date path.

---

## 6. How to measure it (and what I cannot promise)

I cannot tell you the lift: there is no baseline data (production analytics was a stub, and it is now consent-gated, so only people who accept analytics are counted). Treat the first two weeks as the baseline.

**Funnel to watch** (events above plus `onboarding_step_viewed`):
`started → who → when → dream → fear → ready → offer → completed`, then paid vs free at the offer, then first card created.

**Tests, in this order** (one at a time, enough traffic for each; see `05-growth-plan.md` §0 on sample size):

| # | Change | Hypothesis | Success metric |
|---|---|---|---|
| T1 | Remove the fear step | If completion rises but paid conversion drops, fear is doing work; if neither moves, drop it and keep the flow shorter | Offer → paid, onboarding completion |
| T2 | Require vs allow skipping the date | A real date raises intent; forcing it may cost completion | Completion, paid conversion for dated vs undated |
| T3 | Move the offer to **after the first shared card** (the free path stays) | People who have already felt a recipient's reply pay more | Paid conversion, first-card rate |
| T4 | Yearly pre-highlighted vs equal weight | Highlight is already on yearly; test removing it only if refunds rise | Plan mix, refund rate |

---

## 7. Things you should know

1. **The date they type is not saved.** It is used for the countdown and then dropped (the screen says so: "It stays on this phone"). The biggest remaining conversion lever is to carry it into the Vault as their first saved person, so "Save the date once" has already happened. It needs a Vault write at the end of onboarding, so I left it for your call.
2. **A birthday gate now sits in front of onboarding.** It comes from the age-check work (`src/features/age`) that is going on in this repo; I did not touch it. A date of birth asked before any value is shown is a common drop point. If you want to test moving it to just before the first card is created, that is a decision for whoever owns that feature and for the legal side.
3. **Store prices differ.** The offer shows RevenueCat's prices: right now the Test Store's $79.99 / $9.99, while App Store Connect has $19.99 / $2.99. Align them before release; the saving ("Save 33%") is computed from whatever the store returns.
4. **Auto-send wording is conservative on purpose** ("you approve it… then you send it in one tap"). Change it only when automatic delivery is verified live (see the claims gate in `03-positioning.md`).
5. **Review screenshot for the in-app purchases:** `after-6-offer.png` is the right size (1320 × 2868) and is a real paywall, but it shows the Test Store prices. Retake it once the prices match App Store Connect, then upload it to the three products.
6. **The date field defaults to today and shows a year**, which looks odd for "Mom's birthday". The year is ignored. A day-and-month picker would be cleaner, but `DateField` is shared with other screens.
7. **Simulator housekeeping:** to get past the age gate on the simulator I temporarily wrote a marker into its local storage; I removed it afterwards, along with the onboarding-complete flag, so the simulator behaves as it did before.
8. Other people (or tools) were editing files in this repo while I worked (analytics consent, billing, auth). Fast Refresh reset my screen a few times during the walk-through because of that; it is not an onboarding bug.
