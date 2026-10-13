# Occasio — ASO & launch strategy

Written as a launch plan, not a wish list. Where a number would need real store data (search volume, conversion rates) it says so instead of guessing.

## 1. Positioning (one sentence)

> **Occasio makes the people you love feel remembered — with cards they want to open, sent on the right day.**

| Layer | What we say | Why |
|---|---|---|
| Emotional hook (screenshot 1) | "Wishes they'll want to open" | The competitor set sells *making a card*. We sell *how the other person feels*. |
| Functional proof | Balloons, candles, 3D gift, 3D letter, Pip | Nobody scrolling a store can imagine "interactive card" — they have to *see* it. |
| Retention engine | Vault + auto-send with a review window | Cards are a one-off; remembering is the subscription. Trust (review before send) is the objection-handler. |
| Zero-friction growth loop | Recipients open a link, no install | Every card sent is an ad. The store listing must make the *sender* want to be the person who sends it. |

Primary audience (from the PRD): India-first 18–30s (partners, close friends) and "forgetful but caring" adult children 25–45 (parents' birthdays). Secondary: long-distance couples/families. Launch regions: India + US.

## 2. Keyword strategy

I can't see store search-volume data from here, so the clusters below are **hypotheses to validate** (Apple Ads → Keyword planner/popularity score, Play Console → Search terms, or AppTweak/Sensor Tower/AppFollow). The structure is what matters: every word appears **once** across title + subtitle + keyword field on iOS (Apple combines them), and the title carries the highest-weight terms on both stores.

| Cluster | Terms | Where it lives |
|---|---|---|
| Core intent (highest weight) | birthday, wish, cards | **Title** (both stores) |
| Differentiators | reminders, surprise, greetings | **iOS subtitle** · Play short description + description |
| Adjacent moments | anniversary, thanks, congrats | iOS keyword field · Play description (repeat naturally 2–3×) |
| Format | ecard, photo, interactive, gift | iOS keyword field · description |
| Recipients | mom, dad, partner, family, love | iOS keyword field · description |
| Retention | vault, remember | iOS keyword field |

Rules followed: no competitor or third-party brand names (WhatsApp, Instagram…) in keywords or title — both stores reject this; no repeated words; no plurals duplicated (Apple matches singular/plural); no emoji in title/subtitle; no price/ranking claims ("#1", "best").

**Title:** `Occasio: Birthday Wish Cards` (28/30). Brand first (so it's findable once people hear of it), then the highest-intent phrase.
**iOS subtitle:** `Reminders & Surprise Greetings` (30/30).
**Play short description** (indexed, and the only text above the fold): `Never miss a birthday. Send interactive cards they'll love to open.` (67/80).

Alternates to A/B (one variable at a time): `Occasio: Birthday Reminder & Cards` (reminder-led — test if reminder searches turn out larger than card searches), `Occasio: Cards They'll Open` (curiosity-led, weaker on keywords).

All limits are enforced by `python3 tools/check-listing.py` against `listing/metadata.json`.

## 3. Screenshot strategy

Rules applied: one idea per screenshot, ≤6-word headline, benefit before feature, first three carry the install decision, a visible system so the set reads as one story, and honest labelling.

| # | Headline | Job | Tag |
|---|---|---|---|
| 1 | Wishes they'll want to open | Category + emotion in one glance (Pip, the gift prompt) | What they receive |
| 2 | Pop. Blow. Unwrap. | Proves "interactive" — balloons → candles → gift | What they play |
| 3 | Never miss a birthday again | The retention promise; the Vault | In the app |
| 4 | Made in a few taps | Lowers effort anxiety (create flow) | In the app |
| 5 | A letter that opens in 3D | Premium moment, real craft | What they open |
| 6 | Five moments. Five looks. | Breadth beyond birthdays (widens search relevance) | What they receive |
| 7 | Even "No" gets a reaction | Humour = shareability, word of mouth | What they see |
| 8 | Photos, reasons & a letter | Personalisation depth | What they open |
| 9 *(iOS only)* | Collect stickers as you play | Gamification / replay value | What they collect |
| 10 *(iOS only)* | Made for everyone who matters | Closes on the relationship, not the tech | In the app |

**Why the tags.** Seven of ten screens show what the *recipient* opens (a web page), not screens inside the app. Apple (2.3.3) and Google both want screenshots to represent the app, so each slide says plainly whether it is "In the app" or "What they receive". That is also a clearer story for users: you create here → they open a link. Keep at least three "In the app" slides.

**Why colour per slide.** The five moments each have a hue (coral, marigold, rose, green, blue, violet, teal). Rotating them makes the carousel feel alive and quietly previews the "five looks" idea. White headlines sit on the deep end of each gradient (contrast ≥ 4.5:1 checked with `contrastWhite()` in `tools/design.mjs`).

## 4. Experiment plan (after launch, not before)

You need traffic before tests mean anything; don't test in week 1.

| Order | Store tool | Variable | Hypothesis | Primary metric |
|---|---|---|---|---|
| 1 | Play *Store listing experiments* / Apple *Product Page Optimization* | Screenshot **1** (hero) — Pip gate vs. cake scene | The cake is more instantly "birthday" than the mascot | Listing → install CVR |
| 2 | same | Screenshot **order** — put Vault (3) first vs. third | Utility-minded users (reminders) convert on retention, not play | CVR; check D7 retention doesn't drop |
| 3 | same | **Icon** — Pip + date badge (what ships) vs. a heart-led challenger from `docs/store-assets/images/icons/v2/` | One of them wins on search-result tap-through | Tap-through (Apple) / CVR (Play) |
| 4 | Play only | **Short description** variants | Reminder-led vs. card-led | CVR |

Run one test at a time, ≥ 7 days and a full weekly cycle, and only call a winner at the tool's confidence threshold. Always read **install → first card created** and **D1/D7 retention** next to CVR: a variant that wins installs but loses activation is a loss.

## 5. Localisation

| Locale | Priority | Notes |
|---|---|---|
| en-US, en-IN, en-GB | Launch | Same copy; en-IN is the primary market. |
| **hi-IN** | Next | Draft included in `metadata.json` — **have a native speaker review before use**. Hindi store listings face far fewer competitors for the same intent. Needs Devanagari screenshots (Noto Sans Devanagari; the build system supports it — ask and I'll generate). |
| es-MX/es-ES, pt-BR, ar | Later | Gift-card behaviour is strong there; only after the Hindi/English funnel is measured. |

## 6. Ratings & reviews

- Ask for a rating at a moment of success, not at launch: right after the user **shares their first card** and sees the share confirmation (iOS `SKStoreReviewController` / Play In-App Review API, both rate-limited by the OS).
- Don't pre-filter by sentiment ("Do you like the app?" → only happy users get sent to the store). Google's In-App Review guidelines say not to pre-screen, and both stores prohibit manipulating ratings.
- Reply to every review within 48 h. Template for a bug report: *"Thank you — sorry about that. Could you email [support] with your phone model and what you tapped? We'll fix it and reply here."* For praise: name the feature they mentioned.
- Goal to track: ≥ 4.3 average before spending on paid acquisition (rating is a conversion multiplier on both stores).

## 7. Seasonal / campaign calendar

Create **Custom Product Pages** (Apple) and **Custom store listings** (Google Play) per campaign, with matching ad groups, so the screenshots mirror the search. Confirm movable dates each year.

| Campaign | Timing | Angle |
|---|---|---|
| Valentine's Day | 14 Feb | Anniversary/romance slides (rose hue) |
| Mother's Day | 2nd Sunday of May | "For mom" — the Home screen's person tiles |
| Father's Day | 3rd Sunday of June | "For dad" |
| Friendship Day (India) | 1st Sunday of August | Best-friend angle; humour (Pip) |
| Raksha Bandhan | Aug (varies) | Siblings — new template idea |
| Diwali | Oct/Nov (varies) | Family/thank-you |
| Year-end | Dec | Thank-you cards, "end of year" |

## 8. Launch checklist

- [ ] Final package/bundle IDs decided and consistent (see risks) — **can't change after publishing**
- [ ] Privacy policy, Terms and Delete-account pages live (they exist: `/privacy`, `/terms`, `/delete-account`)
- [ ] Support email set in `docs-site/src/lib/legal.ts` and store consoles
- [ ] Play: Data safety, Content rating, Target audience, Ads declaration, App access (reviewer instructions below)
- [ ] App Store: Privacy "nutrition labels", Age rating, Export compliance, Subscription group + localisations + review screenshot
- [ ] Upload from `out/` (see README map)
- [ ] Review notes + demo links (below)
- [ ] Day-1 dashboard: impressions, page views, CVR, installs, first-card rate, crash-free sessions
- [ ] Week-2 retention read before any experiment

### Reviewer / App-access notes (paste into both consoles)

> Occasio works without an account for creating and sharing a card (guest mode). Sign-in (Google or email) is only needed to save people to the Vault, use auto-send, or manage a subscription.
> To see what a recipient opens, visit: https://occasio-greetings.vercel.app/c/demo-birthday-maya-1408
> Passcode-protected example (code **1408**): https://occasio-greetings.vercel.app/c/demo-locked-maya-1408
> Account deletion: Account tab → Delete account, or https://occasio-greetings.vercel.app/delete-account

## 9. Risks & things I could not verify

| Item | Risk | Action |
|---|---|---|
| Real person's face in slide 4 ("Choose a frame") | Likeness/consent | Retake that screen with a stock or consenting person's photo, or accept the risk knowingly |
| Group photo in slides 5 and 8 | It's an Unsplash demo photo — licence is fine, model releases aren't guaranteed | Replace with your own licensed photo for a commercial listing |
| Recipient screens are a web page | Store review may ask "where is this in the app?" | Tags on the slides + reviewer notes above; keep ≥ 3 native slides |
| Auto-send delivery channels | Only **email** is real today; WhatsApp/SMS aren't live | Copy says "prepare the card for you on the day". **Don't** promise WhatsApp/SMS auto-send until it ships |
| "Delete your account … inside the app" | Verified in code earlier this project (Account → delete → `DELETE /v1/account`) | Re-test on a release build |
| Subscription copy | Apple requires price/period/renewal text and Terms/Privacy links | Fill `[PRICE]` in the iOS description; add the same to the in-app paywall |
| Bundle/package IDs | `com.occasio` vs `com.occasio.greetings` (Firebase has both) vs `com.occasio.ios` | Decide **before** first publish; they are permanent |
| `aps-environment` is `development` | Push won't work in production | Switch to `production` for release builds |
| Android set uses iOS-captured native screens in a Pixel-style frame | Looks fine, but not strictly "screenshots from Android" | Recapture native screens on a Pixel emulator and re-run `build.sh` (drop PNGs into `src/raw/`) |
